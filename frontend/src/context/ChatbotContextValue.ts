import { createContext } from 'react'
import type { ChatbotContextType } from './ChatbotContext'

export const ChatbotContext = createContext<ChatbotContextType | undefined>(
  undefined
)
