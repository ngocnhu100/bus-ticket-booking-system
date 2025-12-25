const OpenAI = require('openai');
const {
  SYSTEM_PROMPT,
  TRIP_SEARCH_EXTRACTION_PROMPT,
  INTENT_CLASSIFICATION_PROMPT,
  FAQ_SYSTEM_PROMPT,
  CONVERSATIONAL_RESPONSE_PROMPT,
} = require('../prompts');

class GroqAIService {
  constructor() {
    if (!process.env.GROQ_AI_API_KEY) {
      throw new Error('GROQ_AI_API_KEY is not configured');
    }

    this.client = new OpenAI({
      apiKey: process.env.GROQ_AI_API_KEY,
      baseURL: 'https://api.groq.com/openai/v1',
    });

    this.modelName = process.env.GROQ_AI_MODEL || 'llama3-8b-8192';
    this.temperature = parseFloat(process.env.GROQ_AI_TEMPERATURE) || 0.7;
    this.maxTokens = parseInt(process.env.GROQ_AI_MAX_TOKENS) || 1000;

    console.log(`✅ Groq AI Service initialized with model: ${this.modelName}`);
  }

  /**
   * Generate a chat completion
   * @param {Array} messages - Array of message objects with role and content
   * @param {Object} options - Additional options (temperature, maxTokens, etc.)
   */
  async chatCompletion(messages, options = {}) {
    try {
      const temperature = options.temperature || this.temperature;
      const maxTokens = options.maxTokens || this.maxTokens;

      const completion = await this.client.chat.completions.create({
        model: this.modelName,
        messages: messages,
        temperature: temperature,
        max_tokens: maxTokens,
      });

      const choice = completion.choices[0];
      return {
        content: choice.message.content,
        finishReason: choice.finish_reason,
        usage: completion.usage,
      };
    } catch (error) {
      console.error('❌ Groq AI API Error:', error);
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

      console.log('Raw extraction response:', result.content.substring(0, 200));

      // Try to extract JSON - be more careful with parsing
      let extracted = null;
      const jsonMatch = result.content.match(/\{[\s\S]*\}/);

      if (jsonMatch) {
        try {
          // Try to parse the matched JSON
          extracted = JSON.parse(jsonMatch[0]);
          console.log('✅ Successfully parsed JSON');
        } catch (parseError) {
          console.warn('⚠️ JSON parsing failed, retrying with cleanup:', parseError.message);

          // Try to find valid JSON by looking for common JSON structure
          const jsonStart = result.content.indexOf('{');
          if (jsonStart !== -1) {
            // Find the last closing brace that might be part of the JSON
            let braceCount = 0;
            let jsonEnd = -1;

            for (let i = jsonStart; i < result.content.length; i++) {
              if (result.content[i] === '{') braceCount++;
              if (result.content[i] === '}') {
                braceCount--;
                if (braceCount === 0) {
                  jsonEnd = i + 1;
                  break;
                }
              }
            }

            if (jsonEnd > jsonStart) {
              const cleanJson = result.content.substring(jsonStart, jsonEnd);
              try {
                extracted = JSON.parse(cleanJson);
                console.log('✅ Successfully parsed cleaned JSON');
              } catch (cleanError) {
                console.warn('⚠️ Even cleaned JSON failed to parse:', cleanError.message);
              }
            }
          }
        }
      }

      // If we still don't have extracted data, fall back to pattern matching
      if (!extracted) {
        console.warn('⚠️ No valid JSON found, using fallback pattern matching');
        const origin =
          this.extractCity(userMessage, [
            'sài gòn',
            'ho chi minh',
            'hồ chí minh',
            'hcm',
            'tphcm',
            'tp.hcm',
          ]) || this.extractCityFromHistory(conversationHistory, 'origin');

        const destination =
          this.extractCity(userMessage, [
            'đà lạt',
            'đà nẵng',
            'hà nội',
            'hanoi',
            'nha trang',
            'huế',
          ]) || this.extractCityFromHistory(conversationHistory, 'destination');

        const dateMatch = userMessage.match(
          /(\d{1,2}[/-]\d{1,2}(?:[/-]\d{4})?|ngày mai|mai|hôm nay|today|tomorrow|tháng \d+|month|tuần tới|tuần sau|next week)/i
        );
        const dateStr = dateMatch ? dateMatch[1] : null;
        const date =
          this.convertDateToISO(dateStr) || this.extractDateFromHistory(conversationHistory);

        extracted = {
          intent: 'search_trips',
          origin: origin || null,
          destination: destination || null,
          date: date || null,
          passengers: 1,
          missing: [
            !origin ? 'origin' : null,
            !destination ? 'destination' : null,
            !date ? 'date' : null,
          ].filter(Boolean),
        };
      }

      // Normalize city names from English to Vietnamese
      if (extracted.origin) {
        extracted.origin = this.normalizeCityName(extracted.origin);
      }
      if (extracted.destination) {
        extracted.destination = this.normalizeCityName(extracted.destination);
      }

      // Convert date to ISO format if present
      if (extracted.date) {
        extracted.date = this.convertDateToISO(extracted.date) || extracted.date;
      }

      console.log('📍 Extracted trip search params:', extracted);

      return extracted;
    } catch (error) {
      console.error('❌ Error extracting trip search params:', error);
      return null;
    }
  }

