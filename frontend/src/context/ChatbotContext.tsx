import React, { useState, useCallback, useEffect } from 'react'
import type { ReactNode } from 'react'
import type { ChatMessage } from '../types/chatbot.types'
import { ChatbotContext } from './ChatbotContextValue'
import { chatbotApi } from '../api/chatbot'
import { getAccessToken } from '../api/auth'

interface ChatbotContextType {
  sessionId: string | null
  messages: ChatMessage[]
  isLoading: boolean
  error: string | null
  isOpen: boolean
  isSessionValid: boolean
  addMessage: (message: ChatMessage) => void
  clearMessages: () => void
  setIsLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  setIsOpen: (open: boolean) => void
  setSessionId: (sessionId: string | null) => void
  toggleChat: () => void
  loadHistory: () => Promise<void>
}

interface ChatbotProviderProps {
  children: ReactNode
  initialSessionId?: string
}

const CHATBOT_SESSION_KEY = 'chatbot_session_id'

export const ChatbotProvider: React.FC<ChatbotProviderProps> = ({
  children,
  initialSessionId,
}) => {
  // Load sessionId from localStorage or use initial value
  const [sessionId, setSessionIdState] = useState<string | null>(() => {
    if (initialSessionId) return initialSessionId
    if (typeof window !== 'undefined') {
      return localStorage.getItem(CHATBOT_SESSION_KEY)
    }
    return null
  })

  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [isSessionValid, setIsSessionValid] = useState(() => {
    // Assume session is valid if it exists in localStorage
    if (initialSessionId) return true
    if (typeof window !== 'undefined') {
      return localStorage.getItem(CHATBOT_SESSION_KEY) !== null
    }
    return false
  })

  // Load conversation history when sessionId is available
  const loadHistory = useCallback(async () => {
    if (!sessionId) return

    try {
      setIsLoading(true)
      setError(null)

      const token = getAccessToken()
      const response = await chatbotApi.getHistory(
        sessionId,
        token || undefined
      )

      if (response.success && response.data.messages) {
        // Convert backend message format to frontend format
        const historyMessages: ChatMessage[] = response.data.messages.map(
          (msg) => ({
            id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            content:
              typeof msg.content === 'string'
                ? msg.content
                : 'Message content unavailable',
            role: msg.role,
            timestamp: isNaN(new Date(msg.timestamp).getTime())
              ? Date.now()
              : new Date(msg.timestamp).getTime(),
            intent: msg.metadata?.intent,
            entities: msg.metadata?.entities,
            suggestions: msg.metadata?.suggestions,
            actions: msg.metadata?.actions,
          })
        )

        setMessages(historyMessages)
        setIsSessionValid(true)
      }
    } catch (err) {
      console.warn('Failed to load conversation history:', err)
      // If session not found, clear the stored sessionId
      if (err instanceof Error && err.message.includes('Session not found')) {
        if (typeof window !== 'undefined') {
          localStorage.removeItem(CHATBOT_SESSION_KEY)
        }
        setSessionIdState(null)
        setIsSessionValid(false)
        setMessages([])
      }
      // Don't set error state for history loading failures - just start fresh
    } finally {
      setIsLoading(false)
    }
  }, [sessionId])

  // Load history when sessionId changes
  useEffect(() => {
    if (sessionId) {
      loadHistory()
    }
  }, [sessionId, loadHistory])

  const setSessionId = useCallback((newSessionId: string | null) => {
    setSessionIdState(newSessionId)
    setIsSessionValid(newSessionId !== null)
    if (newSessionId) {
      if (typeof window !== 'undefined') {
        localStorage.setItem(CHATBOT_SESSION_KEY, newSessionId)
      }
    } else {
      if (typeof window !== 'undefined') {
        localStorage.removeItem(CHATBOT_SESSION_KEY)
      }
    }
  }, [])

  const addMessage = useCallback((message: ChatMessage) => {
    setMessages((prev) => [...prev, message])
  }, [])

  const clearMessages = useCallback(() => {
    setMessages([])
  }, [])

  const toggleChat = useCallback(() => {
    setIsOpen((prev) => !prev)
  }, [])

  const value: ChatbotContextType = {
    sessionId,
    messages,
    isLoading,
    error,
    isOpen,
    isSessionValid,
    addMessage,
    clearMessages,
    setIsLoading,
    setError,
    setIsOpen,
    setSessionId,
    toggleChat,
    loadHistory,
  }

  return (
    <ChatbotContext.Provider value={value}>{children}</ChatbotContext.Provider>
  )
}

export type { ChatbotContextType }
