const groqAIService = require('./groqAIService');
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
  constructor() {
    this.responses = {
      missing_info: {
        en: 'To search for trips, I need some more information. Please provide: ${missingFields}',
        vi: 'Để tìm chuyến đi, tôi cần thêm thông tin. Vui lòng cung cấp: ${missingFields}',
      },
      missing_info_suggestions: {
        en: [
          'I want to go from Ho Chi Minh City to Da Nang',
          'Search for tomorrow',
          'Show trips for 2 passengers',
        ],
        vi: [
          'Tôi muốn đi từ Thành phố Hồ Chí Minh đến Đà Nẵng',
          'Tìm chuyến mai',
          'Hiển thị chuyến cho 2 hành khách',
        ],
      },
      no_trips_found: {
        en: "I couldn't find any trips from ${origin} to ${destination} on ${date}. Would you like to try a different date or route?",
        vi: 'Tôi không tìm thấy chuyến nào từ ${origin} đến ${destination} vào ${date}. Bạn có muốn thử ngày khác hoặc tuyến đường khác không?',
      },
      no_trips_suggestions: {
        en: ['Try tomorrow', 'Search different route', 'Show all available routes'],
        vi: ['Thử ngày mai', 'Tìm tuyến khác', 'Hiển thị tất cả tuyến có sẵn'],
      },
      trips_found: {
        en: 'I found ${count} trips from ${origin} to ${destination} on ${date}. Here are the top options:',
        vi: 'Tôi tìm thấy ${count} chuyến từ ${origin} đến ${destination} vào ${date}. Dưới đây là các lựa chọn hàng đầu:',
      },
      trips_found_suggestions: {
        en: ['Show morning trips', 'Filter by price', 'Book the first trip'],
        vi: ['Hiển thị chuyến sáng', 'Lọc theo giá', 'Đặt chuyến đầu tiên'],
      },
      search_error: {
        en: 'I encountered an error while searching for trips. Please try again or contact support if the problem persists.',
        vi: 'Tôi gặp lỗi khi tìm kiếm chuyến đi. Vui lòng thử lại hoặc liên hệ hỗ trợ nếu vấn đề vẫn tiếp tục.',
      },
      search_first: {
        en: 'Please search for trips first before booking.',
        vi: 'Vui lòng tìm chuyến đi trước khi đặt vé.',
      },
      search_first_suggestions: {
        en: ['Search trips from Ho Chi Minh City to Da Nang', 'Find trips for tomorrow'],
        vi: ['Tìm chuyến từ Thành phố Hồ Chí Minh đến Đà Nẵng', 'Tìm chuyến cho ngày mai'],
      },
      which_trip: {
        en: 'Which trip would you like to book? Please specify the trip number or departure time.',
        vi: 'Bạn muốn đặt chuyến nào? Vui lòng chỉ định số chuyến hoặc giờ khởi hành.',
      },
      which_trip_suggestions: {
        en: ['Book trip #1', 'Book the morning trip', 'Show trip details'],
        vi: ['Đặt chuyến #1', 'Đặt chuyến sáng', 'Hiển thị chi tiết chuyến'],
      },
      which_seats: {
        en: 'Which seat(s) would you like to book?',
        vi: 'Bạn muốn đặt ghế nào?',
      },
      which_seats_suggestions: {
        en: ['Book seat A1', 'Book seats A1, A2', 'Show seat map'],
        vi: ['Đặt ghế A1', 'Đặt ghế A1, A2', 'Hiển thị sơ đồ ghế'],
      },
      specify_seats: {
        en: 'Please specify which seat(s) you would like to book (e.g., A1, A2).',
        vi: 'Vui lòng chỉ định ghế nào bạn muốn đặt (ví dụ: A1, A2).',
      },
      passenger_info: {
        en: 'Great! Now I need passenger information:\n- Full name\n- ID/Passport number\n- Phone number\n- Email (optional)',
        vi: 'Tuyệt! Bây giờ tôi cần thông tin hành khách:\n- Họ tên đầy đủ\n- Số CMND/Hộ chiếu\n- Số điện thoại\n- Email (tùy chọn)',
      },
      passenger_info_suggestions: {
        en: ['My name is Nguyen Van A', 'Enter passenger details'],
        vi: ['Tên tôi là Nguyễn Văn A', 'Nhập thông tin hành khách'],
      },
      ready_to_book: {
        en: 'Perfect! I have all the information needed. You can now proceed with booking without creating an account.',
        vi: 'Hoàn hảo! Tôi đã có tất cả thông tin cần thiết. Bạn có thể tiếp tục đặt vé mà không cần tạo tài khoản.',
      },
      guest_booking_ready: {
        en: 'Great! You can proceed with guest checkout. You do not need to create an account to complete this booking.',
        vi: 'Tuyệt vời! Bạn có thể tiếp tục thanh toán khách. Bạn không cần tạo tài khoản để hoàn tất đặt vé này.',
      },
      booking_error: {
        en: 'I encountered an error while processing your booking request. Please try again.',
        vi: 'Tôi gặp lỗi khi xử lý yêu cầu đặt vé của bạn. Vui lòng thử lại.',
      },
      faq_suggestions: {
        en: ['Ask another question', 'Search for trips', 'Contact support'],
        vi: ['Hỏi câu khác', 'Tìm chuyến đi', 'Liên hệ hỗ trợ'],
      },
      faq_error: {
        en: 'I apologize, but I encountered an error. Please contact our support team for assistance.',
        vi: 'Tôi xin lỗi, nhưng tôi gặp lỗi. Vui lòng liên hệ đội ngũ hỗ trợ để được trợ giúp.',
      },
      cancel_no_ref: {
        en: 'To cancel a booking, please provide your booking reference number (format: BK20251115001).',
        vi: 'Để hủy đặt vé, vui lòng cung cấp số tham chiếu đặt vé (định dạng: BK20251115001).',
      },
      cancel_no_ref_suggestions: {
        en: ['My booking reference is BK20251115001'],
        vi: ['Số tham chiếu đặt vé của tôi là BK20251115001'],
      },
      cancel_details: {
        en: 'Cancellation details for booking ${ref}:\n- Refund amount: ${refund} VND\n- Cancellation fee: ${fee} VND\n\nWould you like to proceed?',
        vi: 'Chi tiết hủy đặt vé cho ${ref}:\n- Số tiền hoàn lại: ${refund} VND\n- Phí hủy: ${fee} VND\n\nBạn có muốn tiếp tục không?',
      },
      cancel_suggestions: {
        en: ['Yes, cancel booking', 'No, keep booking', 'Contact support'],
        vi: ['Có, hủy đặt vé', 'Không, giữ đặt vé', 'Liên hệ hỗ trợ'],
      },
      cancel_not_found: {
        en: 'I could not find that booking. Please check the reference number and try again.',
        vi: 'Tôi không tìm thấy đặt vé đó. Vui lòng kiểm tra số tham chiếu và thử lại.',
      },
      booking_success: {
        en: 'Booking created successfully! Your booking reference is ${ref}. Please complete payment within 10 minutes.',
        vi: 'Đặt vé thành công! Số tham chiếu đặt vé của bạn là ${ref}. Vui lòng hoàn tất thanh toán trong vòng 10 phút.',
      },
      reset_success: {
        en: 'Conversation reset successfully',
        vi: 'Đặt lại cuộc trò chuyện thành công',
      },
      feedback_success: {
        en: 'Feedback saved successfully',
        vi: 'Phản hồi đã được lưu thành công',
      },
    };
  }
  /**
   * Process a user query
   */
  async processQuery(sessionId, message, userId = null, authToken = null, actionData = null) {
    console.log('[ChatbotService] Processing query:', {
      sessionId,
      message: message.substring(0, 100),
      userId,
      hasAuthToken: !!authToken,
      hasActionData: !!actionData,
    });
    try {
      // Get or create session
      let session;
      if (sessionId) {
        console.log('[ChatbotService] Retrieving existing session:', sessionId);
        session = await conversationRepository.getSession(sessionId);
        if (!session) {
          throw new Error('Session not found');
        }
      } else {
        console.log('[ChatbotService] Creating new session for user:', userId);
        session = await conversationRepository.createSession(userId);
        sessionId = session.session_id;
      }

      console.log('[ChatbotService] Session ready:', sessionId);

      // Update session activity
      await conversationRepository.updateSessionActivity(sessionId);

      // Get conversation history
      const history = await conversationRepository.getMessageHistory(sessionId);
      const conversationContext = buildConversationContext(history);

      console.log('[ChatbotService] Retrieved conversation history:', history.length, 'messages');

      // Save user message
      await conversationRepository.saveMessage(sessionId, 'user', message);

      // Detect language
      const lang = this.detectLanguage(message) || 'en'; // Default to English

      console.log('[ChatbotService] Detected language:', lang);

      // Classify intent
      const intent = await groqAIService.classifyIntent(message);

      console.log('[ChatbotService] Detected intent:', intent);

      let response;
      let actions = [];

      // Handle based on intent
      switch (intent.intent) {
        case 'search_trips':
          console.log('[ChatbotService] Handling trip search intent');
          response = await this.handleTripSearch(message, conversationContext, sessionId, lang);
          break;

        case 'book_trip':
          console.log('[ChatbotService] Handling booking intent');
          response = await this.handleBookingIntent(
            message,
            conversationContext,
            sessionId,
            authToken,
            lang,
            actionData
          );
          break;

        case 'ask_faq':
          console.log('[ChatbotService] Handling FAQ intent');
          response = await this.handleFAQ(message, conversationContext, lang);
          break;

        case 'cancel_booking':
          console.log('[ChatbotService] Handling cancellation intent');
          response = await this.handleCancellation(
            message,
            conversationContext,
            sessionId,
            authToken,
            lang
          );
          break;

        default:
          console.log('[ChatbotService] Handling default/general response');
          response = await groqAIService.generateResponse(message, conversationContext);
          break;
      }

      console.log('[ChatbotService] Response generated:', {
        hasText: !!response.text,
        hasActions: !!(response.actions && response.actions.length),
      });

      // Save assistant response
      const messageContent =
        typeof response === 'string'
          ? response
          : response.text || 'I apologize, but I encountered an error processing your request.';
      console.log('[ChatbotService] Saving assistant message:', messageContent.substring(0, 100));
      const assistantMessage = await conversationRepository.saveMessage(
        sessionId,
        'assistant',
        messageContent,
        { intent: intent.intent, actions: response.actions || [] }
      );

      // Generate suggestions
      const suggestions = [];
      // Note: Google AI doesn't have direct suggestions API, implement if needed

      console.log('[ChatbotService] Query processing complete, returning response');
      return {
        sessionId,
        response: {
          text:
            typeof response === 'string'
              ? response
              : response.text || 'I apologize, but I encountered an error processing your request.',
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
  async handleTripSearch(message, conversationContext, sessionId, lang) {
    console.log('[ChatbotService] Starting trip search:', {
      message: message.substring(0, 100),
      sessionId,
      lang,
    });
    let searchParams = null;
    try {
      // Check if user is asking to show all routes (remove date filter)
      const showAllPattern =
        /hiển thị|show (all|available|every)|tất cả|all routes|without date|bỏ ngày|không ngày/i;
      const isShowAllRequest = showAllPattern.test(message);

      // Get previous search context to preserve origin/destination
      let extracted = await groqAIService.extractTripSearchParams(message, conversationContext);
      console.log('[ChatbotService] Extracted params:', extracted);
      console.log('[ChatbotService] Show all request:', isShowAllRequest);

      // Handle extraction failure
      if (!extracted) {
        // If it's a show all request, try to get the last search from context
        if (isShowAllRequest && conversationContext && conversationContext.lastSearch) {
          console.log('[ChatbotService] Using previous search context for show all request');
          extracted = conversationContext.lastSearch;
        } else {
          console.log('[ChatbotService] Extraction failed, returning error response');
          return {
            text:
              lang === 'vi'
                ? 'Xin lỗi, tôi không hiểu rõ yêu cầu của bạn. Vui lòng cung cấp: điểm khởi hành, điểm đến và ngày đi.'
                : 'I did not understand your request clearly. Please provide: origin, destination, and travel date.',
            entities: {},
            suggestions: this.responses.missing_info_suggestions[lang],
          };
        }
      }

      // If this is a show all request, remove the date constraint
      if (isShowAllRequest) {
        console.log('[ChatbotService] Removing date constraint for show all request');
        extracted.date = null;
      }

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

      // Set default values for optional fields
      if (!extracted.passengers || extracted.passengers < 1) {
        extracted.passengers = 1;
      }

      // Remove optional fields from missing list (date, passengers are optional)
      if (extracted.missing && Array.isArray(extracted.missing)) {
        extracted.missing = extracted.missing.filter(
          (f) => f !== 'date' && f !== 'passengers' && f !== 'preferences'
        );
      }

      // Check if we have enough information (only origin and destination are required)
      const hasMissing =
        extracted.missing &&
        ((Array.isArray(extracted.missing) && extracted.missing.length > 0) ||
          (typeof extracted.missing === 'string' && extracted.missing.trim().length > 0));

      if (hasMissing) {
        const missingArray = Array.isArray(extracted.missing)
          ? extracted.missing
          : [extracted.missing];

        // Translate field names to Vietnamese if needed
        const translatedMissing = missingArray.map((field) => {
          if (lang === 'vi') {
            const translations = {
              date: 'ngày',
              origin: 'điểm khởi hành',
              destination: 'điểm đến',
              passengers: 'số hành khách',
            };
            return translations[field] || field;
          }
          return field;
        });

        const missingFields = translatedMissing.join(', ');
        return {
          text: this.responses.missing_info[lang].replace('${missingFields}', missingFields),
          entities: extracted,
          suggestions: this.responses.missing_info_suggestions[lang],
        };
      }

      // Search for trips
      const searchParams = {
        origin: extracted.origin,
        destination: extracted.destination,
        passengers: extracted.passengers || 1,
      };

      // Only add date if it's provided
      if (extracted.date) {
        searchParams.date = extracted.date;
      }

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

      console.log('[ChatbotService] Searching for trips with params:', searchParams);
      const searchResult = await tripServiceClient.searchTrips(searchParams);
      console.log('[ChatbotService] Trip search result:', {
        success: searchResult.success,
        tripCount: searchResult.data ? searchResult.data.length : 0,
      });

      // Save the last search parameters for "show all" requests
      console.log('[ChatbotService] Saving booking context for last search');
      await conversationRepository.saveBookingContext(sessionId, {
        lastSearch: {
          origin: extracted.origin,
          destination: extracted.destination,
          passengers: extracted.passengers,
          preferences: extracted.preferences,
        },
      });

      if (!searchResult.success || !searchResult.data || searchResult.data.length === 0) {
        const dateStr = extracted.date
          ? lang === 'vi'
            ? ` vào ${extracted.date}`
            : ` on ${extracted.date}`
          : '';
        const noTripsMsg =
          lang === 'vi'
            ? `Tôi không tìm thấy chuyến nào từ ${extracted.origin} đến ${extracted.destination}${dateStr}. Bạn có muốn thử ngày khác hoặc tuyến đường khác không?`
            : `I couldn't find any trips from ${extracted.origin} to ${extracted.destination}${dateStr}. Would you like to try a different date or route?`;

        return {
          text: noTripsMsg,
          entities: extracted,
          suggestions: this.responses.no_trips_suggestions[lang],
        };
      }

      const trips = searchResult.data;
      const formattedTrips = formatTripsForChat(trips, 5);

      // Save search context for future "show all" requests
      await conversationRepository.saveBookingContext(sessionId, {
        searchParams,
        searchResults: trips.slice(0, 5),
        lastSearch: {
          origin: extracted.origin,
          destination: extracted.destination,
          passengers: extracted.passengers,
          preferences: extracted.preferences,
        },
      });

      const dateStr = extracted.date
        ? lang === 'vi'
          ? ` vào ${extracted.date}`
          : ` on ${extracted.date}`
        : '';
      const tripsFoundMsg =
        lang === 'vi'
          ? `Tôi tìm thấy ${trips.length} chuyến khách từ ${extracted.origin} đến ${extracted.destination}${dateStr}. Chọn một chuyến để tiếp tục.`
          : `I found ${trips.length} trips from ${extracted.origin} to ${extracted.destination}${dateStr}. Select one to continue.`;

      return {
        text: tripsFoundMsg,
        entities: extracted,
        actions: [
          {
            type: 'search_results',
            data: formattedTrips,
          },
        ],
        suggestions: this.responses.trips_found_suggestions[lang],
      };
    } catch (error) {
      console.error('[ChatbotService] Error handling trip search:', error);
      console.error('[ChatbotService] Error details:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
        searchParams: searchParams,
      });

      // Provide user-friendly error messages
      const errorMsg = error.message || '';
      const isValidationError = error.response?.status === 422;

      if (isValidationError) {
        console.error('[ChatbotService] Validation error details:', error.response?.data);
        return {
          text:
            lang === 'vi'
              ? 'Xin lỗi, tôi không thể tìm chuyến với thông tin bạn cung cấp. Vui lòng kiểm tra và thử lại.'
              : "Sorry, I couldn't search for trips with the information you provided. Please check and try again.",
          entities: {},
          suggestions:
            lang === 'vi'
              ? ['Tìm chuyến khác', 'Thay đổi ngày']
              : ['Search another route', 'Change the date'],
        };
      }

      return {
        text: this.responses.search_error[lang],
        entities: {},
      };
    }
  }

  /**
   * Handle booking intent
   */
  async handleBookingIntent(
    message,
    conversationContext,
    sessionId,
    authToken,
    lang,
    actionData = null
  ) {
    console.log('[ChatbotService] Starting booking intent handling:', {
      message: message.substring(0, 100),
      sessionId,
      lang,
      hasActionData: !!actionData,
    });
    try {
      // Get booking context
      console.log('[ChatbotService] Retrieving booking context for session:', sessionId);
      const bookingContext = await conversationRepository.getBookingContext(sessionId);
      console.log('[ChatbotService] Booking context retrieved:', {
        hasContext: !!bookingContext,
        hasSearchResults: !!(bookingContext && bookingContext.searchResults),
      });

      if (!bookingContext || !bookingContext.searchResults) {
        console.log(
          '[ChatbotService] No booking context or search results found, prompting to search first'
        );
        return {
          text: this.responses.search_first[lang],
          suggestions: this.responses.search_first_suggestions[lang],
        };
      }

      // Handle seat selection action data from frontend
      if (actionData && actionData.type === 'seat_selection' && actionData.seats) {
        console.log('[ChatbotService] Handling seat selection action:', actionData.seats);
        const updatedContext = { ...bookingContext };
        updatedContext.selectedSeats = actionData.seats;
        await conversationRepository.saveBookingContext(sessionId, updatedContext);

        // After seats are selected, ask for passenger info
        return {
          text: this.responses.passenger_info[lang],
          suggestions: this.responses.passenger_info_suggestions[lang],
        };
      }

      // Use AI to understand which trip and seats user wants to book
      const bookingInfoPrompt = `Extract booking information from this message: "${message}"

Available trips: ${JSON.stringify(bookingContext.searchResults)}

IMPORTANT RULES:
1. ONLY extract seats if the user explicitly mentioned seat codes or numbers in their message
2. If the user did NOT mention any seats, set "seats" to null
3. You MUST respond with ONLY valid JSON, no other text

Return ONLY this JSON structure:
{
  "tripIndex": number or null (0-based index if user specified like "first trip", "trip #1"),
  "tripId": string or null,
  "seats": array of seat codes/numbers or null (ONLY if user explicitly mentioned them),
  "needsMoreInfo": boolean
}`;

      console.log('[ChatbotService] Extracting booking info via AI');
      const response = await groqAIService.chatCompletion(
        [{ role: 'user', content: bookingInfoPrompt }],
        { temperature: 0.3 }
      );

      // Extract JSON from response - handle cases where AI returns text with JSON embedded
      const jsonMatch = response.content.match(/\{[\s\S]*\}/);
      let bookingInfo;

      if (jsonMatch) {
        bookingInfo = JSON.parse(jsonMatch[0]);
        console.log('[ChatbotService] Booking info extracted:', bookingInfo);

        // Validate seats extraction - only keep if explicitly mentioned in message
        if (bookingInfo.seats && Array.isArray(bookingInfo.seats) && bookingInfo.seats.length > 0) {
          // Check if any of the extracted seats are actually mentioned in the user's message
          const seatsInMessage = bookingInfo.seats.some((seat) => {
            const seatStr = String(seat).toUpperCase();
            return message.toUpperCase().includes(seatStr);
          });

          if (!seatsInMessage) {
            console.warn(
              '[ChatbotService] Extracted seats not found in user message, rejecting seat selection:',
              bookingInfo.seats
            );
            // Clear seats since they weren't actually mentioned
            bookingInfo.seats = null;
          }
        }
      } else {
        console.warn(
          '[ChatbotService] Could not extract JSON from booking response:',
          response.content
        );
        // Return a safe default that asks for more info
        bookingInfo = {
          tripIndex: null,
          tripId: null,
          seats: null,
          needsMoreInfo: true,
        };
      }

      // Update booking context
      const updatedContext = { ...bookingContext };

      if (bookingInfo.tripIndex !== null && bookingContext.searchResults[bookingInfo.tripIndex]) {
        updatedContext.selectedTrip = bookingContext.searchResults[bookingInfo.tripIndex];
        console.log('[ChatbotService] Selected trip by index:', bookingInfo.tripIndex);
      } else if (bookingInfo.tripId) {
        updatedContext.selectedTrip = { tripId: bookingInfo.tripId };
        console.log('[ChatbotService] Selected trip by ID:', bookingInfo.tripId);
      }

      // Use seats from AI extraction if valid, otherwise extract from message
      if (bookingInfo.seats && Array.isArray(bookingInfo.seats) && bookingInfo.seats.length > 0) {
        updatedContext.selectedSeats = bookingInfo.seats;
        console.log('[ChatbotService] Using AI-extracted seats:', bookingInfo.seats);
      }

      console.log('[ChatbotService] Saving updated booking context');
      await conversationRepository.saveBookingContext(sessionId, updatedContext);

      // Check what information we still need
      console.log('[ChatbotService] Checking booking completeness:', {
        hasSelectedTrip: !!updatedContext.selectedTrip,
        hasSelectedSeats: !!updatedContext.selectedSeats,
        hasPassengerInfo: !!updatedContext.passengerInfo,
      });

      if (!updatedContext.selectedTrip) {
        console.log('[ChatbotService] Missing selected trip, asking user');
        return {
          text: this.responses.which_trip[lang],
          suggestions: this.responses.which_trip_suggestions[lang],
        };
      }

      // If we still don't have seats selected, show the seat map
      if (!updatedContext.selectedSeats) {
        const tripId = updatedContext.selectedTrip.tripId || updatedContext.selectedTrip.trip_id;
        // Get available seats immediately when trip is selected
        try {
          console.log('[ChatbotService] Fetching seat map for trip:', tripId);
          const seatsResponse = await tripServiceClient.getAvailableSeats(tripId);
          console.log('[ChatbotService] Received seats response:', {
            hasData: !!seatsResponse.data,
            hasSeatMap: !!seatsResponse.data?.seat_map,
            seatsCount: seatsResponse.data?.seat_map?.seats?.length || 0,
          });

          // Extract seats from the response structure
          const seatsData = seatsResponse.data?.seat_map?.seats || [];

          console.log('[ChatbotService] Final seats data for action:', {
            isArray: Array.isArray(seatsData),
            length: seatsData.length,
            firstItem: seatsData[0] || 'N/A',
          });

          // Only return seat selection if we have data
          if (!Array.isArray(seatsData) || seatsData.length === 0) {
            console.warn('[ChatbotService] No seats data found');
            return {
              text: this.responses.specify_seats[lang],
            };
          }

          return {
            text: this.responses.which_seats[lang],
            actions: [
              {
                type: 'seat_selection',
                data: seatsData,
              },
            ],
            suggestions: this.responses.which_seats_suggestions[lang],
          };
        } catch (error) {
          console.error('[ChatbotService] Error getting seats:', error.message);
          return {
            text: this.responses.specify_seats[lang],
          };
        }
      }
      if (!updatedContext.passengerInfo) {
        // Try to extract passenger information from the user message
        const extractPassengerPrompt = `Extract passenger information from this message: "${message}"

CRITICAL: You MUST respond with ONLY valid JSON, nothing else. No explanation, no code, no text. ONLY JSON.

Look for these fields: full name, ID number (CMND/Passport/Visa), phone number, and email.

Return EXACTLY this JSON structure (do NOT add any other text):
{
  "fullName": "extracted name or null",
  "documentId": "extracted ID or null",
  "phone": "extracted phone or null",
  "email": "extracted email or null",
  "hasAllInfo": true if all fields found, false otherwise
}`;

        console.log('[ChatbotService] Extracting passenger info via AI');
        const extractResponse = await groqAIService.chatCompletion(
          [{ role: 'user', content: extractPassengerPrompt }],
          { temperature: 0.1 }
        );
        console.log('[ChatbotService] Passenger extraction response:', extractResponse.content);

        // Extract JSON from response - be more robust
        let extractedPassenger = {
          fullName: null,
          documentId: null,
          phone: null,
          email: null,
        };

        // Try to find JSON object in the response
        const passengerMatch = extractResponse.content.match(/\{[\s\S]*?\}/);
        if (passengerMatch) {
          try {
            const parsed = JSON.parse(passengerMatch[0]);
            extractedPassenger = {
              fullName: parsed.fullName || null,
              documentId: parsed.documentId || null,
              phone: parsed.phone || null,
              email: parsed.email || null,
            };
            console.log('[ChatbotService] Successfully parsed passenger info:', extractedPassenger);
          } catch (e) {
            console.warn('[ChatbotService] Failed to parse passenger JSON:', e.message);
            console.warn(
              '[ChatbotService] Raw response was:',
              extractResponse.content.substring(0, 200)
            );
          }
        } else {
          console.warn('[ChatbotService] No JSON object found in passenger response');
        }

        if (
          extractedPassenger.fullName ||
          extractedPassenger.documentId ||
          extractedPassenger.phone
        ) {
          updatedContext.passengerInfo = extractedPassenger;
          await conversationRepository.saveBookingContext(sessionId, updatedContext);
        }

        // If we still don't have passenger info, ask again
        if (!updatedContext.passengerInfo) {
          return {
            text: this.responses.passenger_info[lang],
            suggestions: this.responses.passenger_info_suggestions[lang],
          };
        }
      }

      // All information collected - create booking
      // Support guest checkout - no authentication required
      try {
        console.log(
          '[ChatbotService] All booking info collected, creating booking:',
          updatedContext
        );

        const selectedTrip = updatedContext.selectedTrip;
        const tripId = selectedTrip.tripId || selectedTrip.trip_id;
        const seats = updatedContext.selectedSeats || [];
        const passengerInfo = updatedContext.passengerInfo || {};

        // Create the booking
        const bookingResult = await this.createBooking(
          sessionId,
          tripId,
          seats,
          passengerInfo,
          authToken
        );

        console.log('[ChatbotService] Booking created successfully:', bookingResult);

        // Return success message with booking details
        const successMsg =
          lang === 'vi'
            ? `Đặt vé thành công! Số tham chiếu đặt vé của bạn là ${bookingResult.bookingReference}. Vui lòng hoàn tất thanh toán trong vòng 10 phút.`
            : `Booking created successfully! Your booking reference is ${bookingResult.bookingReference}. Please complete payment within 10 minutes.`;

        return {
          text: successMsg,
          actions: [
            {
              type: 'booking_confirmation',
              data: {
                bookingId: bookingResult.bookingId,
                bookingReference: bookingResult.bookingReference,
                paymentInfo: bookingResult.paymentInfo,
              },
            },
          ],
          suggestions: [
            lang === 'vi' ? 'Thanh toán ngay' : 'Pay now',
            lang === 'vi' ? 'Xem chi tiết đặt vé' : 'View booking details',
          ],
        };
      } catch (error) {
        console.error('[ChatbotService] Error creating booking:', error);
        return {
          text: this.responses.booking_error[lang],
          suggestions:
            lang === 'vi' ? ['Thử lại', 'Liên hệ hỗ trợ'] : ['Try again', 'Contact support'],
        };
      }
    } catch (error) {
      console.error('[ChatbotService] Error handling booking:', error);
      return {
        text: this.responses.booking_error[lang],
      };
    }
  }

  /**
   * Handle FAQ questions
   */
  async handleFAQ(question, conversationContext, lang) {
    console.log('[ChatbotService] Handling FAQ:', { question: question.substring(0, 100), lang });
    try {
      console.log('[ChatbotService] Answering FAQ via AI');
      const answer = await groqAIService.answerFAQ(question, conversationContext);
      console.log('[ChatbotService] FAQ answer generated');
      return {
        text: answer,
        suggestions: this.responses.faq_suggestions[lang],
      };
    } catch (error) {
      console.error('[ChatbotService] Error handling FAQ:', error);
      return {
        text: this.responses.faq_error[lang],
      };
    }
  }

  /**
   * Handle cancellation requests
   */
  async handleCancellation(message, conversationContext, sessionId, authToken, lang) {
    console.log('[ChatbotService] Handling cancellation request:', {
      message: message.substring(0, 100),
      sessionId,
      lang,
    });
    // Extract booking reference from message
    const referenceMatch = message.match(/\b[A-Z]{2}\d{11}\b/);
    console.log(
      '[ChatbotService] Extracted booking reference:',
      referenceMatch ? referenceMatch[0] : 'none'
    );

    if (!referenceMatch) {
      console.log('[ChatbotService] No booking reference found in message');
      return {
        text: this.responses.cancel_no_ref[lang],
        suggestions: this.responses.cancel_no_ref_suggestions[lang],
      };
    }

    try {
      const reference = referenceMatch[0];
      console.log('[ChatbotService] Getting cancellation preview for reference:', reference);
      const preview = await bookingServiceClient.getCancellationPreview(reference, authToken);
      console.log('[ChatbotService] Cancellation preview retrieved');

      return {
        text: this.responses.cancel_details[lang]
          .replace('${ref}', reference)
          .replace('${refund}', preview.data.refundAmount)
          .replace('${fee}', preview.data.fee),
        actions: [
          {
            type: 'cancellation_preview',
            data: preview.data,
          },
        ],
        suggestions: this.responses.cancel_suggestions[lang],
      };
    } catch (error) {
      console.log('[ChatbotService] Error getting cancellation preview:', error.message);
      return {
        text: this.responses.cancel_not_found[lang],
      };
    }
  }

  /**
   * Create booking through chatbot
   */
  async createBooking(sessionId, tripId, seats, passengerInfo, authToken = null) {
    console.log('[ChatbotService] Creating booking:', {
      sessionId,
      tripId,
      seatCount: seats.length,
      hasAuthToken: !!authToken,
    });
    try {
      // Detect language from passenger name
      const lang = this.detectLanguage(passengerInfo.fullName);
      console.log('[ChatbotService] Detected language for booking:', lang);

      // Build passengers array with seat codes for each seat
      const passengers = seats.map((seatCode) => ({
        fullName: passengerInfo.fullName,
        phone: passengerInfo.phone,
        documentId: passengerInfo.documentId,
        seatCode: String(seatCode).toUpperCase(),
      }));

      const bookingData = {
        tripId,
        seats: seats.map((s) => String(s).toUpperCase()),
        passengers: passengers,
        contactEmail: passengerInfo.email || '',
        contactPhone: passengerInfo.phone,
        isGuestCheckout: !authToken,
      };

      console.log('[ChatbotService] Booking data prepared:', {
        tripId,
        seats: bookingData.seats,
        passengerCount: passengers.length,
        isGuestCheckout: !authToken,
        passengersData: passengers.map((p) => ({
          name: p.fullName,
          seatCode: p.seatCode,
        })),
      });
      const result = await bookingServiceClient.createBooking(bookingData, authToken);
      console.log('[ChatbotService] Booking created via service client:', {
        success: !!result.data,
        bookingId: result.data?.booking_id,
      });

      // Clear booking context
      console.log('[ChatbotService] Clearing booking context for session:', sessionId);
      await conversationRepository.saveBookingContext(sessionId, {});

      return {
        success: true,
        bookingId: result.data.booking_id,
        bookingReference: result.data.booking_reference,
        message: this.responses.booking_success[lang].replace(
          '${ref}',
          result.data.booking_reference
        ),
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
    console.log('[ChatbotService] Getting conversation history for session:', sessionId);
    try {
      const messages = await conversationRepository.getMessageHistory(sessionId);
      console.log('[ChatbotService] Retrieved conversation history:', messages.length, 'messages');
      return messages;
    } catch (error) {
      console.error('[ChatbotService] Error getting history:', error);
      throw error;
    }
  }

  /**
   * Reset conversation
   */
  async resetConversation(sessionId, lang = 'en') {
    console.log('[ChatbotService] Resetting conversation for session:', sessionId);
    try {
      await conversationRepository.deleteSessionMessages(sessionId);
      await conversationRepository.saveBookingContext(sessionId, {});
      console.log('[ChatbotService] Conversation reset successfully');
      return { success: true, message: this.responses.reset_success[lang] };
    } catch (error) {
      console.error('[ChatbotService] Error resetting conversation:', error);
      throw error;
    }
  }

  /**
   * Save user feedback
   */
  async saveFeedback(sessionId, messageId, rating, comment, lang = 'en') {
    console.log('[ChatbotService] Saving feedback:', {
      sessionId,
      messageId,
      rating,
      hasComment: !!comment,
    });
    try {
      await conversationRepository.saveFeedback(sessionId, messageId, rating, comment);
      console.log('[ChatbotService] Feedback saved successfully');
      return { success: true, message: this.responses.feedback_success[lang] };
    } catch (error) {
      console.error('[ChatbotService] Error saving feedback:', error);
      throw error;
    }
  }

  /**
   * Detect language from text (Vietnamese or English)
   */
  detectLanguage(text) {
    if (!text || typeof text !== 'string') {
      return 'en'; // Default to English
    }

    // Vietnamese characters and common Vietnamese words
    const vietnamesePattern =
      /[àáảãạăắằẳẵặâấầẩẫậèéẻẽẹêếềểễệìíỉĩịòóỏõọôốồổỗộơớờởỡợùúủũụưứừửữựỳýỷỹỵđÀÁẢÃẠĂẮẰẲẴẶÂẤẦẨẪẬÈÉẺẼẸÊẾỀỂỄỆÌÍỈĨỊÒÓỎÕỌÔỐỒỔỖỘƠỚỜỞỠỢÙÚỦŨỤƯỨỪỬỮỰỲÝỶỸỴĐ]/;
    const vietnameseWords =
      /\b(tôi|đi|bạn|có|không|nhà|xe|chuyến|đặt|và|hoặc|là|của|từ|đến|thời|gian|ngày|tháng|năm|hôm|nay|mai|sáng|chiều|tối|giá|vnd|đồng|vé|ghế|trạm|bến)\b/i;

    // Check for Vietnamese characters or common Vietnamese words
    if (vietnamesePattern.test(text) || vietnameseWords.test(text)) {
      return 'vi';
    }

    return 'en';
  }
}

module.exports = new ChatbotService();
