const { GoogleGenerativeAI } = require('@google/generative-ai');
const {
  SYSTEM_PROMPT,
  TRIP_SEARCH_EXTRACTION_PROMPT,
  INTENT_CLASSIFICATION_PROMPT,
  FAQ_SYSTEM_PROMPT,
  CONVERSATIONAL_RESPONSE_PROMPT,
} = require('../prompts');

class GoogleAIService {
  constructor() {
    if (!process.env.GOOGLE_AI_API_KEY) {
      throw new Error('GOOGLE_AI_API_KEY is not configured');
    }

    // DO NOT customize apiVersion - SDK automatically uses v1beta
    this.client = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY);
    this.modelName = process.env.GOOGLE_AI_MODEL || 'gemini-2.5-flash';
    this.temperature = parseFloat(process.env.GOOGLE_AI_TEMPERATURE) || 0.7;
    this.maxTokens = parseInt(process.env.GOOGLE_AI_MAX_TOKENS) || 1000;
    
    // Get the generative model
    this.model = this.client.getGenerativeModel({ 
      model: this.modelName 
    });

    console.log(`✅ Google AI Service initialized with model: ${this.modelName}`);
  }

  /**
   * Convert OpenAI-style messages to Gemini prompt format
   */
  _convertMessagesToPrompt(messages) {
    return messages.map(msg => {
      const role = msg.role === 'assistant' ? 'Model' : msg.role === 'system' ? 'System' : 'User';
      return `${role}: ${msg.content}`;
    }).join('\n\n');
  }

  /**
   * Generate a chat completion
   * @param {Array} messages - Array of message objects with role and content
   * @param {Object} options - Additional options (temperature, maxTokens, etc.)
   */
  async chatCompletion(messages, options = {}) {
    try {
      const prompt = this._convertMessagesToPrompt(messages);
      
      // Use standard generateContent without any API version customization
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      return {
        content: text,
        finishReason: 'stop',
        usage: {
          prompt_tokens: 0,
          completion_tokens: 0,
          total_tokens: 0,
        },
      };
    } catch (error) {
      console.error('❌ Google AI API Error:', error);
      throw error;
    }
  }

  /**
   * Extract trip search parameters from natural language query
   * @param {String} userMessage - User's query
   * @param {Array} conversationHistory - Previous messages for context
   */
  async extractTripSearchParams(userMessage, conversationHistory = []) {
    const messages = [
      { role: 'system', content: TRIP_SEARCH_EXTRACTION_PROMPT },
      ...conversationHistory,
      { role: 'user', content: userMessage },
    ];

    try {
      const result = await this.chatCompletion(messages, {
        temperature: 0.3,
        maxTokens: 500,
      });

      const jsonMatch = result.content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.warn('⚠️ No JSON found in extraction response');
        return null;
      }

      const extracted = JSON.parse(jsonMatch[0]);
      console.log('📍 Extracted trip search params:', extracted);

      return extracted;
    } catch (error) {
      console.error('❌ Error extracting trip search params:', error);
      return null;
    }
  }

  /**
   * Classify user intent
   * @param {String} userMessage - User's query
   * @param {Array} conversationHistory - Previous messages
   */
  async classifyIntent(userMessage, conversationHistory = []) {
    const messages = [
      { role: 'system', content: INTENT_CLASSIFICATION_PROMPT },
      ...conversationHistory,
      { role: 'user', content: userMessage },
    ];

    try {
      const result = await this.chatCompletion(messages, {
        temperature: 0.3,
        maxTokens: 100,
      });

      const content = result.content.toLowerCase().trim();
      const validIntents = ['trip_search', 'booking', 'faq', 'general'];

      for (const intent of validIntents) {
        if (content.includes(intent)) {
          console.log(`🎯 Classified intent: ${intent}`);
          return intent;
        }
      }

      console.log('🎯 Classified intent: general (default)');
      return 'general';
    } catch (error) {
      console.error('❌ Error classifying intent:', error);
      return 'general';
    }
  }

  /**
   * Generate a conversational response
   * @param {String} userMessage - User's query
   * @param {Array} conversationHistory - Previous messages
   * @param {Object} context - Additional context
   */
  async generateResponse(userMessage, conversationHistory = [], context = {}) {
    let systemPrompt = CONVERSATIONAL_RESPONSE_PROMPT;

    if (context.tripResults) {
      systemPrompt += `\n\nAvailable trips:\n${JSON.stringify(context.tripResults, null, 2)}`;
    }

    if (context.bookingData) {
      systemPrompt += `\n\nBooking context:\n${JSON.stringify(context.bookingData, null, 2)}`;
    }

    const messages = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory,
      { role: 'user', content: userMessage },
    ];

    try {
      const result = await this.chatCompletion(messages);
      return result.content;
    } catch (error) {
      console.error('❌ Error generating response:', error);
      return 'I apologize, but I encountered an error. Please try again.';
    }
  }

  /**
   * Answer FAQ questions
   * @param {String} question - User's question
   */
  async answerFAQ(question) {
    const messages = [
      { role: 'system', content: FAQ_SYSTEM_PROMPT },
      { role: 'user', content: question },
    ];

    try {
      const result = await this.chatCompletion(messages, {
        temperature: 0.5,
        maxTokens: 500,
      });

      return result.content;
    } catch (error) {
      console.error('❌ Error answering FAQ:', error);
      return 'I apologize, but I cannot answer that question right now. Please contact our support team.';
    }
  }

  /**
   * Format trip results for display
   * @param {Array} trips - Trip search results
   */
  formatTripResults(trips) {
    if (!trips || trips.length === 0) {
      return 'No trips found matching your criteria.';
    }

    return trips
      .map(
        (trip, index) =>
          `${index + 1}. ${trip.origin} → ${trip.destination}
   Departure: ${trip.departureTime}
   Arrival: ${trip.arrivalTime}
   Price: $${trip.price}
   Available seats: ${trip.availableSeats}
   Bus type: ${trip.busType}`
      )
      .join('\n\n');
  }
}

module.exports = new GoogleAIService();
