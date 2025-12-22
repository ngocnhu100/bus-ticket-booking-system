const googleAIService = require('./googleAIService');
const tripServiceClient = require('./tripServiceClient');
const bookingServiceClient = require('./bookingServiceClient');
const conversationRepository = require('../repositories/conversationRepository');
const { getRedisClient } = require('../redis');
const {
  generateSessionId,
  normalizeDate,
  normalizeCityName,
  formatTripsForChat,
  buildConversationContext,
} = require('../utils/helpers');

class ChatbotService {
  /**
   * Process a user query
   */
  async processQuery(sessionId, message, userId = null, authToken = null) {
    try {
      // Get or create session
      let session;
      if (sessionId) {
        session = await conversationRepository.getSession(sessionId);
        if (!session) {
          throw new Error('Session not found');
        }
      } else {
        session = await conversationRepository.createSession(userId);
        sessionId = session.session_id;
      }

      // Update session activity
      await conversationRepository.updateSessionActivity(sessionId);

      // Get conversation history
      const history = await conversationRepository.getMessageHistory(sessionId);
      const conversationContext = buildConversationContext(history);

      // Save user message
      await conversationRepository.saveMessage(sessionId, 'user', message);

      // Classify intent
      const intent = await googleAIService.classifyIntent(message);
      console.log('[ChatbotService] Detected intent:', intent);

      let response;
      let actions = [];

      // Handle based on intent
      switch (intent.intent) {
        case 'search_trips':
          response = await this.handleTripSearch(message, conversationContext, sessionId);
          break;

        case 'book_trip':
          response = await this.handleBookingIntent(message, conversationContext, sessionId, authToken);
          break;

        case 'ask_faq':
          response = await this.handleFAQ(message, conversationContext);
          break;

        case 'cancel_booking':
          response = await this.handleCancellation(message, conversationContext, sessionId, authToken);
          break;

        default:
          response = await googleAIService.generateResponse(message, conversationContext);
      }

      // Save assistant response
      const assistantMessage = await conversationRepository.saveMessage(
        sessionId,
        'assistant',
        response.text || response,
        { intent: intent.intent, actions: response.actions || [] }
      );

      // Generate suggestions
      const suggestions = [];
      // Note: Google AI doesn't have direct suggestions API, implement if needed

      return {
        sessionId,
        response: {
          text: response.text || response,
          intent: intent.intent,
          entities: response.entities || {},
          suggestions: response.suggestions || suggestions,
          actions: response.actions || [],
        },
        messageId: assistantMessage.message_id,
      };
    } catch (error) {
      console.error('[ChatbotService] Error processing query:', error);
      throw error;
    }
  }

  /**
   * Handle trip search queries
   */
  async handleTripSearch(message, conversationContext, sessionId) {
    try {
      // Extract trip search parameters
      const extracted = await googleAIService.extractTripSearchParams(message, conversationContext);
      console.log('[ChatbotService] Extracted params:', extracted);

      // Normalize extracted data
      if (extracted.origin) {
        extracted.origin = normalizeCityName(extracted.origin);
      }
      if (extracted.destination) {
        extracted.destination = normalizeCityName(extracted.destination);
      }
      if (extracted.date) {
        extracted.date = normalizeDate(extracted.date);
      }

      // Check if we have enough information
      if (extracted.missing && extracted.missing.length > 0) {
        const missingFields = extracted.missing.join(', ');
        return {
          text: `To search for trips, I need some more information. Please provide: ${missingFields}`,
          entities: extracted,
          suggestions: [
            'I want to go from Ho Chi Minh City to Da Nang',
            'Search for tomorrow',
            'Show trips for 2 passengers',
          ],
        };
      }

      // Search for trips
      const searchParams = {
        origin: extracted.origin,
        destination: extracted.destination,
        date: extracted.date,
        passengers: extracted.passengers || 1,
      };

      if (extracted.preferences) {
        if (extracted.preferences.timeOfDay) {
          searchParams.timeOfDay = extracted.preferences.timeOfDay;
        }
        if (extracted.preferences.busType) {
          searchParams.busType = extracted.preferences.busType;
        }
        if (extracted.preferences.maxPrice) {
          searchParams.maxPrice = extracted.preferences.maxPrice;
        }
      }

      const searchResult = await tripServiceClient.searchTrips(searchParams);

      if (!searchResult.success || !searchResult.data || searchResult.data.length === 0) {
        return {
          text: `I couldn't find any trips from ${extracted.origin} to ${extracted.destination} on ${extracted.date}. Would you like to try a different date or route?`,
          entities: extracted,
          suggestions: [
            'Try tomorrow',
            'Search different route',
            'Show all available routes',
          ],
        };
      }

      const trips = searchResult.data;
      const formattedTrips = formatTripsForChat(trips, 5);

      // Save search context
      await conversationRepository.saveBookingContext(sessionId, {
        searchParams,
        searchResults: trips.slice(0, 5),
      });

      return {
        text: `I found ${trips.length} trips from ${extracted.origin} to ${extracted.destination} on ${extracted.date}. Here are the top options:`,
        entities: extracted,
        actions: [
          {
            type: 'search_results',
            data: formattedTrips,
          },
        ],
        suggestions: [
          'Show morning trips',
          'Filter by price',
          'Book the first trip',
        ],
      };
    } catch (error) {
      console.error('[ChatbotService] Error handling trip search:', error);
      return {
        text: 'I encountered an error while searching for trips. Please try again or contact support if the problem persists.',
        entities: {},
      };
    }
  }

