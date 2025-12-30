import React, { useState, useCallback, useEffect } from 'react'
import { ChatWindow } from './ChatWindow'
import { ChatTriggerButton } from './ChatTriggerButton'
import { useChatbot } from '../../hooks/useChatbot'
import { chatbotApi } from '../../api/chatbot'
import type { ChatMessage } from '../../types/chatbot.types'
import type { ChatbotQueryRequest } from '../../api/chatbot'
import { getAccessToken } from '../../api/auth'

interface ChatbotWidgetProps {
  title?: string
  welcomeMessage?: string
}

export const ChatbotWidget: React.FC<ChatbotWidgetProps> = ({
  title = 'Chat Assistant',
  welcomeMessage = "Hi! 👋 I'm your chat assistant. I can help you search for trips, complete bookings, and answer questions about our service. What can I help you with today?",
}) => {
  const {
    sessionId,
    messages,
    isLoading,
    error,
    isOpen,
    isSessionValid,
    addMessage,
    setIsLoading,
    setError,
    setIsOpen,
    setSessionId,
    toggleChat,
    clearMessages,
  } = useChatbot()

  const [isMinimized, setIsMinimized] = useState(false)
  const [hasShownWelcome, setHasShownWelcome] = useState(false)

  // Show welcome message on first open (only if no messages exist)
  useEffect(() => {
    if (isOpen && !hasShownWelcome && messages.length === 0) {
      const welcomeMsg: ChatMessage = {
        id: `msg_${Date.now()}`,
        role: 'assistant',
        content: welcomeMessage,
        timestamp: Date.now(),
      }
      addMessage(welcomeMsg)
      setHasShownWelcome(true)
    }
  }, [isOpen, hasShownWelcome, messages.length, welcomeMessage, addMessage])

  // Reset minimized state when opening chat
  useEffect(() => {
    if (isOpen) {
      setIsMinimized(false)
    }
  }, [isOpen])

  const handleSendMessage = useCallback(
    async (userMessage: string) => {
      if (!userMessage.trim()) return

      // Add user message to chat
      const userMsg: ChatMessage = {
        id: `msg_${Date.now()}`,
        role: 'user',
        content: userMessage,
        timestamp: Date.now(),
      }
      addMessage(userMsg)

      // Clear any previous errors
      setError(null)

      // Start loading
      setIsLoading(true)

      try {
        const token = getAccessToken()

        // Call chatbot API
        const request: ChatbotQueryRequest = {
          message: userMessage,
          context: {
            previousMessages: messages.map((m) => ({
              role: m.role,
              content: m.content,
            })),
          },
        }
        if (sessionId && isSessionValid) {
          request.sessionId = sessionId
        }

        const response = await chatbotApi.sendMessage(
          request,
          token || undefined
        )

        if (response.success && response.data.response) {
          // Update sessionId if returned by backend
          if (response.data.sessionId && !sessionId) {
            setSessionId(response.data.sessionId)
          }

          const botMsg: ChatMessage = {
            id: response.data.messageId || `msg_${Date.now()}_bot`,
            role: 'assistant',
            content:
              typeof response.data.response.text === 'string'
                ? response.data.response.text
                : 'I apologize, but I encountered an error processing your request.',
            timestamp: Date.now(),
            intent: response.data.response.intent,
            entities: response.data.response.entities,
            suggestions: response.data.response.suggestions,
            actions: response.data.response.actions,
          }

          // Log for debugging
          if (
            response.data.response.actions &&
            response.data.response.actions.length > 0
          ) {
            console.log('[ChatbotWidget] Message has actions:', {
              actionCount: response.data.response.actions.length,
              actions: response.data.response.actions,
            })
          }

          addMessage(botMsg)
        } else {
          setError('Failed to get response from chatbot')
        }
      } catch (err) {
        // If session not found, try again without sessionId
        if (
          err instanceof Error &&
          err.message.includes('Session not found') &&
          sessionId
        ) {
          console.warn('Session not found, retrying without sessionId')

          const retryRequest: ChatbotQueryRequest = {
            message: userMessage,
            context: {
              previousMessages: messages.map((m) => ({
                role: m.role,
                content: m.content,
              })),
            },
            // Don't include sessionId for retry
          }

          try {
            const token = getAccessToken()
            const retryResponse = await chatbotApi.sendMessage(
              retryRequest,
              token || undefined
            )

            if (retryResponse.success && retryResponse.data.response) {
              // Update sessionId with the new one from backend
              if (retryResponse.data.sessionId) {
                setSessionId(retryResponse.data.sessionId)
              }

              const botMsg: ChatMessage = {
                id: `msg_${Date.now()}_bot`,
                role: 'assistant',
                content: retryResponse.data.response.text,
                timestamp: Date.now(),
                intent: retryResponse.data.response.intent,
                entities: retryResponse.data.response.entities,
                suggestions: retryResponse.data.response.suggestions,
                actions: retryResponse.data.response.actions,
              }

              // Log for debugging
              if (
                retryResponse.data.response.actions &&
                retryResponse.data.response.actions.length > 0
              ) {
                console.log('[ChatbotWidget] Retry message has actions:', {
                  actionCount: retryResponse.data.response.actions.length,
                  actions: retryResponse.data.response.actions,
                })
              }

              addMessage(botMsg)
              return // Success, exit
            }
          } catch (retryErr) {
            console.error('Retry also failed:', retryErr)
          }
        }

        const errorMessage =
          err instanceof Error ? err.message : 'An error occurred'
        setError(errorMessage)
        console.error('Chatbot error:', err)
      } finally {
        setIsLoading(false)
      }
    },
    [
      sessionId,
      messages,
      addMessage,
      setIsLoading,
      setError,
      setSessionId,
      isSessionValid,
    ]
  )

  const handleNewSession = useCallback(async () => {
    try {
      // Reset session on backend if we have a valid session
      if (sessionId && isSessionValid) {
        const token = getAccessToken()
        await chatbotApi.resetSession(sessionId, token || undefined)
      }
    } catch (error) {
      console.warn('Failed to reset session on backend:', error)
      // Continue with frontend reset even if backend call fails
    }

    // Clear messages
    clearMessages()
    // Reset session
    setSessionId(null)
    setError(null)
    // Reset welcome message flag to show it again
    setHasShownWelcome(false)
    // Add welcome message
    const welcomeMsg: ChatMessage = {
      id: `msg_${Date.now()}`,
      role: 'assistant',
      content: welcomeMessage,
      timestamp: Date.now(),
    }
    addMessage(welcomeMsg)
    setHasShownWelcome(true)
  }, [
    sessionId,
    isSessionValid,
    clearMessages,
    setSessionId,
    setError,
    setHasShownWelcome,
    welcomeMessage,
    addMessage,
  ])

  const handleMessageFromAction = useCallback(
    (message: ChatMessage) => {
      // Add the message from an action (like form submission) to the chat
      addMessage(message)
    },
    [addMessage]
  )

  return (
    <>
      {/* Trigger Button */}
      <ChatTriggerButton onClick={toggleChat} isOpen={isOpen} unreadCount={0} />

      {/* Chat Window */}
      {isOpen && (
        <ChatWindow
          title={title}
          messages={messages}
          onSendMessage={handleSendMessage}
          onMessageFromAction={handleMessageFromAction}
          onClose={() => setIsOpen(false)}
          onMinimize={() => setIsMinimized(!isMinimized)}
          onNewSession={handleNewSession}
          isLoading={isLoading}
          isMinimized={isMinimized}
          error={error}
          sessionId={sessionId || undefined}
        />
      )}
    </>
  )
}

export default ChatbotWidget
