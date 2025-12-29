import React, { useEffect, useRef, useState } from 'react'
import { X, Minimize2, Maximize2, Plus } from 'lucide-react'
import clsx from 'clsx'
import { MessageList } from './MessageBubble'
import { ChatInput } from './ChatInput'
import type { ChatMessage } from '../../types/chatbot.types'

interface ChatWindowProps {
  title?: string
  messages: ChatMessage[]
  onSendMessage: (message: string) => void
  onMessageFromAction?: (message: ChatMessage) => void
  onClose: () => void
  onMinimize?: () => void
  onNewSession?: () => void
  isLoading: boolean
  isMinimized?: boolean
  error?: string | null
  sessionId?: string
}

export const ChatWindow: React.FC<ChatWindowProps> = ({
  title = 'Chat Assistant',
  messages,
  onSendMessage,
  onMessageFromAction,
  onClose,
  onMinimize,
  onNewSession,
  isLoading,
  isMinimized = false,
  error,
  sessionId,
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [isResizing, setIsResizing] = useState(false)
  const [resizeSide, setResizeSide] = useState<'left' | 'top' | null>(null)
  const [dimensions, setDimensions] = useState({ width: 520, height: 480 }) // Default: wider for trip selection

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  // Handle resize start
  const handleResizeStart = (e: React.MouseEvent) => {
    // Prevent resize if clicking on interactive elements
    if (
      e.target instanceof HTMLTextAreaElement ||
      e.target instanceof HTMLButtonElement ||
      (e.target as HTMLElement).closest('textarea, button')
    ) {
      return
    }

    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return
    const { left, top } = rect
    const mouseX = e.clientX
    const mouseY = e.clientY
    const edgeThreshold = 10

    // Only start resize if mouse is near edges and no text is selected
    const hasSelection = (window.getSelection()?.toString()?.length ?? 0) > 0
    const isNearEdge =
      (mouseX >= left && mouseX <= left + edgeThreshold) ||
      (mouseY >= top && mouseY <= top + edgeThreshold)

    if (!isNearEdge || hasSelection) {
      return
    }

    e.preventDefault()
    if (mouseX >= left && mouseX <= left + edgeThreshold) {
      setResizeSide('left')
      setIsResizing(true)
    } else if (mouseY >= top && mouseY <= top + edgeThreshold) {
      setResizeSide('top')
      setIsResizing(true)
    }
  }

  // Handle resize move
  useEffect(() => {
    const handleResizeMove = (e: MouseEvent) => {
      if (!isResizing || !resizeSide) return
      if (resizeSide === 'left') {
        const newWidth = Math.max(
          400, // Increased min width for trip selection
          Math.min(800, window.innerWidth - e.clientX - 24)
        )
        setDimensions((prev) => ({ ...prev, width: newWidth }))
        document.body.style.cursor = 'ew-resize'
      } else if (resizeSide === 'top') {
        const newHeight = Math.max(
          300, // Increased min height for seat selection
          Math.min(800, window.innerHeight - e.clientY)
        )
        setDimensions((prev) => ({ ...prev, height: newHeight }))
        document.body.style.cursor = 'ns-resize'
      }
    }

    const handleResizeEnd = () => {
      setIsResizing(false)
      setResizeSide(null)
      document.body.style.cursor = ''
    }

    if (isResizing) {
      document.addEventListener('mousemove', handleResizeMove)
      document.addEventListener('mouseup', handleResizeEnd)
      document.body.style.cursor = 'nw-resize'
      document.body.style.userSelect = 'none'
    }

    return () => {
      document.removeEventListener('mousemove', handleResizeMove)
      document.removeEventListener('mouseup', handleResizeEnd)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
  }, [isResizing, resizeSide])

  // Handle mouse move for cursor
  const handleMouseMove = (e: React.MouseEvent) => {
    if (isResizing) return
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return
    const { left, top } = rect
    const mouseX = e.clientX
    const mouseY = e.clientY
    const edgeThreshold = 10
    if (mouseX >= left && mouseX <= left + edgeThreshold) {
      document.body.style.cursor = 'ew-resize'
    } else if (mouseY >= top && mouseY <= top + edgeThreshold) {
      document.body.style.cursor = 'ns-resize'
    } else {
      document.body.style.cursor = ''
    }
  }

  return (
    <div
      ref={containerRef}
      className={clsx(
        'fixed bottom-0 right-24 z-50 flex flex-col',
        'bg-background border border-border rounded-t-lg shadow-lg',
        'max-w-[calc(100vw-2rem)] transition-all duration-300',
        {
          'h-14': isMinimized,
        }
      )}
      style={{
        width: isMinimized ? '344px' : `${dimensions.width}px`,
        height: isMinimized ? '56px' : `${dimensions.height}px`,
      }}
      onMouseDown={!isMinimized ? handleResizeStart : undefined}
      onMouseMove={!isMinimized ? handleMouseMove : undefined}
      onMouseLeave={() => {
        if (!isResizing) document.body.style.cursor = ''
      }}
    >
      {/* Header */}
      <div className="bg-primary text-primary-foreground px-4 py-3 rounded-t-lg flex items-center justify-between shrink-0">
        <div className="flex-1">
          {!isMinimized && (
            <div>
              <h3 className="font-semibold text-base">{title}</h3>
              <p className="text-xs opacity-90">Always here to help</p>
            </div>
          )}
          {isMinimized && <h3 className="font-semibold text-sm">{title}</h3>}
        </div>

        <div className="flex gap-2">
          {onNewSession && (
            <button
              onClick={onNewSession}
              className={clsx(
                'p-1.5 hover:bg-primary/80 rounded transition-colors',
                'focus:outline-none focus:ring-2 focus:ring-primary-foreground'
              )}
              aria-label="Start new session"
              title="Start new session"
            >
              <Plus size={18} />
            </button>
          )}
          {onMinimize && (
            <button
              onClick={onMinimize}
              className={clsx(
                'p-1.5 hover:bg-primary/80 rounded transition-colors',
                'focus:outline-none focus:ring-2 focus:ring-primary-foreground'
              )}
              aria-label={isMinimized ? 'Maximize' : 'Minimize'}
              title={isMinimized ? 'Maximize' : 'Minimize'}
            >
              {isMinimized ? <Maximize2 size={18} /> : <Minimize2 size={18} />}
            </button>
          )}

          <button
            onClick={onClose}
            className={clsx(
              'p-1.5 hover:bg-primary/80 rounded transition-colors',
              'focus:outline-none focus:ring-2 focus:ring-primary-foreground'
            )}
            aria-label="Close chat"
            title="Close chat"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Message List */}
      {!isMinimized && (
        <>
          {error && (
            <div className="bg-destructive/10 text-destructive text-sm px-4 py-2 border-b border-destructive/20">
              {error}
            </div>
          )}

          <MessageList
            messages={messages}
            isLoading={isLoading}
            containerRef={containerRef}
            onSuggestionClick={onSendMessage}
            onMessageFromAction={onMessageFromAction}
            sessionId={sessionId}
          />

          {/* Auto-scroll anchor */}
          <div ref={messagesEndRef} />

          {/* Input Area */}
          <ChatInput onSendMessage={onSendMessage} isLoading={isLoading} />
        </>
      )}
    </div>
  )
}
