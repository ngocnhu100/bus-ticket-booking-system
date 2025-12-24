import React, { useState, useRef, useEffect } from 'react'
import { SendHorizontal } from 'lucide-react'
import clsx from 'clsx'
import { Button } from '../ui/button'

interface ChatInputProps {
  onSendMessage: (message: string) => void
  isLoading: boolean
  placeholder?: string
}

export const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  isLoading,
  placeholder = 'Type your message...',
}) => {
  const [message, setMessage] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${Math.min(
        textareaRef.current.scrollHeight,
        120
      )}px`
    }
  }, [message])

  const handleSend = () => {
    const trimmedMessage = message.trim()
    if (trimmedMessage && !isLoading) {
      onSendMessage(trimmedMessage)
      setMessage('')
      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto'
      }
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="border-t border-border p-4 bg-background">
      <div className="flex gap-3">
        <textarea
          ref={textareaRef}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={isLoading}
          rows={1}
          className={clsx(
            'flex-1 bg-input border border-input rounded-lg px-3 py-2 text-sm',
            'focus:outline-none focus:ring-2 focus:ring-primary',
            'resize-none max-h-30 overflow-y-auto',
            'placeholder-muted-foreground',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            'transition-colors'
          )}
        />
        <Button
          onClick={handleSend}
          disabled={isLoading || !message.trim()}
          className={clsx(
            'shrink-0 w-10 h-10 rounded-lg flex items-center justify-center',
            'bg-primary text-primary-foreground hover:bg-primary/90',
            'transition-colors disabled:opacity-50 disabled:cursor-not-allowed',
            'focus:outline-none focus:ring-2 focus:ring-primary'
          )}
          aria-label="Send message"
          title="Send (Enter or Shift+Enter for new line)"
        >
          <SendHorizontal size={20} />
        </Button>
      </div>
      <p className="text-xs text-muted-foreground mt-2">
        Press Enter to send, Shift+Enter for new line
      </p>
    </div>
  )
}
