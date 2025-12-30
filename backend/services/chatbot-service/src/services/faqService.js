const { searchFAQ, getFAQByTopic, getAllTopics } = require('../data/faqKnowledgeBase');
const groqAIService = require('./groqAIService');

class FAQService {
  constructor() {
    // Keywords that indicate user wants to talk to a human
    this.escalationKeywords = {
      en: ['talk to human', 'speak to agent', 'customer service', 'support team', 'real person', 'human support', 'escalate', 'complaint', 'speak with someone', 'talk to someone', 'human agent'],
      vi: ['nói chuyện người thật', 'gặp nhân viên', 'dịch vụ khách hàng', 'đội hỗ trợ', 'người thật', 'hỗ trợ trực tiếp', 'khiếu nại', 'phàn nàn', 'nói chuyện với người', 'gặp ai đó', 'nhân viên hỗ trợ', 'talk to a human', 'talk to human']
    };
  }

  /**
   * Check if user wants to escalate to human support
   */
  shouldEscalate(message, language = 'en') {
    const keywords = this.escalationKeywords[language] || this.escalationKeywords.en;
    const messageLower = message.toLowerCase();
    
    return keywords.some(keyword => messageLower.includes(keyword.toLowerCase()));
  }

  /**
   * Process FAQ query
   */
  async processFAQQuery(message, language = 'en') {
    try {
      // Check for escalation first
      if (this.shouldEscalate(message, language)) {
        return this.getEscalationResponse(language);
      }

      // Search for relevant FAQ
      const searchResults = searchFAQ(message, language);

      if (searchResults.length === 0) {
        // No FAQ found, try using AI to understand and provide general help
        return this.getNoFAQFoundResponse(message, language);
      }

      // Get the best match (highest score)
      const bestMatch = searchResults[0];

      // If match score is good, return the FAQ
      if (bestMatch.matchScore >= 2) {
        return this.formatFAQResponse(bestMatch, language);
      }

      // If match score is low, offer suggestions
      return this.getDidYouMeanResponse(searchResults.slice(0, 3), language);

    } catch (error) {
      console.error('[FAQService] Error processing FAQ query:', error);
      return this.getErrorResponse(language);
    }
  }

  /**
   * Format FAQ response
   */
  formatFAQResponse(faq, language) {
    return {
      intent: 'faq',
      response: faq.answer,
      suggestions: [
        ...(faq.relatedLinks || []).map(link => link.text),
        language === 'vi' ? 'Hỏi câu khác' : 'Ask another question',
        language === 'vi' ? 'Nói chuyện với nhân viên' : 'Talk to support agent'
      ],
      relatedLinks: faq.relatedLinks || [],
      topic: faq.topic,
      requiresAction: false
    };
  }

  /**
   * Get escalation response
   */
  getEscalationResponse(language) {
    const responses = {
      en: {
        response: `I understand you'd like to speak with a human support agent. Here are your options:

📞 **Contact Support:**
- **Hotline:** 1900-xxxx (24/7)
- **Email:** support@busticket.com
- **Response time:** Immediate via phone, within 24 hours via email

💬 **Live Chat:**
- Available 8:00 AM - 10:00 PM daily
- Click the "Live Chat" button below to connect

📱 **Social Media:**
- Facebook: /BusTicketBooking
- Instagram: @busticketbooking

**What to prepare:**
- Your booking reference number (if applicable)
- Email used for booking
- Details of your inquiry

Would you like me to help you with anything else while you wait?`,
        suggestions: [
          'Call support now',
          'Send email',
          'Start live chat',
          'Continue with chatbot'
        ],
        requiresAction: true,
        actionType: 'escalate_to_human',
        contactMethods: [
          { type: 'phone', value: '1900-xxxx', label: 'Call Now' },
          { type: 'email', value: 'support@busticket.com', label: 'Send Email' },
          { type: 'live_chat', value: true, label: 'Start Live Chat' }
        ]
      },
      vi: {
        response: `Tôi hiểu bạn muốn nói chuyện với nhân viên hỗ trợ. Đây là các lựa chọn:

📞 **Liên hệ hỗ trợ:**
- **Hotline:** 1900-xxxx (24/7)
- **Email:** support@busticket.com
- **Thời gian phản hồi:** Ngay qua điện thoại, trong 24 giờ qua email

💬 **Chat trực tuyến:**
- Có sẵn 8:00 - 22:00 hàng ngày
- Nhấn nút "Chat trực tuyến" bên dưới để kết nối

📱 **Mạng xã hội:**
- Facebook: /BusTicketBooking
- Instagram: @busticketbooking

**Chuẩn bị:**
- Số tham chiếu đặt vé (nếu có)
- Email dùng khi đặt vé
- Chi tiết câu hỏi của bạn

Tôi có thể giúp gì khác trong khi bạn đợi không?`,
        suggestions: [
          'Gọi hỗ trợ ngay',
          'Gửi email',
          'Bắt đầu chat trực tuyến',
          'Tiếp tục với chatbot'
        ],
        requiresAction: true,
        actionType: 'escalate_to_human',
        contactMethods: [
          { type: 'phone', value: '1900-xxxx', label: 'Gọi ngay' },
          { type: 'email', value: 'support@busticket.com', label: 'Gửi Email' },
          { type: 'live_chat', value: true, label: 'Chat trực tuyến' }
        ]
      }
    };

    const response = responses[language] || responses.en;
    return {
      intent: 'escalate',
      ...response
    };
  }