  /**
   * Normalize city name from English/any format to Vietnamese database format
   */
  normalizeCityName(cityName) {
    if (!cityName) return null;

    const lowerCity = cityName.toLowerCase().trim();

    // Map all variations to standardized English city names (matching database)
    const cityNormalizationMap = {
      'ho chi minh city': 'Ho Chi Minh City',
      'ho chi minh': 'Ho Chi Minh City',
      'sai gon': 'Ho Chi Minh City',
      'saigon': 'Ho Chi Minh City',
      'hcm': 'Ho Chi Minh City',
      'tphcm': 'Ho Chi Minh City',
      'hồ chí minh': 'Ho Chi Minh City',
      'da lat': 'Da Lat',
      'dalat': 'Da Lat',
      'đà lạt': 'Da Lat',
      'da nang': 'Da Nang',
      'danang': 'Da Nang',
      'đà nẵng': 'Da Nang',
      'hanoi': 'Hanoi',
      'ha noi': 'Hanoi',
      'hà nội': 'Hanoi',
      'nha trang': 'Nha Trang',
      'nha trang city': 'Nha Trang',
      'hue': 'Hue',
      'huế': 'Hue',
      'can tho': 'Can Tho',
      'cần thơ': 'Can Tho',
      'sapa': 'Sapa',
      'sa pa': 'Sapa',
      'hai phong': 'Hai Phong',
      'hải phòng': 'Hai Phong',
    };

    return cityNormalizationMap[lowerCity] || cityName;
  }

  /**
   * Helper method to extract city from text
   */
  extractCity(text, cityKeywords) {
    const lowerText = text.toLowerCase();
    for (const keyword of cityKeywords) {
      if (lowerText.includes(keyword)) {
        const cityMap = {
          'sài gòn': 'Hồ Chí Minh',
          'ho chi minh': 'Hồ Chí Minh',
          'hồ chí minh': 'Hồ Chí Minh',
          hcm: 'Hồ Chí Minh',
          tphcm: 'Hồ Chí Minh',
          'đà lạt': 'Đà Lạt',
          dalat: 'Đà Lạt',
          'đà nẵng': 'Đà Nẵng',
          danang: 'Đà Nẵng',
          'hà nội': 'Hanoi',
          hanoi: 'Hanoi',
          'nha trang': 'Nha Trang',
          huế: 'Huế',
        };
        return cityMap[keyword] || keyword;
      }
    }
    return null;
  }

  /**
   * Convert natural language date to YYYY-MM-DD format
   */
  convertDateToISO(dateString) {
    if (!dateString) return null;

    const lowerDate = dateString.toLowerCase().trim();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // FIRST: Check if already in ISO format (YYYY-MM-DD) - return as-is!
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      console.log(`[groqAIService] Date already in ISO format: ${dateString}`);
      return dateString;
    }

    // Handle Vietnamese and English date phrases
    if (lowerDate.includes('hôm nay') || lowerDate.includes('today')) {
      return this.formatDateToISO(today);
    }

    if (
      lowerDate.includes('ngày mai') ||
      lowerDate.includes('mai') ||
      lowerDate.includes('tomorrow')
    ) {
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      return this.formatDateToISO(tomorrow);
    }

    if (lowerDate.includes('ngày kia') || lowerDate.includes('day after tomorrow')) {
      const dayAfter = new Date(today);
      dayAfter.setDate(dayAfter.getDate() + 2);
      return this.formatDateToISO(dayAfter);
    }

    // Handle "next month", "next week", etc.
    if (
      lowerDate.includes('next month') ||
      lowerDate.includes('tháng tới') ||
      lowerDate.includes('tháng sau')
    ) {
      const nextMonth = new Date(today);
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      nextMonth.setDate(1); // First day of next month
      return this.formatDateToISO(nextMonth);
    }

