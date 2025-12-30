import { request as apiRequest } from './auth'
import type { ChatAction } from '../types/chatbot.types'

export interface ChatbotQueryRequest {
  sessionId?: string
  message: string
  context?: {
    userId?: string
    previousMessages?: {
      role: 'user' | 'assistant' | 'system'
      content: string
    }[]
  }
}

export interface ChatbotQueryResponse {
  success: boolean
  data: {
    sessionId: string
    messageId?: string
    response: {
      text: string
      intent?: string
      entities?: Record<string, unknown>
      suggestions?: string[]
      actions?: ChatAction[]
    }
  }
}

export interface ChatbotBookRequest {
  sessionId: string
  tripId: string
  seats: string[]
  passengerInfo: {
    fullName: string
    documentId: string
    phone: string
  }
}

export interface ChatbotBookResponse {
  success: boolean
  data: {
    bookingId: string
    response: {
      text: string
      paymentUrl?: string
      bookingReference?: string
    }
  }
}

export interface ChatbotHistoryResponse {
  success: boolean
  data: {
    sessionId: string
    messages: {
      role: 'user' | 'assistant' | 'system'
      content: string
      timestamp: string
    }[]
    count: number
  }
}

export const chatbotApi = {
  /**
   * Send a message to the chatbot
   */
  async sendMessage(
    request: ChatbotQueryRequest,
    token?: string
  ): Promise<ChatbotQueryResponse> {
    return apiRequest('/chatbot/query', {
      method: 'POST',
      body: request,
      token,
    })
  },

  /**
   * Process booking through chatbot
   */
  async bookTrip(
    request: ChatbotBookRequest,
    token?: string
  ): Promise<ChatbotBookResponse> {
    return apiRequest('/chatbot/book', {
      method: 'POST',
      body: request,
      token,
    })
  },

  /**
   * Get conversation history for a session
   */
  async getHistory(
    sessionId: string,
    token?: string
  ): Promise<ChatbotHistoryResponse> {
    return apiRequest(`/chatbot/sessions/${sessionId}/history`, {
      method: 'GET',
      token,
    })
  },

  /**
   * Reset a conversation session
   */
  async resetSession(
    sessionId: string,
    token?: string
  ): Promise<{ success: boolean; data: { message: string } }> {
    return apiRequest(`/chatbot/sessions/${sessionId}/reset`, {
      method: 'POST',
      token,
    })
  },

  /**
   * Submit passenger information form
   */
  async submitPassengerInfo(
    request: {
      sessionId: string
      passengers: Array<{
        seat_code: string
        full_name: string
        phone: string
        email: string
        id_number?: string
      }>
    },
    token?: string
  ): Promise<{
    success: boolean
    data: {
      text: string
      actions?: ChatAction[]
      suggestions?: string[]
    }
  }> {
    return apiRequest('/chatbot/submit-passenger-info', {
      method: 'POST',
      body: request,
      token,
    })
  },

  /**
   * Submit feedback for a chatbot message
   */
  async submitFeedback(
    request: {
      sessionId: string
      messageId: string
      rating: 'positive' | 'negative'
      comment?: string
    },
    token?: string
  ): Promise<{
    success: boolean
    data: {
      success: boolean
      message: string
    }
  }> {
    return apiRequest('/chatbot/feedback', {
      method: 'POST',
      body: request,
      token,
    })
  },
}