  /**
   * Handle booking intent
   */
  async handleBookingIntent(message, conversationContext, sessionId, authToken) {
    try {
      // Get booking context
      const bookingContext = await conversationRepository.getBookingContext(sessionId);

      if (!bookingContext || !bookingContext.searchResults) {
        return {
          text: 'Please search for trips first before booking.',
          suggestions: [
            'Search trips from Ho Chi Minh City to Da Nang',
            'Find trips for tomorrow',
          ],
        };
      }

      // Use AI to understand which trip and seats user wants to book
      const bookingInfoPrompt = `Extract booking information from this message: "${message}"
      
Available trips: ${JSON.stringify(bookingContext.searchResults)}

Return JSON with:
{
  "tripIndex": number (0-based index of trip from search results, or null),
  "tripId": string (if mentioned, or null),
  "seats": array of seat numbers (or null),
  "needsMoreInfo": boolean
}`;

      const response = await googleAIService.chatCompletion([
        { role: 'user', content: bookingInfoPrompt }
      ], { temperature: 0.3 });

      const bookingInfo = JSON.parse(response.content);

      // Update booking context
      const updatedContext = { ...bookingContext };

      if (bookingInfo.tripIndex !== null && bookingContext.searchResults[bookingInfo.tripIndex]) {
        updatedContext.selectedTrip = bookingContext.searchResults[bookingInfo.tripIndex];
      } else if (bookingInfo.tripId) {
        updatedContext.selectedTrip = { tripId: bookingInfo.tripId };
      }

      if (bookingInfo.seats && bookingInfo.seats.length > 0) {
        updatedContext.selectedSeats = bookingInfo.seats;
      }

      await conversationRepository.saveBookingContext(sessionId, updatedContext);

      // Check what information we still need
      if (!updatedContext.selectedTrip) {
        return {
          text: 'Which trip would you like to book? Please specify the trip number or departure time.',
          suggestions: [
            'Book trip #1',
            'Book the morning trip',
            'Show trip details',
          ],
        };
      }

      if (!updatedContext.selectedSeats) {
        const tripId = updatedContext.selectedTrip.tripId || updatedContext.selectedTrip.trip_id;
        // Get available seats
        try {
          const seatsData = await tripServiceClient.getAvailableSeats(tripId);
          return {
            text: 'Which seat(s) would you like to book?',
            actions: [
              {
                type: 'seat_selection',
                data: seatsData,
              },
            ],
            suggestions: [
              'Book seat A1',
              'Book seats A1, A2',
              'Show seat map',
            ],
          };
        } catch (error) {
          return {
            text: 'Please specify which seat(s) you would like to book (e.g., A1, A2).',
          };
        }
      }

      if (!updatedContext.passengerInfo) {
        return {
          text: 'Great! Now I need passenger information:\n- Full name\n- ID/Passport number\n- Phone number\n- Email (optional)',
          suggestions: [
            'My name is Nguyen Van A',
            'Enter passenger details',
          ],
        };
      }

      // All information collected - ready to create booking
      return {
        text: 'I have all the information needed. To proceed with booking, please use the /chatbot/book endpoint with your details.',
        actions: [
          {
            type: 'ready_to_book',
            data: updatedContext,
          },
        ],
      };
    } catch (error) {
      console.error('[ChatbotService] Error handling booking:', error);
      return {
        text: 'I encountered an error while processing your booking request. Please try again.',
      };
    }
  }