    if (
      lowerDate.includes('next week') ||
      lowerDate.includes('tuần tới') ||
      lowerDate.includes('tuần sau')
    ) {
      const nextWeek = new Date(today);
      nextWeek.setDate(nextWeek.getDate() + 7);
      return this.formatDateToISO(nextWeek);
    }

    // Handle specific date formats like "25/12", "25-12", "25/12/2025", "25-12-2025" (DD/MM/YYYY format)
    const datePattern = /(\d{1,2})[/-](\d{1,2})(?:[/-](\d{4}))?/;
    const match = dateString.match(datePattern);
    if (match) {
      const day = parseInt(match[1], 10);
      const month = parseInt(match[2], 10);
      const year = match[3] ? parseInt(match[3], 10) : today.getFullYear();

      // Validate month
      if (month < 1 || month > 12) {
        console.warn(`[groqAIService] Invalid month: ${month}`);
        return null;
      }

      const date = new Date(year, month - 1, day);
      // Validate day
      if (date.getMonth() !== month - 1 || date.getDate() !== day) {
        console.warn(`[groqAIService] Invalid day: ${day} for month ${month}`);
        return null;
      }

      return this.formatDateToISO(date);
    }

    console.warn(`[groqAIService] Could not parse date: ${dateString}`);
    return null;
  }

  /**
   * Format date object to YYYY-MM-DD string
   */
  formatDateToISO(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * Extract city from conversation history (by type: origin or destination)
   */
  extractCityFromHistory(conversationHistory, type = 'origin') {
    if (!conversationHistory || conversationHistory.length === 0) return null;

    // City mapping with all variations
    const cityPatterns = {
      'Ho Chi Minh City': [
        'sài gòn',
        'ho chi minh',
        'hồ chí minh',
        'hcm',
        'tphcm',
        'tp.hcm',
        'saigon',
      ],
      Hanoi: ['hà nội', 'ha noi', 'hanoi'],
      'Da Nang': ['đà nẵng', 'da nang', 'danang'],
      'Da Lat': ['đà lạt', 'da lat', 'dalat'],
      'Nha Trang': ['nha trang'],
      Hue: ['huế', 'hue'],
    };

    // Search through conversation history (reverse order, most recent first)
    for (let i = conversationHistory.length - 1; i >= 0; i--) {
      const msg = conversationHistory[i];
      const content = (msg.content || '').toLowerCase();

      // Try to find any city pattern
      for (const [cityName, keywords] of Object.entries(cityPatterns)) {
        for (const keyword of keywords) {
          if (content.includes(keyword)) {
            console.log(`✅ Found city from history: ${cityName} (keyword: ${keyword})`);
            return cityName;
          }
        }
      }
    }

    return null;
  }

  /**
   * Extract date from conversation history
   */
  extractDateFromHistory(conversationHistory) {
    // Search through conversation history for dates
    const datePatterns = [
      /(\d{4})-(\d{2})-(\d{2})/, // ISO format
      /(\d{1,2})[/-](\d{1,2})(?:[/-](\d{4}))?/, // dd/mm or dd/mm/yyyy
      /tháng\s+(\d{1,2})(?:\s+năm\s+(\d{4}))?/i, // tháng X or tháng X năm YYYY
    ];

    for (let i = conversationHistory.length - 1; i >= 0; i--) {
      const msg = conversationHistory[i];
      const content = msg.content || '';

      // Check for "năm sau" / "năm tới" (next year) pattern
      const nextYearMatch = content.match(/tháng\s+(\d{1,2})(?:\s*(?:năm\s+)?(?:sau|tới))?/i);
      if (nextYearMatch && content.match(/năm\s+(?:sau|tới)/i)) {
        const month = nextYearMatch[1].padStart(2, '0');
        const year = new Date().getFullYear() + 1;
        console.log(`✅ Found next year date: ${year}-${month}-01`);
        return `${year}-${month}-01`;
      }

      // Check for tháng X năm YYYY pattern
      const thangMatch = content.match(/tháng\s+(\d{1,2})(?:\s+năm\s+(\d{4}))?/i);
      if (thangMatch) {
        const month = thangMatch[1].padStart(2, '0');
        const year = thangMatch[2] || new Date().getFullYear();
        console.log(`✅ Found tháng pattern: ${year}-${month}-01`);
        return `${year}-${month}-01`;
      }

      // Check for ISO format
      const isoMatch = content.match(/(\d{4})-(\d{2})-(\d{2})/);
      if (isoMatch) {
        return isoMatch[0];
      }

      // Check for dd/mm format
      const dmMatch = content.match(/(\d{1,2})[/-](\d{1,2})(?:[/-](\d{4}))?/);
      if (dmMatch) {
        const day = dmMatch[1].padStart(2, '0');
        const month = dmMatch[2].padStart(2, '0');
        const year = dmMatch[3] || new Date().getFullYear();
        return `${year}-${month}-${day}`;
      }
    }

    return null;
  }

  /**
   * Classify user intent from message
   * @param {String} userMessage - User's message
   * @param {Array} conversationHistory - Previous conversation context
   */
  async classifyIntent(userMessage, conversationHistory = []) {
    const messages = [
      { role: 'system', content: INTENT_CLASSIFICATION_PROMPT },
      ...conversationHistory,
      { role: 'user', content: userMessage },
    ];

    try {
      const result = await this.chatCompletion(messages, {
        temperature: 0.2,
        maxTokens: 200,
      });

      const jsonMatch = result.content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.warn('⚠️ No JSON found in intent classification response');
        return { intent: 'unknown', confidence: 0 };
      }

      const classification = JSON.parse(jsonMatch[0]);
      console.log('🎯 Classified intent:', classification);

      return classification;
    } catch (error) {
      console.error('❌ Error classifying intent:', error);
      return { intent: 'unknown', confidence: 0 };
    }
  }

  /**
   * Generate FAQ response
   * @param {String} userMessage - User's question
   * @param {Array} conversationHistory - Previous conversation context
   */
  async generateFAQResponse(userMessage, conversationHistory = []) {
    const messages = [
      { role: 'system', content: FAQ_SYSTEM_PROMPT },
      ...conversationHistory,
      { role: 'user', content: userMessage },
    ];

    try {
      const result = await this.chatCompletion(messages, {
        temperature: 0.7,
        maxTokens: 800,
      });

      return result.content;
    } catch (error) {
      console.error('❌ Error generating FAQ response:', error);
      return 'I apologize, but I encountered an error while processing your question. Please try again.';
    }
  }

  /**
   * Generate conversational response
   * @param {String} userMessage - User's message
   * @param {Array} conversationHistory - Previous conversation context
   * @param {Object} context - Additional context (trips, booking info, etc.)
   */
  async generateConversationalResponse(userMessage, conversationHistory = [], context = {}) {
    let systemPrompt = CONVERSATIONAL_RESPONSE_PROMPT;

    // Add context information to system prompt
    if (context.trips) {
      systemPrompt += `\n\nAvailable trips:\n${JSON.stringify(context.trips, null, 2)}`;
    }

    if (context.booking) {
      systemPrompt += `\n\nCurrent booking:\n${JSON.stringify(context.booking, null, 2)}`;
    }

    const messages = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory,
      { role: 'user', content: userMessage },
    ];

    try {
      const result = await this.chatCompletion(messages, {
        temperature: 0.8,
        maxTokens: 1000,
      });

      return result.content;
    } catch (error) {
      console.error('❌ Error generating conversational response:', error);
      return 'I apologize, but I encountered an error while generating a response. Please try again.';
    }
  }

  /**
   * Generate booking confirmation response
   * @param {Object} bookingData - Booking details
   * @param {Array} conversationHistory - Previous conversation context
   */
  async generateBookingConfirmation(bookingData, conversationHistory = []) {
    const systemPrompt = `You are a helpful bus ticket booking assistant. Generate a confirmation message for the following booking:

${JSON.stringify(bookingData, null, 2)}

Keep the response friendly, clear, and include next steps for the user.`;

    const messages = [{ role: 'system', content: systemPrompt }, ...conversationHistory];

    try {
      const result = await this.chatCompletion(messages, {
        temperature: 0.7,
        maxTokens: 600,
      });

      return result.content;
    } catch (error) {
      console.error('❌ Error generating booking confirmation:', error);
      return 'Your booking has been confirmed! You will receive a confirmation email shortly.';
    }
  }

  /**
   * Generate conversational response (alias for generateConversationalResponse)
   * @param {String} userMessage - User's message
   * @param {Array} conversationHistory - Previous conversation context
   * @param {Object} context - Additional context (trips, booking info, etc.)
   */
  async generateResponse(userMessage, conversationHistory = [], context = {}) {
    return this.generateConversationalResponse(userMessage, conversationHistory, context);
  }

  /**
   * Generate FAQ response (alias for generateFAQResponse)
   * @param {String} userMessage - User's question
   * @param {Array} conversationHistory - Previous conversation context
   */
  async answerFAQ(userMessage, conversationHistory = []) {
    return this.generateFAQResponse(userMessage, conversationHistory);
  }
}

module.exports = new GroqAIService();