  /**
   * Get "did you mean" response when match score is low
   */
  getDidYouMeanResponse(faqs, language) {
    const intro = language === 'vi' 
      ? 'Tôi có thể giúp bạn với các chủ đề sau. Bạn có muốn biết về:'
      : 'I can help you with the following topics. Would you like to know about:';

    const suggestions = faqs.map(faq => faq.question);
    suggestions.push(language === 'vi' ? 'Nói chuyện với nhân viên' : 'Talk to support agent');

    return {
      intent: 'faq_suggestion',
      response: intro,
      suggestions,
      requiresAction: false
    };
  }

  /**
   * Get response when no FAQ found
   */
  async getNoFAQFoundResponse(message, language) {
    const notFound = {
      en: {
        response: `I couldn't find specific information about that in my knowledge base. However, I can help you with:

📝 **Common Topics:**
- Booking and cancellation policies
- Payment methods and refunds
- Luggage allowance
- E-ticket usage
- Seat selection
- Booking modifications
- Contact support

Would you like to:
1. Rephrase your question
2. Choose a topic from above
3. Speak with a support agent

Or you can simply tell me what you'd like to do!`,
        suggestions: [
          'Cancellation policy',
          'Payment methods',
          'How to book',
          'Talk to support agent'
        ]
      },
      vi: {
        response: `Tôi không tìm thấy thông tin cụ thể về điều đó trong cơ sở kiến thức. Tuy nhiên, tôi có thể giúp bạn với:

📝 **Chủ đề phổ biến:**
- Chính sách đặt vé và hủy vé
- Phương thức thanh toán và hoàn tiền
- Quy định hành lý
- Sử dụng vé điện tử
- Chọn ghế
- Thay đổi thông tin đặt vé
- Liên hệ hỗ trợ

Bạn muốn:
1. Diễn đạt lại câu hỏi
2. Chọn chủ đề từ danh sách trên
3. Nói chuyện với nhân viên hỗ trợ

Hoặc bạn có thể nói cho tôi biết bạn muốn làm gì!`,
        suggestions: [
          'Chính sách hủy vé',
          'Phương thức thanh toán',
          'Cách đặt vé',
          'Nói chuyện với nhân viên'
        ]
      }
    };

    const response = notFound[language] || notFound.en;
    return {
      intent: 'faq_not_found',
      ...response,
      requiresAction: false
    };
  }

  /**
   * Get error response
   */
  getErrorResponse(language) {
    const error = {
      en: {
        response: `I apologize, but I encountered an error while processing your question. Please try again or contact our support team for immediate assistance.

📞 Support: 1900-xxxx
📧 Email: support@busticket.com`,
        suggestions: [
          'Try again',
          'Talk to support agent',
          'Return to main menu'
        ]
      },
      vi: {
        response: `Xin lỗi, tôi gặp lỗi khi xử lý câu hỏi của bạn. Vui lòng thử lại hoặc liên hệ đội ngũ hỗ trợ để được trợ giúp ngay.

📞 Hỗ trợ: 1900-xxxx
📧 Email: support@busticket.com`,
        suggestions: [
          'Thử lại',
          'Nói chuyện với nhân viên',
          'Quay về menu chính'
        ]
      }
    };

    const response = error[language] || error.en;
    return {
      intent: 'faq_error',
      ...response,
      requiresAction: false
    };
  }

  /**
   * Get FAQ by specific topic
   */
  getFAQByTopic(topic, language = 'en') {
    const faq = getFAQByTopic(topic, language);
    if (!faq) {
      return this.getNoFAQFoundResponse('', language);
    }
    return this.formatFAQResponse({ ...faq, topic, matchScore: 999 }, language);
  }

  /**
   * Get list of all available topics
   */
  getAllTopics(language = 'en') {
    const topics = getAllTopics(language);
    const intro = language === 'vi'
      ? 'Đây là các chủ đề tôi có thể giúp bạn:'
      : 'Here are the topics I can help you with:';

    return {
      intent: 'faq_topics',
      response: intro,
      topics,
      suggestions: topics.map(t => t.question),
      requiresAction: false
    };
  }
}

module.exports = new FAQService();