  /**
   * Handle FAQ questions
   */
  async handleFAQ(question, conversationContext) {
    try {
      const answer = await googleAIService.answerFAQ(question, conversationContext);
      return {
        text: answer,
        suggestions: [
          'Ask another question',
          'Search for trips',
          'Contact support',
        ],
      };
    } catch (error) {
      console.error('[ChatbotService] Error handling FAQ:', error);
      return {
        text: 'I apologize, but I encountered an error. Please contact our support team for assistance.',
      };
    }
  }

  /**
   * Handle cancellation requests
   */
  async handleCancellation(message, conversationContext, sessionId, authToken) {
    // Extract booking reference from message
    const referenceMatch = message.match(/\b[A-Z]{2}\d{11}\b/);
    
    if (!referenceMatch) {
      return {
        text: 'To cancel a booking, please provide your booking reference number (format: BK20251115001).',
        suggestions: [
          'My booking reference is BK20251115001',
        ],
      };
    }

    try {
      const reference = referenceMatch[0];
      const preview = await bookingServiceClient.getCancellationPreview(reference, authToken);

      return {
        text: `Cancellation details for booking ${reference}:\n- Refund amount: ${preview.data.refundAmount} VND\n- Cancellation fee: ${preview.data.fee} VND\n\nWould you like to proceed?`,
        actions: [
          {
            type: 'cancellation_preview',
            data: preview.data,
          },
        ],
        suggestions: [
          'Yes, cancel booking',
          'No, keep booking',
          'Contact support',
        ],
      };
    } catch (error) {
      return {
        text: 'I could not find that booking. Please check the reference number and try again.',
      };
    }
  }

  /**
   * Create booking through chatbot
   */
  async createBooking(sessionId, tripId, seats, passengerInfo, authToken = null) {
    try {
      // Build passengers array with seat codes for each seat
      const passengers = seats.map((seatCode) => ({
        fullName: passengerInfo.fullName,
        phone: passengerInfo.phone,
        documentId: passengerInfo.documentId,
        seatCode: seatCode,
      }));

      const bookingData = {
        tripId,
        seats: seats,
        passengers: passengers,
        contactEmail: passengerInfo.email || '',
        contactPhone: passengerInfo.phone,
        isGuestCheckout: !authToken,
      };

      const result = await bookingServiceClient.createBooking(bookingData, authToken);

      // Clear booking context
      await conversationRepository.saveBookingContext(sessionId, {});

      return {
        success: true,
        bookingId: result.data.booking_id,
        bookingReference: result.data.booking_reference,
        message: `Booking created successfully! Your booking reference is ${result.data.booking_reference}. Please complete payment within 10 minutes.`,
        paymentInfo: result.data.payment_info,
      };
    } catch (error) {
      console.error('[ChatbotService] Error creating booking:', error);
      throw error;
    }
  }

  /**
   * Get conversation history
   */
  async getConversationHistory(sessionId) {
    try {
      const messages = await conversationRepository.getMessageHistory(sessionId);
      return messages;
    } catch (error) {
      console.error('[ChatbotService] Error getting history:', error);
      throw error;
    }
  }

  /**
   * Reset conversation
   */
  async resetConversation(sessionId) {
    try {
      await conversationRepository.deleteSessionMessages(sessionId);
      await conversationRepository.saveBookingContext(sessionId, {});
      return { success: true, message: 'Conversation reset successfully' };
    } catch (error) {
      console.error('[ChatbotService] Error resetting conversation:', error);
      throw error;
    }
  }

  /**
   * Save user feedback
   */
  async saveFeedback(sessionId, messageId, rating, comment) {
    try {
      await conversationRepository.saveFeedback(sessionId, messageId, rating, comment);
      return { success: true, message: 'Feedback saved successfully' };
    } catch (error) {
      console.error('[ChatbotService] Error saving feedback:', error);
      throw error;
    }
  }
}

module.exports = new ChatbotService();
