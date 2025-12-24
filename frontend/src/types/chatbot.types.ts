/**
 * Chatbot-related type definitions
 * Defines interfaces for chat messages, bot responses, and API communication
 */

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: number
  actions?: ChatAction[]
  suggestions?: string[]
  entities?: Record<string, unknown>
  intent?: string
}

export interface ChatAction {
  type: 'search_results' | 'booking_confirmation' | 'payment_link' | string
  data: unknown
}

export interface ChatbotSession {
  id: string
  userId?: string
  createdAt: number
  updatedAt: number
}

export interface BotResponse {
  text: string
  intent?: string
  entities?: Record<string, unknown>
  suggestions?: string[]
  actions?: ChatAction[]
}

export interface TripEntity {
  origin: string
  destination: string
  date: string
  time?: string
}

export interface PassengerInfo {
  fullName: string
  documentId: string
  phone: string
}

export interface ChatbotQueryResponse {
  sessionId: string
  response: BotResponse
  messageId: string
}
