import { useContext } from 'react'
import { ChatbotContext } from '../context/ChatbotContextValue'
import type { ChatbotContextType } from '../context/ChatbotContext'

function useChatbot(): ChatbotContextType {
  const context = useContext(ChatbotContext)
  if (!context) {
    throw new Error('useChatbot must be used within ChatbotProvider')
  }
  return context
}

export { useChatbot }
