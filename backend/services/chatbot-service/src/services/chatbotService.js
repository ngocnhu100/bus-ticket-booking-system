const groqAIService = require('./groqAIService');
const tripServiceClient = require('./tripServiceClient');
const bookingServiceClient = require('./bookingServiceClient');
const conversationRepository = require('../repositories/conversationRepository');
const { getRedisClient } = require('../redis');
const { passengerSchema } = require('../validators/chatValidators');
const {
  generateSessionId,
  normalizeDate,
  normalizeCityName,
  formatTripsForChat,
  buildConversationContext,
  extractUserContactInfoFromJWT,
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
      contact_info: {
        en: 'Great! To complete your guest checkout, I need your contact information:\n- Phone number\n- Email address',
        vi: 'Tuyệt! Để hoàn tất thanh toán khách, tôi cần thông tin liên lạc của bạn:\n- Số điện thoại\n- Địa chỉ email',
      },
      contact_info_suggestions: {
        en: ['My phone is 0912345678', 'My email is customer@example.com'],
        vi: ['Số điện thoại của tôi là 0912345678', 'Email của tôi là customer@example.com'],
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

      // Get booking context
      const bookingContext = await conversationRepository.getBookingContext(sessionId);

      // If user wants to do a NEW search, clear old booking context
      if (intent.intent === 'search_trips' && bookingContext && bookingContext.selectedTrip) {
        console.log('[ChatbotService] New search detected - clearing old trip booking context');
        await conversationRepository.saveBookingContext(sessionId, {
          searchResults: [],
          selectedTrip: null,
          selectedSeats: [],
          selectedPickupPoint: null,
          selectedDropoffPoint: null,
          passengerInfo: null,
          contactInfo: null,
          bookingConfirmation: null,
        });
      }

      let response;

      // Handle based on intent
      switch (intent.intent) {
        case 'search_trips':
          console.log('[ChatbotService] Handling trip search intent');
          response = await this.handleTripSearch(message, conversationContext, sessionId, lang);
          break;

        case 'select_seats':
          console.log('[ChatbotService] Handling seat selection intent');
          response = await this.handleSeatSelection(message, conversationContext, sessionId, lang);
          break;

        case 'book_trip':
        case 'provide_passenger_info':
          console.log('[ChatbotService] Handling booking intent:', intent.intent);
          response = await this.handleBookingIntent(
            message,
            conversationContext,
            sessionId,
            authToken,
            lang,
            actionData,
            intent.intent // Pass intent for context
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
        {
          intent: intent.intent,
          actions: response.actions || [],
          suggestions: response.suggestions || [],
        }
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

      let extracted;

      // If it's a show all request, prioritize using the previous search context
      if (isShowAllRequest && conversationContext && conversationContext.lastSearch) {
        console.log('[ChatbotService] Show all request detected - using previous search context');
        extracted = conversationContext.lastSearch;
      } else {
        // Otherwise, extract parameters from the new message
        extracted = await groqAIService.extractTripSearchParams(message, conversationContext);
        console.log('[ChatbotService] Extracted params from message:', extracted);
      }

      console.log('[ChatbotService] Final extracted params:', extracted);
      console.log('[ChatbotService] Show all request:', isShowAllRequest);

      // Handle extraction failure
      if (!extracted) {
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

        console.log(
          '[ChatbotService] No trips found, returning suggestions:',
          this.responses.no_trips_suggestions[lang]
        );
        return {
          text: noTripsMsg,
          entities: extracted,
          suggestions: this.responses.no_trips_suggestions[lang],
        };
      }

      const trips = searchResult.data;
      const formattedTrips = formatTripsForChat(trips, 5, extracted.date);

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

      console.log(
        '[ChatbotService] Trips found, returning suggestions:',
        this.responses.trips_found_suggestions[lang]
      );
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
   * Handle seat selection intent - fast extraction without heavy AI processing
   */
  async handleSeatSelection(message, conversationContext, sessionId, lang) {
    console.log('[ChatbotService] Starting seat selection:', {
      message: message.substring(0, 100),
      sessionId,
    });

    try {
      // Get booking context
      const bookingContext = await conversationRepository.getBookingContext(sessionId);

      if (!bookingContext || !bookingContext.selectedTrip) {
        console.log('[ChatbotService] No trip selected yet, cannot select seats');
        return {
          text:
            lang === 'vi'
              ? 'Bạn cần chọn một chuyến trước khi chọn ghế.'
              : 'You need to select a trip first before choosing seats.',
          suggestions:
            lang === 'vi'
              ? ['Tìm chuyến đi', 'Quay lại tìm kiếm']
              : ['Search trips', 'Back to search'],
        };
      }

      // Extract seat codes using regex - much faster than AI
      // Matches patterns like: A1, VIP2C, 2C, ABC12, etc.
      // Pattern: optional letters + 1-2 digits + optional letters
      const seatPattern = /[A-Z]*\d{1,2}[A-Z]*|[A-Z]+\d+[A-Z]+/gi;
      const extractedSeats = message.match(seatPattern) || [];

      // Filter to valid seat codes
      // Valid: VIP2C, 2C, A1, ABC12, etc. (letters/digits in any order but must have digits)
      const validSeats = extractedSeats
        .map((s) => s.toUpperCase())
        .filter((s) => /^[A-Z]*\d{1,2}[A-Z]*$/.test(s) && /\d/.test(s));

      console.log('[ChatbotService] Extracted seats from message:', {
        raw: extractedSeats,
        valid: validSeats,
      });

      if (validSeats.length === 0) {
        console.log('[ChatbotService] No valid seat codes found in message');
        return {
          text:
            lang === 'vi'
              ? 'Tôi không hiểu ghế nào bạn muốn chọn. Vui lòng cung cấp mã ghế (ví dụ: A1, B2).'
              : 'I could not find any seat codes in your message. Please provide seat codes (e.g., A1, B2).',
          suggestions:
            lang === 'vi'
              ? ['A1, A2', 'B1, B2, B3', 'Xem sơ đồ ghế']
              : ['A1, A2', 'B1, B2, B3', 'Show seat map'],
        };
      }

      // Update context with selected seats
      const updatedContext = { ...bookingContext };
      updatedContext.selectedSeats = validSeats;
      await conversationRepository.saveBookingContext(sessionId, updatedContext);

      console.log('[ChatbotService] Seats selected and saved:', validSeats);

      // Return confirmation
      const seatsStr = validSeats.join(', ');
      return {
        text:
          lang === 'vi'
            ? `Ghế đã chọn: ${seatsStr}. Tiếp theo, chúng tôi sẽ xác nhận chi tiết chuyến.`
            : `Seats selected: ${seatsStr}. Next, we'll confirm your trip details.`,
        entities: {
          selectedSeats: validSeats,
          tripId: bookingContext.selectedTrip.tripId || bookingContext.selectedTrip.trip_id,
        },
        suggestions:
          lang === 'vi' ? ['Tiếp tục', 'Xác nhận đặt vé'] : ['Continue', 'Confirm booking'],
      };
    } catch (error) {
      console.error('[ChatbotService] Error handling seat selection:', error);
      return {
        text:
          lang === 'vi'
            ? 'Xin lỗi, tôi gặp lỗi khi xử lý chọn ghế. Vui lòng thử lại.'
            : 'Sorry, I encountered an error while processing your seat selection. Please try again.',
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
    actionData = null,
    detectedIntent = 'book_trip' // Add intent parameter
  ) {
    console.log('[ChatbotService] Starting booking intent handling:', {
      message: message.substring(0, 100),
      sessionId,
      lang,
      detectedIntent,
      hasActionData: !!actionData,
      authToken,
    });
    try {
      // Check if user wants to select different seat after a booking error
      if (
        message.toLowerCase().includes('different seat') ||
        message.toLowerCase().includes('another seat') ||
        message.toLowerCase().includes('different seats') ||
        message.toLowerCase().includes('another seats') ||
        message.toLowerCase().includes('select different') ||
        message.toLowerCase().includes('select another')
      ) {
        console.log(
          '[ChatbotService] User wants to select different seat - showing seat map again'
        );
        // Clear selected seats and show seat map again
        const bookingContext = await conversationRepository.getBookingContext(sessionId);
        if (bookingContext && bookingContext.selectedTrip) {
          bookingContext.selectedSeats = [];
          await conversationRepository.saveBookingContext(sessionId, bookingContext);
          // Fetch seat map again
          const tripId = bookingContext.selectedTrip.tripId || bookingContext.selectedTrip.trip_id;
          const seatsResponse = await tripServiceClient.getAvailableSeats(tripId);
          console.log('[ChatbotService] Fetched updated seat map:', {
            hasData: !!seatsResponse,
            seatCount: seatsResponse?.data?.seat_map?.seats?.length || 0,
          });

          return {
            text:
              lang === 'vi'
                ? 'Dưới đây là sơ đồ ghế cập nhật. Vui lòng chọn ghế khác:'
                : 'Here is the updated seat map. Please select different seats:',
            actions: [
              {
                type: 'seat_selection',
                data: seatsResponse?.data?.seat_map?.seats || [],
              },
            ],
          };
        }
      }

      // Check if user is trying to pay for an existing booking (payment flow)
      const isPaymentIntent =
        message.toLowerCase().includes('pay') ||
        message.toLowerCase().includes('thanh toán') ||
        message.toLowerCase().includes('payment') ||
        message.toLowerCase().includes('proceed') ||
        message.toLowerCase().includes('confirm');

      // Get booking context
      console.log('[ChatbotService] Retrieving booking context for session:', sessionId);
      const bookingContext = await conversationRepository.getBookingContext(sessionId);
      console.log('[ChatbotService] Booking context retrieved:', {
        hasContext: !!bookingContext,
        hasSearchResults: !!(bookingContext && bookingContext.searchResults),
        hasBookingConfirmation: !!(bookingContext && bookingContext.bookingConfirmation),
        isPaymentIntent,
      });

      // If user is selecting a pickup/dropoff point by name (text selection), try to match it
      if (bookingContext && bookingContext.selectedTrip && !actionData) {
        const tripId = bookingContext.selectedTrip.tripId || bookingContext.selectedTrip.trip_id;
        let tripDetails = bookingContext.selectedTrip;

        // Try to find trip in search results to get full pickup/dropoff data
        if (bookingContext?.searchResults) {
          const searchTrip = bookingContext.searchResults.find(
            (t) => (t.trip_id || t.tripId) === tripId
          );
          if (searchTrip) {
            tripDetails = searchTrip;
          }
        }

        // If waiting for pickup point and user's message matches a pickup point name
        if (!bookingContext.selectedPickupPoint && tripDetails.pickup_points) {
          const matchedPickup = tripDetails.pickup_points.find(
            (p) =>
              p.name.toLowerCase().includes(message.toLowerCase()) ||
              message.toLowerCase().includes(p.name.toLowerCase())
          );
          if (matchedPickup) {
            console.log('[ChatbotService] User selected pickup point by name:', matchedPickup.name);
            const updatedContext = { ...bookingContext };
            updatedContext.selectedPickupPoint = {
              point_id: matchedPickup.point_id,
              name: matchedPickup.name,
              address: matchedPickup.address,
              time: matchedPickup.time,
            };
            await conversationRepository.saveBookingContext(sessionId, updatedContext);

            // Proceed to next step (dropoff point selection) with dropoff options displayed
            try {
              const tripId =
                bookingContext.selectedTrip.tripId || bookingContext.selectedTrip.trip_id;
              let tripDetails = bookingContext.selectedTrip;

              // Try to find trip in search results to get full dropoff data
              if (bookingContext?.searchResults) {
                const searchTrip = bookingContext.searchResults.find(
                  (t) => (t.trip_id || t.tripId) === tripId
                );
                if (searchTrip) {
                  tripDetails = searchTrip;
                }
              }

              const dropoffPoints = tripDetails.dropoff_points || [];
              console.log('[ChatbotService] Available dropoff points:', dropoffPoints.length);

              if (dropoffPoints.length === 0) {
                return {
                  text:
                    lang === 'vi'
                      ? 'Không có điểm trả khả dụng. Vui lòng thử chuyến khác.'
                      : 'No dropoff points available. Please select another trip.',
                };
              }

              const dropoffDisplay = dropoffPoints.map((p, idx) => ({
                index: idx,
                name: p.name,
                address: p.address,
                time: p.time,
                point_id: p.point_id,
              }));

              return {
                text:
                  lang === 'vi'
                    ? `Bạn chọn đón tại: ${matchedPickup.name}. Tiếp theo chọn điểm trả (${dropoffPoints.length} điểm khả dụng):\n${dropoffPoints.map((p, i) => `${i + 1}. ${p.name}\n   Giờ: ${new Date(p.time).toLocaleTimeString()}`).join('\n')}`
                    : `You selected pickup: ${matchedPickup.name}. Now select dropoff point (${dropoffPoints.length} available):\n${dropoffPoints.map((p, i) => `${i + 1}. ${p.name}\n   Time: ${new Date(p.time).toLocaleTimeString()}`).join('\n')}`,
                suggestions: dropoffPoints.map((p, i) => `${i + 1}. ${p.name}`),
                actions: [
                  {
                    type: 'dropoff_selection',
                    data: dropoffDisplay,
                  },
                ],
              };
            } catch (error) {
              console.error(
                '[ChatbotService] Error getting dropoff points after pickup selection:',
                error.message
              );
              return {
                text:
                  lang === 'vi'
                    ? `Bạn chọn đón tại: ${matchedPickup.name}. Tiếp theo vui lòng chọn điểm trả.`
                    : `You selected pickup: ${matchedPickup.name}. Next, please select dropoff point.`,
              };
            }
          }
        }

        // If waiting for dropoff point and user's message matches a dropoff point name
        if (
          bookingContext.selectedPickupPoint &&
          !bookingContext.selectedDropoffPoint &&
          tripDetails.dropoff_points
        ) {
          const matchedDropoff = tripDetails.dropoff_points.find(
            (p) =>
              p.name.toLowerCase().includes(message.toLowerCase()) ||
              message.toLowerCase().includes(p.name.toLowerCase())
          );
          if (matchedDropoff) {
            console.log(
              '[ChatbotService] User selected dropoff point by name:',
              matchedDropoff.name
            );
            const updatedContext = { ...bookingContext };
            updatedContext.selectedDropoffPoint = {
              point_id: matchedDropoff.point_id,
              name: matchedDropoff.name,
              address: matchedDropoff.address,
              time: matchedDropoff.time,
            };
            await conversationRepository.saveBookingContext(sessionId, updatedContext);

            // Proceed to next step (seat selection) - fetch and display seat map
            try {
              const tripId =
                bookingContext.selectedTrip.tripId || bookingContext.selectedTrip.trip_id;
              console.log(
                '[ChatbotService] Fetching seat map after dropoff selection for trip:',
                tripId
              );
              const seatsResponse = await tripServiceClient.getAvailableSeats(tripId);
              console.log('[ChatbotService] Received seats response:', {
                hasData: !!seatsResponse.data,
                hasSeatMap: !!seatsResponse.data?.seat_map,
                seatsCount: seatsResponse.data?.seat_map?.seats?.length || 0,
              });

              return {
                text:
                  lang === 'vi'
                    ? `Bạn chọn trả tại: ${matchedDropoff.name}. Tiếp theo vui lòng chọn ghế:`
                    : `You selected dropoff: ${matchedDropoff.name}. Now select seats:`,
                suggestions: this.responses.which_seats_suggestions[lang],
                actions: [
                  {
                    type: 'seat_selection',
                    data: seatsResponse.data?.seat_map?.seats || [],
                  },
                ],
              };
            } catch (error) {
              console.error(
                '[ChatbotService] Error fetching seats after dropoff selection:',
                error.message
              );
              return {
                text:
                  lang === 'vi'
                    ? `Bạn chọn trả tại: ${matchedDropoff.name}. Tiếp theo vui lòng chọn ghế.`
                    : `You selected dropoff: ${matchedDropoff.name}. Next, please select seats.`,
                suggestions: this.responses.which_seats_suggestions[lang],
              };
            }
          }
        }
      }

      // If user said "pay now" and has a booking confirmation, provide payment link
      if (isPaymentIntent && bookingContext && bookingContext.bookingConfirmation) {
        console.log('[ChatbotService] Payment intent detected with booking confirmation');
        const confirmation = bookingContext.bookingConfirmation;

        // Return payment link
        return {
          text:
            lang === 'vi'
              ? `Cảm ơn bạn! Bạn có thể thanh toán cho đặt vé ${confirmation.bookingReference}. Vui lòng nhấp nút bên dưới để hoàn tất thanh toán trong vòng 10 phút.`
              : `Thank you! You can now complete payment for booking ${confirmation.bookingReference}. Please click the button below to finish payment within 10 minutes.`,
          actions: [
            {
              type: 'payment_link',
              data: {
                url: confirmation.paymentInfo?.payment_url || '#',
                bookingReference: confirmation.bookingReference,
                bookingId: confirmation.bookingId,
              },
            },
          ],
          suggestions: [
            lang === 'vi' ? 'Xem chi tiết đặt vé' : 'View booking details',
            lang === 'vi' ? 'Quay lại tìm kiếm' : 'Back to search',
          ],
        };
      }

      // If user is trying to pay and there's no booking data, they need to search first
      // But if there IS booking data (even without searchResults), they're completing a payment
      if (!bookingContext || (!bookingContext.searchResults && !bookingContext.selectedTrip)) {
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

        // After seats are selected, will ask for pickup point next (in booking flow)
        return {
          text:
            lang === 'vi'
              ? 'Bạn đã chọn ghế. Tiếp theo sẽ chọn điểm đón.'
              : 'You selected seats. Next you will select pickup point.',
        };
      }

      // Handle pickup point selection action data from frontend
      if (actionData && actionData.type === 'pickup_selection' && actionData.selectedPoint) {
        console.log('[ChatbotService] Handling pickup selection action:', actionData.selectedPoint);
        const updatedContext = { ...bookingContext };
        updatedContext.selectedPickupPoint = {
          point_id: actionData.selectedPoint.point_id,
          name: actionData.selectedPoint.name,
          address: actionData.selectedPoint.address,
          time: actionData.selectedPoint.time,
        };
        await conversationRepository.saveBookingContext(sessionId, updatedContext);

        return {
          text:
            lang === 'vi'
              ? `Bạn chọn đón tại: ${actionData.selectedPoint.name}. Tiếp theo chọn điểm trả.`
              : `You selected pickup: ${actionData.selectedPoint.name}. Next select dropoff.`,
        };
      }

      // Handle dropoff point selection action data from frontend
      if (actionData && actionData.type === 'dropoff_selection' && actionData.selectedPoint) {
        console.log(
          '[ChatbotService] Handling dropoff selection action:',
          actionData.selectedPoint
        );
        const updatedContext = { ...bookingContext };
        updatedContext.selectedDropoffPoint = {
          point_id: actionData.selectedPoint.point_id,
          name: actionData.selectedPoint.name,
          address: actionData.selectedPoint.address,
          time: actionData.selectedPoint.time,
        };
        await conversationRepository.saveBookingContext(sessionId, updatedContext);

        return {
          text:
            lang === 'vi'
              ? `Bạn chọn trả tại: ${actionData.selectedPoint.name}. Tiếp theo cung cấp thông tin hành khách.`
              : `You selected dropoff: ${actionData.selectedPoint.name}. Next provide passenger info.`,
        };
      }

      // If user intent is 'provide_passenger_info', skip trip/seat extraction and go directly to passenger info
      const skipTripExtraction = detectedIntent === 'provide_passenger_info';
      console.log('[ChatbotService] Trip extraction:', { skipTripExtraction, detectedIntent });

      // Define bookingInfo outside the if block
      let bookingInfo = null;

      // Use AI to understand which trip and seats user wants to book
      // Skip this if user is providing passenger info
      if (!skipTripExtraction) {
        const bookingInfoPrompt = `Extract booking information from this message: "${message}"

Available trips: ${JSON.stringify(bookingContext.searchResults)}

IMPORTANT RULES:
1. Extract tripIndex by matching these patterns:
   - "Book trip #1" or "trip #1" or "trip 1" → tripIndex: 0
   - "Book trip #2" or "trip #2" or "trip 2" → tripIndex: 1
   - "Book trip #3" or "trip #3" or "trip 3" → tripIndex: 2
   - "first trip" → tripIndex: 0
   - "second trip" → tripIndex: 1
   - "third trip" → tripIndex: 2
2. ONLY extract seats if the user explicitly mentioned seat codes or numbers in their message
3. If the user did NOT mention any seats, set "seats" to null
4. You MUST respond with ONLY valid JSON, no other text

Return ONLY this JSON structure:
{
  "tripIndex": number or null (0-based index from the available trips list),
  "tripId": string or null,
  "seats": array of seat codes/numbers or null (ONLY if user explicitly mentioned them),
  "needsMoreInfo": boolean
}`;

        console.log('[ChatbotService] Extracting booking info via AI');
        const response = await groqAIService.chatCompletion(
          [{ role: 'user', content: bookingInfoPrompt }],
          { temperature: 0.3 }
        );

        console.log('[ChatbotService] AI response content:', response.content.substring(0, 200));

        // Extract JSON from response - handle markdown code blocks and other formatting
        let jsonMatch = response.content.match(/```(?:json)?\s*([\s\S]*?)```/);
        let jsonString = jsonMatch ? jsonMatch[1].trim() : response.content;

        // If no markdown block, try to find raw JSON
        if (!jsonMatch) {
          jsonMatch = jsonString.match(/\{[\s\S]*\}/);
          jsonString = jsonMatch ? jsonMatch[0] : jsonString;
        }

        try {
          // Clean up any remaining backticks or special characters
          jsonString = jsonString.replace(/^`+|`+$/g, '').trim();
          console.log('[ChatbotService] Cleaned JSON string:', jsonString.substring(0, 200));

          bookingInfo = JSON.parse(jsonString);
          console.log('[ChatbotService] Booking info extracted:', bookingInfo);

          // Validate seats extraction - only keep if explicitly mentioned in message
          if (
            bookingInfo.seats &&
            Array.isArray(bookingInfo.seats) &&
            bookingInfo.seats.length > 0
          ) {
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
        } catch (e) {
          console.warn(
            '[ChatbotService] Could not parse JSON from booking response:',
            response.content.substring(0, 300),
            'Error:',
            e.message
          );
          // Return a safe default that asks for more info
          bookingInfo = {
            tripIndex: null,
            tripId: null,
            seats: null,
            needsMoreInfo: true,
          };
        }
      } // Close if (!skipTripExtraction)

      // Update booking context
      const updatedContext = { ...bookingContext };

      // Only process booking info if it exists (when trip extraction was not skipped)
      if (bookingInfo && !skipTripExtraction) {
        if (bookingInfo.tripIndex !== null && bookingContext.searchResults[bookingInfo.tripIndex]) {
          updatedContext.selectedTrip = bookingContext.searchResults[bookingInfo.tripIndex];
          console.log('[ChatbotService] Selected trip by index:', bookingInfo.tripIndex);
        } else if (bookingInfo.tripId) {
          updatedContext.selectedTrip = { tripId: bookingInfo.tripId };
          console.log('[ChatbotService] Selected trip by ID:', bookingInfo.tripId);
        } else if (bookingInfo.tripIndex === null && bookingInfo.tripId === null) {
          // No trip was extracted - preserve old trip (user might be asking casual questions)
          // The intent-based clearing already happened at the top level if search_trips was detected
          console.log('[ChatbotService] No trip extracted - preserving existing trip selection');
        }

        // Use seats from AI extraction if valid, otherwise extract from message
        if (bookingInfo.seats && Array.isArray(bookingInfo.seats) && bookingInfo.seats.length > 0) {
          updatedContext.selectedSeats = bookingInfo.seats;
          console.log('[ChatbotService] Using AI-extracted seats:', bookingInfo.seats);
        }
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

      // Check if we need to select pickup and dropoff points
      if (!updatedContext.selectedPickupPoint) {
        console.log('[ChatbotService] Missing pickup point selection');
        // Get trip details to show pickup points
        const tripId = updatedContext.selectedTrip.tripId || updatedContext.selectedTrip.trip_id;

        try {
          // Validate that selectedTrip is still valid in current search results
          let tripDetails = updatedContext.selectedTrip;
          let tripFoundInResults = false;

          // Check if this trip exists in current search results
          if (bookingContext?.searchResults && Array.isArray(bookingContext.searchResults)) {
            const searchTrip = bookingContext.searchResults.find(
              (t) => (t.trip_id || t.tripId) === tripId
            );
            if (searchTrip) {
              tripDetails = searchTrip;
              tripFoundInResults = true;
              console.log('[ChatbotService] Found selected trip in current search results');
            } else {
              console.log(
                '[ChatbotService] Selected trip not found in current search results - context is stale'
              );
              tripFoundInResults = false;
            }
          }

          // If trip is not in current search results, it means user did a new search
          // Clear the old selection and ask them to choose from new results
          if (!tripFoundInResults && bookingContext?.searchResults?.length > 0) {
            console.log(
              '[ChatbotService] Clearing stale trip context - asking user to select from new search'
            );
            // Clear the old trip selection
            updatedContext.selectedTrip = null;
            updatedContext.selectedSeats = [];
            updatedContext.selectedPickupPoint = null;
            updatedContext.selectedDropoffPoint = null;
            await conversationRepository.saveBookingContext(sessionId, updatedContext);

            return {
              text: this.responses.which_trip[lang],
              suggestions: this.responses.which_trip_suggestions[lang],
            };
          }

          const pickupPoints = tripDetails.pickup_points || [];
          console.log('[ChatbotService] Available pickup points:', pickupPoints.length);

          if (pickupPoints.length === 0) {
            return {
              text:
                lang === 'vi'
                  ? 'Không có điểm đón khả dụng. Vui lòng thử chuyến khác.'
                  : 'No pickup points available. Please select another trip.',
              suggestions:
                lang === 'vi'
                  ? ['Chọn chuyến khác', 'Quay lại tìm kiếm']
                  : ['Select different trip', 'Back to search'],
            };
          }

          // Format pickup points for display
          const pickupDisplay = pickupPoints.map((p, idx) => ({
            index: idx,
            name: p.name,
            address: p.address,
            time: p.time,
            point_id: p.point_id,
          }));

          return {
            text:
              lang === 'vi'
                ? `Chọn điểm đón (${pickupPoints.length} điểm khả dụng):\n${pickupPoints.map((p, i) => `${i + 1}. ${p.name}\n   Giờ: ${new Date(p.time).toLocaleTimeString()}`).join('\n')}`
                : `Select pickup point (${pickupPoints.length} available):\n${pickupPoints.map((p, i) => `${i + 1}. ${p.name}\n   Time: ${new Date(p.time).toLocaleTimeString()}`).join('\n')}`,
            suggestions: pickupPoints.map((p, i) => `${i + 1}. ${p.name}`),
            actions: [
              {
                type: 'pickup_selection',
                data: pickupDisplay,
              },
            ],
          };
        } catch (error) {
          console.error('[ChatbotService] Error getting pickup points:', error.message);
          return {
            text:
              lang === 'vi'
                ? 'Lỗi tải điểm đón. Vui lòng thử lại.'
                : 'Error loading pickup points. Please try again.',
          };
        }
      }

      // Check if we need to select dropoff point
      if (!updatedContext.selectedDropoffPoint) {
        console.log('[ChatbotService] Missing dropoff point selection');
        const tripId = updatedContext.selectedTrip.tripId || updatedContext.selectedTrip.trip_id;

        try {
          let tripDetails = updatedContext.selectedTrip;

          if (!tripDetails.dropoff_points || !Array.isArray(tripDetails.dropoff_points)) {
            if (bookingContext?.searchResults) {
              const searchTrip = bookingContext.searchResults.find(
                (t) => (t.trip_id || t.tripId) === tripId
              );
              if (searchTrip) {
                tripDetails = searchTrip;
              }
            }
          }

          const dropoffPoints = tripDetails.dropoff_points || [];
          console.log('[ChatbotService] Available dropoff points:', dropoffPoints.length);

          if (dropoffPoints.length === 0) {
            return {
              text:
                lang === 'vi'
                  ? 'Không có điểm trả khả dụng. Vui lòng thử chuyến khác.'
                  : 'No dropoff points available. Please select another trip.',
            };
          }

          const dropoffDisplay = dropoffPoints.map((p, idx) => ({
            index: idx,
            name: p.name,
            address: p.address,
            time: p.time,
            point_id: p.point_id,
          }));

          return {
            text:
              lang === 'vi'
                ? `Chọn điểm trả (${dropoffPoints.length} điểm khả dụng):\n${dropoffPoints.map((p, i) => `${i + 1}. ${p.name}\n   Giờ: ${new Date(p.time).toLocaleTimeString()}`).join('\n')}`
                : `Select dropoff point (${dropoffPoints.length} available):\n${dropoffPoints.map((p, i) => `${i + 1}. ${p.name}\n   Time: ${new Date(p.time).toLocaleTimeString()}`).join('\n')}`,
            suggestions: dropoffPoints.map((p, i) => `${i + 1}. ${p.name}`),
            actions: [
              {
                type: 'dropoff_selection',
                data: dropoffDisplay,
              },
            ],
          };
        } catch (error) {
          console.error('[ChatbotService] Error getting dropoff points:', error.message);
          return {
            text:
              lang === 'vi'
                ? 'Lỗi tải điểm trả. Vui lòng thử lại.'
                : 'Error loading dropoff points. Please try again.',
          };
        }
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

      // All requirements met - now ask for contact info (guest) or passenger information (authenticated)
      // Check if this is a guest checkout (no authToken)
      const isGuestCheckout = !authToken;
      console.log('[ChatbotService] Booking flow - isGuestCheckout:', isGuestCheckout);

      // For authenticated users, auto-fill contact info from JWT token
      if (!isGuestCheckout && !updatedContext.contactInfo) {
        console.log('[ChatbotService] Authenticated user - extracting contact info from JWT token');
        const userContactInfo = await extractUserContactInfoFromJWT(authToken);

        if (userContactInfo && (userContactInfo.email || userContactInfo.phone)) {
          updatedContext.contactInfo = {
            email: userContactInfo.email || '',
            phone: userContactInfo.phone || '',
          };
          console.log('[ChatbotService] Auto-filled contact info for authenticated user:', {
            hasEmail: !!userContactInfo.email,
            hasPhone: !!userContactInfo.phone,
          });
          await conversationRepository.saveBookingContext(sessionId, updatedContext);

          // Notify user that we auto-filled their contact info
          const contactMessage =
            lang === 'vi'
              ? `Tôi đã lấy thông tin liên hệ từ tài khoản của bạn:\nEmail: ${userContactInfo.email}\nPhone: ${userContactInfo.phone}\n\nNếu bạn muốn thay đổi, vui lòng cho tôi biết.`
              : `I've auto-filled your contact information from your account:\nEmail: ${userContactInfo.email}\nPhone: ${userContactInfo.phone}\n\nLet me know if you'd like to change it.`;

          // Continue to passenger info request
          const passengerCount = updatedContext.selectedSeats
            ? updatedContext.selectedSeats.length
            : 1;
          console.log(
            '[ChatbotService] Contact info auto-filled, moving to passenger info for',
            passengerCount,
            'passenger(s)'
          );

          return {
            text: contactMessage,
            suggestions:
              lang === 'vi'
                ? ['Tiếp tục', 'Thay đổi email', 'Thay đổi số điện thoại']
                : ['Continue', 'Change email', 'Change phone number'],
          };
        } else {
          console.warn('[ChatbotService] Could not extract user contact info from JWT token');
        }
      }

      // For guest checkout, we need contact info (phone + email) BEFORE passenger info
      if (isGuestCheckout && !updatedContext.contactInfo) {
        console.log('[ChatbotService] Guest checkout mode - requesting contact info first');

        // If message is empty or just acknowledgment, ask directly without extraction
        if (message.toLowerCase().trim().length < 3) {
          return {
            text: this.responses.contact_info[lang],
            suggestions: this.responses.contact_info_suggestions[lang],
          };
        }

        // Extract contact info from user message
        const extractContactPrompt = `Extract contact information from this message: "${message}"

CRITICAL: You MUST respond with ONLY valid JSON, nothing else.

Return EXACTLY this JSON structure (do NOT add any other text):
{
  "phone": "extracted phone number or null",
  "email": "extracted email address or null"
}`;

        console.log('[ChatbotService] Extracting contact info for guest checkout');
        const contactResponse = await groqAIService.chatCompletion(
          [{ role: 'user', content: extractContactPrompt }],
          { temperature: 0.1 }
        );
        console.log(
          '[ChatbotService] Contact info extraction response:',
          contactResponse.content.substring(0, 300)
        );

        let contactInfo = null;
        let jsonString = contactResponse.content;

        // Extract JSON from response
        let codeBlockMatch = jsonString.match(/```(?:json)?\s*([\s\S]*?)```/);
        if (codeBlockMatch) {
          jsonString = codeBlockMatch[1].trim();
        }

        const jsonMatches = jsonString.match(/\{[\s\S]*\}/g);
        if (jsonMatches && jsonMatches.length > 0) {
          const contactMatch = jsonMatches.reduce((prev, curr) =>
            curr.length > prev.length ? curr : prev
          );

          try {
            jsonString = contactMatch.replace(/^`+|`+$/g, '').trim();
            contactInfo = JSON.parse(jsonString);
            console.log('[ChatbotService] Contact info parsed:', {
              hasPhone: !!contactInfo.phone,
              hasEmail: !!contactInfo.email,
            });
          } catch (e) {
            console.warn('[ChatbotService] Failed to parse contact info JSON:', e.message);
          }
        }

        // Validate extracted contact info
        const hasPhone =
          contactInfo && contactInfo.phone && /^(\+84|84|0)[0-9]{9,10}$/.test(contactInfo.phone);
        const hasEmail =
          contactInfo && contactInfo.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactInfo.email);

        console.log('[ChatbotService] Contact info validation:', { hasPhone, hasEmail });

        if (hasPhone && hasEmail) {
          // Save contact info
          updatedContext.contactInfo = {
            phone: contactInfo.phone,
            email: contactInfo.email,
          };
          console.log('[ChatbotService] Saved contact info for guest checkout');
          await conversationRepository.saveBookingContext(sessionId, updatedContext);

          // Show success message and move to passenger info request
          const passengerCount = updatedContext.selectedSeats
            ? updatedContext.selectedSeats.length
            : 1;
          console.log(
            '[ChatbotService] Contact info saved, now asking for passenger info for',
            passengerCount,
            'passenger(s)'
          );

          // Return a message confirming contact info and asking for passenger info
          return {
            text:
              lang === 'vi'
                ? `Cảm ơn! Tôi đã lưu thông tin liên lạc của bạn (${contactInfo.email}-${contactInfo.phone}). Bây giờ vui lòng cung cấp thông tin hành khách cho ${passengerCount} hành khách (Tên đầy đủ, Số CMND/Passport, Số điện thoại).`
                : `Thank you! I've saved your contact information (${contactInfo.email}-${contactInfo.phone}). Now please provide passenger details for ${passengerCount} passenger(s) (Full name, Document ID, Phone number).`,
            suggestions:
              lang === 'vi'
                ? [`Hành khách 1: Nguyễn Văn A, 123456789, 0912345678`]
                : [`Passenger 1: John Doe, 123456789, 0912345678`],
          };
        } else {
          // Ask for missing fields
          const missingFields = [];
          if (!hasPhone) missingFields.push(lang === 'vi' ? 'số điện thoại' : 'phone number');
          if (!hasEmail) missingFields.push(lang === 'vi' ? 'email' : 'email address');

          console.log(`[ChatbotService] Missing contact fields: ${missingFields.join(', ')}`);

          return {
            text:
              lang === 'vi'
                ? `Vui lòng cung cấp ${missingFields.join(' và ')}.`
                : `Please provide your ${missingFields.join(' and ')}.`,
            suggestions: this.responses.contact_info_suggestions[lang],
          };
        }
      }

      // For authenticated users or after getting contact info for guests, ask for passenger information
      // Check if we need MORE passengers (not just if empty)
      const currentPassengerCount =
        (updatedContext.passengerInfo && updatedContext.passengerInfo.length) || 0;
      const totalPassengerCountNeeded =
        (updatedContext.selectedSeats && updatedContext.selectedSeats.length) || 1;

      if (currentPassengerCount < totalPassengerCountNeeded) {
        // Get number of passengers from selected seats
        const totalPassengerCount = totalPassengerCountNeeded;

        // Get number of passengers already extracted (may be asking for multiple in one message)
        const alreadyExtractedCount = currentPassengerCount;

        // Calculate remaining passengers needed
        const remainingPassengerCount = totalPassengerCount - alreadyExtractedCount;

        // Try to extract passenger information from the user message
        // Use a very strict JSON-only prompt to prevent AI from returning code
        let extractPassengerPrompt = `TASK: Extract passenger information from user message.
User message: "${message}"
Total passengers needed: ${totalPassengerCount}
Already extracted: ${alreadyExtractedCount}
Extract NOW: ${remainingPassengerCount} passenger(s)

🔴 RULES - MUST FOLLOW:
1. Return ONLY valid JSON for the REMAINING passengers (not previously extracted)
2. NO explanation, NO code, NO markdown, NO text
3. NO Python/JavaScript code
4. NO backticks or code blocks
5. Raw JSON only

`;

        if (remainingPassengerCount === 1) {
          extractPassengerPrompt += `Return:
{"passengers":[{"fullName":"name or null","documentId":"id or null","phone":"phone or null","email":"email or null"}]}`;
        } else if (remainingPassengerCount === 2) {
          extractPassengerPrompt += `Return:
{"passengers":[{"fullName":"name1 or null","documentId":"id1 or null","phone":"phone1 or null","email":"email1 or null"},{"fullName":"name2 or null","documentId":"id2 or null","phone":"phone2 or null","email":"email2 or null"}]}`;
        } else {
          extractPassengerPrompt += `Return:
{"passengers":[${Array.from({ length: remainingPassengerCount }, (_, i) => `{"fullName":"name${i + 1} or null","documentId":"id${i + 1} or null","phone":"phone${i + 1} or null","email":"email${i + 1} or null"}`).join(',')}]}`;
        }

        console.log('[ChatbotService] Extracting passenger info via AI');
        console.log('[ChatbotService] User message for extraction:', message.substring(0, 100));
        const extractResponse = await groqAIService.chatCompletion(
          [{ role: 'user', content: extractPassengerPrompt }],
          { temperature: 0.1 }
        );
        console.log(
          '[ChatbotService] Passenger extraction response:',
          extractResponse.content.substring(0, 300)
        );

        // Extract JSON from response - be more robust, handle markdown code blocks
        let extractedPassengers = [];

        // First try to extract from markdown code blocks
        let jsonString = extractResponse.content;
        let codeBlockMatch = jsonString.match(/```(?:json)?\s*([\s\S]*?)```/);
        if (codeBlockMatch) {
          jsonString = codeBlockMatch[1].trim();
          console.log('[ChatbotService] Found JSON in markdown block');
        }

        // Try to find JSON object in the response
        // Use a more robust approach: find the last complete JSON object
        let passengerMatch = null;

        // First try to find JSON with proper nesting
        const jsonMatches = jsonString.match(/\{[\s\S]*\}/g);
        if (jsonMatches && jsonMatches.length > 0) {
          // Take the longest match (most likely to be complete)
          passengerMatch = jsonMatches.reduce((prev, curr) =>
            curr.length > prev.length ? curr : prev
          );
          console.log('[ChatbotService] Passenger JSON match attempt:', {
            hasMatch: !!passengerMatch,
            matchLength: passengerMatch ? passengerMatch.length : 0,
            firstMatch: passengerMatch ? passengerMatch.substring(0, 150) : 'none',
            totalMatches: jsonMatches.length,
          });
        } else {
          console.log('[ChatbotService] No JSON object found in response');
        }

        if (passengerMatch) {
          try {
            jsonString = passengerMatch.replace(/^`+|`+$/g, '').trim();
            console.log('[ChatbotService] Attempting to parse JSON:', jsonString.substring(0, 200));
            const parsed = JSON.parse(jsonString);

            if (parsed.passengers && Array.isArray(parsed.passengers)) {
              extractedPassengers = parsed.passengers.map((p) => ({
                fullName: p.fullName || null,
                documentId: p.documentId || null,
                phone: p.phone || null,
                email: p.email || null,
              }));
              console.log('[ChatbotService] Successfully parsed passengers info:', {
                count: extractedPassengers.length,
                passengers: extractedPassengers,
                completePassengers: parsed.completePassengers || 0,
              });
            }
          } catch (e) {
            console.warn('[ChatbotService] Failed to parse passenger JSON:', e.message);
            console.warn('[ChatbotService] JSON string was:', jsonString);
            console.warn(
              '[ChatbotService] Raw response was:',
              extractResponse.content.substring(0, 300)
            );
          }
        } else {
          console.warn('[ChatbotService] No JSON object found in passenger response');
          console.warn('[ChatbotService] Full response was:', extractResponse.content);
        }

        // Validate extracted passenger info and filter valid ones
        const validPassengers = extractedPassengers.filter((p) => {
          const isEmailValid = !p.email || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(p.email);

          if (!isEmailValid) {
            console.warn('[ChatbotService] Invalid email for passenger:', p.email);
            return false;
          }
          return true;
        });

        console.log('[ChatbotService] Valid passengers after validation:', {
          extracted: extractedPassengers.length,
          valid: validPassengers.length,
          total_needed: totalPassengerCount,
          already_extracted: alreadyExtractedCount,
          remaining_needed: remainingPassengerCount,
        });

        // Validate each passenger against imported passengerSchema
        const validatedPassengers = [];
        const invalidPassengers = [];

        for (const p of validPassengers) {
          const { error, value } = passengerSchema.validate(p, { abortEarly: false });

          if (error) {
            invalidPassengers.push({
              passenger: p,
              error: error.details.map((d) => d.message).join(', '),
            });
            console.log('[ChatbotService] Passenger validation failed:', {
              fullName: p.fullName,
              errors: error.details.map((d) => d.message),
            });
          } else {
            validatedPassengers.push(value);
          }
        }

        console.log('[ChatbotService] Passenger validation results:', {
          extracted: validPassengers.length,
          valid: validatedPassengers.length,
          invalid: invalidPassengers.length,
        });

        if (invalidPassengers.length > 0) {
          console.log(
            '[ChatbotService] Invalid passengers:',
            invalidPassengers.map((ip) => `${ip.passenger.fullName || 'unknown'}: ${ip.error}`)
          );

          // If we have SOME valid passengers, save them and ask for remaining/invalid passengers
          if (validatedPassengers.length > 0) {
            console.log(
              '[ChatbotService] Partial validation - saving valid passengers and asking for remaining'
            );
            // Merge with already extracted passengers
            const allPassengers = (updatedContext.passengerInfo || []).concat(validatedPassengers);
            updatedContext.passengerInfo = allPassengers;
            await conversationRepository.saveBookingContext(sessionId, updatedContext);

            const remainingPassengers = totalPassengerCount - allPassengers.length;
            return {
              text:
                lang === 'vi'
                  ? `Cảm ơn! Tôi đã nhận thông tin của ${allPassengers.length} hành khách. Vui lòng cung cấp thông tin cho ${remainingPassengers} hành khách còn lại: Tên đầy đủ, Số CMND/Passport (9-12 ký tự), Số điện thoại.`
                  : `Thank you! I have information for ${allPassengers.length} passenger(s). Please provide information for the remaining ${remainingPassengers} passenger(s): Full name, Document ID (9-12 characters), Phone number.`,
              suggestions:
                lang === 'vi'
                  ? [
                      `Hành khách ${allPassengers.length + 1}: Nguyễn Văn B, 32323411213, 0987654321`,
                    ]
                  : [`Passenger ${allPassengers.length + 1}: John Doe, 123456789, 0987654321`],
            };
          }

          // If ALL passengers are invalid, generate natural error response
          console.log(
            '[ChatbotService] All passengers invalid - generating natural error response'
          );

          // Use AI to generate a natural, helpful error message
          const errorPrompt = `User tried to provide passenger information but it was incomplete or invalid.
Extracted data: ${JSON.stringify(validatedPassengers)}
Validation errors: ${invalidPassengers.map((ip) => ip.error).join('; ')}

Generate a FRIENDLY, NATURAL response asking the user to provide correct passenger information.
Format should be conversational, not technical. 
Ask for: Full name (e.g., "John Doe"), Document ID (9-12 characters, e.g., "123456789"), Phone number (10 digits, e.g., "0912345678")
Language: ${lang === 'vi' ? 'Vietnamese' : 'English'}

Return ONLY the text response, no JSON, no explanations.`;

          const errorResponse = await groqAIService.chatCompletion(
            [{ role: 'user', content: errorPrompt }],
            { temperature: 0.7 }
          );

          return {
            text: errorResponse.content.trim(),
            suggestions:
              lang === 'vi'
                ? ['Hành khách: Nguyễn Văn A, 32323411213, 0987654321']
                : ['Passenger: John Doe, 123456789, 0987654321'],
          };
        }

        // Count complete passengers (all fields validated per schema)
        const completePassengers = validatedPassengers;
        console.log(
          '[ChatbotService] Complete passengers (name + documentId + phone):',
          completePassengers.length
        );

        if (completePassengers.length > 0) {
          // Merge with already extracted passengers
          const allPassengers = (updatedContext.passengerInfo || []).concat(completePassengers);
          updatedContext.passengerInfo = allPassengers;
          console.log('[ChatbotService] Saved extracted passenger info:', {
            newPassengers: completePassengers.length,
            totalPassengers: allPassengers.length,
            all: allPassengers,
          });
          await conversationRepository.saveBookingContext(sessionId, updatedContext);
        }

        // Re-calculate total passengers after extraction
        const finalPassengerCount =
          (updatedContext.passengerInfo && updatedContext.passengerInfo.length) || 0;

        // Check if we have complete info for all passengers
        if (finalPassengerCount < totalPassengerCount) {
          const remainingPassengers = totalPassengerCount - finalPassengerCount;
          console.log(`[ChatbotService] Need info for ${remainingPassengers} more passenger(s)`);
          console.log(
            '[ChatbotService] Missing required fields: fullName, documentId (9-12 chars), phone'
          );

          return {
            text:
              lang === 'vi'
                ? `Cảm ơn! Tôi đã nhận thông tin của ${finalPassengerCount} hành khách. Vui lòng cung cấp thông tin cho ${remainingPassengers} hành khách còn lại: Tên đầy đủ, Số CMND/Passport (9-12 ký tự), Số điện thoại.`
                : `Thank you! I have information for ${finalPassengerCount} passenger(s). Please provide information for the remaining ${remainingPassengers} passenger(s): Full name, Document ID (9-12 characters), Phone number.`,
            suggestions:
              lang === 'vi'
                ? [`Hành khách ${finalPassengerCount + 1}: Nguyễn Văn B, 32323411213, 0987654321`]
                : [`Passenger ${finalPassengerCount + 1}: John Doe, 123456789, 0987654321`],
          };
        }

        // If we still don't have passenger info, ask again
        if (!updatedContext.passengerInfo || updatedContext.passengerInfo.length === 0) {
          const infoText =
            lang === 'vi'
              ? `Vui lòng cung cấp thông tin cho ${totalPassengerCount} hành khách (Tên đầy đủ, Số điện thoại, Số CMND/Passport):`
              : `Please provide information for ${totalPassengerCount} passenger(s) (Full name, Phone number, Document ID):`;

          return {
            text: infoText,
            suggestions:
              lang === 'vi'
                ? [`Hành khách 1: Nguyễn Văn A, 0912345678, a@email.com`]
                : [`Passenger 1: John Doe, 0912345678, john@email.com`],
          };
        }
      }

      // All information collected - create booking
      // Support guest checkout - no authentication required
      try {
        const passengerCount =
          (updatedContext.selectedSeats && updatedContext.selectedSeats.length) || 1;
        const passengerInfoArray = Array.isArray(updatedContext.passengerInfo)
          ? updatedContext.passengerInfo
          : updatedContext.passengerInfo
            ? [updatedContext.passengerInfo]
            : [];

        console.log('[ChatbotService] All booking info collected, creating booking:', {
          hasSelectedTrip: !!updatedContext.selectedTrip,
          hasSelectedSeats: !!updatedContext.selectedSeats,
          seatCount: updatedContext.selectedSeats?.length || 0,
          passengerInfoCount: passengerInfoArray.length,
          passengerInfoArray: passengerInfoArray.map((p, i) => ({
            index: i,
            fullName: p.fullName || 'N/A',
            phone: p.phone || 'N/A',
            email: p.email || 'N/A',
          })),
        });

        // CRITICAL: Validate that ALL passengers pass schema validation before booking
        const completePassengersCount = passengerInfoArray.filter((p) => {
          const { error } = passengerSchema.validate(p);
          return !error; // Valid if no validation errors
        }).length;
        if (completePassengersCount < passengerCount) {
          const missingPassengers = passengerCount - completePassengersCount;
          console.warn(
            `[ChatbotService] Cannot create booking - missing ${missingPassengers} passenger(s) info`
          );
          return {
            text:
              lang === 'vi'
                ? `Thông tin hành khách chưa đầy đủ. Cần cung cấp thêm ${missingPassengers} hành khách (Tên đầy đủ, Số CMND/Passport, Số điện thoại).`
                : `Incomplete passenger information. Need to provide ${missingPassengers} more passenger(s) (Full name, Document ID, Phone number).`,
            suggestions:
              lang === 'vi'
                ? ['Hành khách: Nguyễn Văn B, 32323411213, 0987654321']
                : ['Passenger: John Doe, 123456789, 0987654321'],
          };
        }

        const selectedTrip = updatedContext.selectedTrip;
        const tripId = selectedTrip.tripId || selectedTrip.trip_id;
        const seats = updatedContext.selectedSeats || [];

        console.log('[ChatbotService] About to create booking with:', {
          tripId,
          seatCount: seats.length,
          passengerCount: passengerInfoArray.length,
          hasContactInfo: !!updatedContext.contactInfo,
          passengerInfo: passengerInfoArray,
        });

        // Create the booking
        const bookingResult = await this.createBooking(
          sessionId,
          tripId,
          seats,
          passengerInfoArray,
          updatedContext.contactInfo, // Pass contactInfo (for guest checkout)
          authToken // Pass authToken (for authenticated users)
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
              data: bookingResult.booking || {
                bookingId: bookingResult.bookingId,
                bookingReference: bookingResult.bookingReference,
                passengers: bookingResult.passengers,
                pricing: bookingResult.pricing,
                tripDetails: bookingResult.tripDetails,
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

        // Provide specific error feedback to user
        let errorMsg = this.responses.booking_error[lang];
        let suggestions =
          lang === 'vi' ? ['Thử lại', 'Liên hệ hỗ trợ'] : ['Try again', 'Contact support'];

        if (error.message && error.message.includes('already booked')) {
          // Seat was already booked - clear booking context and ask user to select different seats
          errorMsg =
            lang === 'vi'
              ? 'Ghế này đã được đặt trước đó. Vui lòng chọn ghế khác hoặc tìm chuyến khác.'
              : 'This seat has already been booked. Please select a different seat or search for another trip.';
          // Clear all booking context to start fresh
          updatedContext.selectedSeats = [];
          updatedContext.passengerInfo = null;
          await conversationRepository.saveBookingContext(sessionId, updatedContext);
          suggestions =
            lang === 'vi'
              ? ['Chọn ghế khác', 'Tìm chuyến khác']
              : ['Select different seat', 'Search another trip'];
        } else if (error.message && error.message.includes('email')) {
          errorMsg =
            lang === 'vi'
              ? 'Email không hợp lệ. Vui lòng cung cấp email hợp lệ (ví dụ: email@example.com)'
              : 'Invalid email format. Please provide a valid email address (e.g., email@example.com)';
          // Clear passenger info so user can provide complete info again
          updatedContext.passengerInfo = null;
          await conversationRepository.saveBookingContext(sessionId, updatedContext);
        } else if (error.message && error.message.includes('required')) {
          errorMsg =
            lang === 'vi'
              ? 'Thông tin hành khách không đầy đủ. Vui lòng cung cấp: Tên đầy đủ, Số điện thoại và Số CMND/Passport.'
              : 'Incomplete passenger information. Please provide: Full name, Phone number, and Document ID.';
          // Clear passenger info so user can provide complete info again
          updatedContext.passengerInfo = null;
          await conversationRepository.saveBookingContext(sessionId, updatedContext);
        } else {
          // Generic booking error - clear booking context
          updatedContext.selectedSeats = [];
          updatedContext.passengerInfo = null;
          await conversationRepository.saveBookingContext(sessionId, updatedContext);
        }

        return {
          text: errorMsg,
          suggestions,
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
  async createBooking(
    sessionId,
    tripId,
    seats,
    passengerInfo,
    contactInfoOrAuthToken = null,
    authToken = null
  ) {
    // Support both old signature (5 params with authToken) and new signature (6 params with contactInfo)
    // If 5th param is an object with phone/email, it's contactInfo; otherwise it's authToken
    let contactInfo = null;
    let finalAuthToken = null;

    if (
      contactInfoOrAuthToken &&
      typeof contactInfoOrAuthToken === 'object' &&
      !Array.isArray(contactInfoOrAuthToken) &&
      contactInfoOrAuthToken.phone !== undefined
    ) {
      // New signature: contactInfo provided as 5th param
      contactInfo = contactInfoOrAuthToken;
      finalAuthToken = authToken || null;
    } else {
      // Old signature: authToken provided as 5th param
      finalAuthToken = contactInfoOrAuthToken;
    }

    console.log('[ChatbotService] Creating booking:', {
      sessionId,
      tripId,
      seatCount: seats.length,
      hasContactInfo: !!contactInfo,
      hasAuthToken: !!finalAuthToken,
      passengerInfoType: Array.isArray(passengerInfo) ? 'array' : 'object',
      passengerInfoLength: Array.isArray(passengerInfo) ? passengerInfo.length : 'N/A',
    });
    console.log('[ChatbotService] Raw passengerInfo:', JSON.stringify(passengerInfo, null, 2));
    console.log(
      '[ChatbotService] Contact info:',
      contactInfo ? { phone: contactInfo.phone, hasEmail: !!contactInfo.email } : 'none'
    );
    try {
      // Handle both single passenger object and array of passengers
      let passengers = [];

      if (Array.isArray(passengerInfo)) {
        // Multiple passengers provided
        if (passengerInfo.length !== seats.length) {
          console.warn(
            `[ChatbotService] Passenger count (${passengerInfo.length}) doesn't match seat count (${seats.length})`
          );
        }

        // Map each passenger to their corresponding seat
        passengers = seats.map((seatCode, index) => {
          const passenger = passengerInfo[index] || passengerInfo[0]; // Use first if not enough

          // Validate passenger has required fields
          if (!passenger.fullName || !passenger.phone) {
            throw new Error(
              `Passenger ${index + 1}: Missing required information (name and phone)`
            );
          }

          const passengerObj = {
            fullName: passenger.fullName,
            phone: passenger.phone,
            documentId: passenger.documentId || null,
            seatCode: String(seatCode).toUpperCase(),
          };

          // Only include email if it has a value (don't send null)
          if (passenger.email) {
            passengerObj.email = passenger.email;
          }

          return passengerObj;
        });
      } else {
        // Single passenger for all seats (legacy support)
        if (!passengerInfo.fullName || !passengerInfo.phone) {
          throw new Error('Missing required passenger information: name and phone number');
        }

        // Validate email format if provided
        if (passengerInfo.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(passengerInfo.email)) {
          throw new Error('Invalid email format: ' + passengerInfo.email);
        }

        passengers = seats.map((seatCode) => {
          const passengerObj = {
            fullName: passengerInfo.fullName,
            phone: passengerInfo.phone,
            documentId: passengerInfo.documentId || null,
            seatCode: String(seatCode).toUpperCase(),
          };

          // Only include email if it has a value (don't send null)
          if (passengerInfo.email) {
            passengerObj.email = passengerInfo.email;
          }

          return passengerObj;
        });
      }

      // Detect language from first passenger name
      const lang = this.detectLanguage(passengers[0].fullName);
      console.log('[ChatbotService] Detected language for booking:', lang);

      console.log('[ChatbotService] Built passengers array:', JSON.stringify(passengers, null, 2));

      const bookingData = {
        tripId,
        seats: seats.map((s) => String(s).toUpperCase()),
        passengers: passengers,
        // Use contactInfo if provided (guest checkout or authenticated user with contact info)
        // For authenticated users, contactInfo should be auto-filled from JWT
        // Fallback to first passenger email only for guest users
        contactEmail: contactInfo?.email || passengers[0].email || '',
        contactPhone: contactInfo?.phone || passengers[0].phone,
        isGuestCheckout: !finalAuthToken,
      };

      console.log('[ChatbotService] Booking data prepared:', {
        tripId,
        seats: bookingData.seats,
        passengerCount: passengers.length,
        isGuestCheckout: !finalAuthToken,
        hasContactInfo: !!contactInfo,
        passengersData: passengers.map((p, i) => ({
          index: i,
          name: p.fullName,
          phone: p.phone,
          seatCode: p.seatCode,
        })),
      });

      const result = await bookingServiceClient.createBooking(bookingData, finalAuthToken);
      console.log('[ChatbotService] Booking created via service client:', {
        success: !!result.data,
        bookingId: result.data?.booking_id,
        passengerCount: result.data?.passengers?.length || 0,
      });

      // Preserve booking confirmation in context (don't clear completely)
      // This allows user to pay later by saying "pay now"
      console.log(
        '[ChatbotService] Saving booking confirmation in context for session:',
        sessionId
      );
      await conversationRepository.saveBookingContext(sessionId, {
        bookingConfirmation: {
          bookingId: result.data.booking_id,
          bookingReference: result.data.booking_reference,
          paymentInfo: result.data.payment_info,
          passengerCount: result.data.passengers?.length || passengers.length,
          createdAt: new Date().toISOString(),
        },
      });

      return {
        success: true,
        bookingId: result.data.booking_id,
        bookingReference: result.data.booking_reference,
        message: this.responses.booking_success[lang].replace(
          '${ref}',
          result.data.booking_reference
        ),
        paymentInfo: result.data.payment_info,
        // Include full booking details for display
        booking: {
          bookingId: result.data.booking_id,
          bookingReference: result.data.booking_reference,
          status: result.data.status,
          passengers: result.data.passengers,
          passengerCount: result.data.passengers?.length || passengers.length,
          pricing: result.data.pricing,
          tripDetails: result.data.trip_details,
          lockedUntil: result.data.locked_until,
        },
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
