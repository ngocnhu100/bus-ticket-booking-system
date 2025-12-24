import { useCallback, useState } from 'react'
import { chatbotApi, type ChatbotQueryResponse } from '../api/chatbot'
import type { ChatMessage } from '../types/chatbot.types'
import { getAccessToken } from '../api/auth'

interface UseChatbotAPIOptions {
  onSuccess?: (response: ChatbotQueryResponse) => void
  onError?: (error: Error) => void
}

export const useChatbotAPI = (options: UseChatbotAPIOptions = {}) => {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const sendMessage = useCallback(
    async (
      sessionId: string,
      message: string,
      previousMessages: ChatMessage[] = []
    ) => {
      setIsLoading(true)
      setError(null)

      try {
        const token = getAccessToken()
        const response = await chatbotApi.sendMessage(
          {
            sessionId,
            message,
            context: {
              previousMessages,
            },
          },
          token || undefined
        )

        options.onSuccess?.(response)
        return response
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Unknown error')
        setError(error)
        options.onError?.(error)
        throw error
      } finally {
        setIsLoading(false)
      }
    },
    [options]
  )

  const getHistory = useCallback(
    async (sessionId: string) => {
      setIsLoading(true)
      setError(null)

      try {
        const token = getAccessToken()
        const response = await chatbotApi.getHistory(
          sessionId,
          token || undefined
        )
        return response
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Unknown error')
        setError(error)
        options.onError?.(error)
        throw error
      } finally {
        setIsLoading(false)
      }
    },
    [options]
  )

  const bookTrip = useCallback(
    async (
      sessionId: string,
      tripId: string,
      seats: string[],
      passengerInfo: {
        fullName: string
        documentId: string
        phone: string
      }
    ) => {
      setIsLoading(true)
      setError(null)

      try {
        const token = getAccessToken()
        const response = await chatbotApi.bookTrip(
          {
            sessionId,
            tripId,
            seats,
            passengerInfo,
          },
          token || undefined
        )
        return response
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Unknown error')
        setError(error)
        throw error
      } finally {
        setIsLoading(false)
      }
    },
    []
  )

  return {
    sendMessage,
    getHistory,
    bookTrip,
    isLoading,
    error,
  }
}
