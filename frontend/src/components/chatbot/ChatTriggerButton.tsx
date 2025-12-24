import React from 'react'
import { MessageCircle, X } from 'lucide-react'
import clsx from 'clsx'

interface ChatTriggerButtonProps {
  onClick: () => void
  isOpen: boolean
  unreadCount?: number
}

export const ChatTriggerButton: React.FC<ChatTriggerButtonProps> = ({
  onClick,
  isOpen,
  unreadCount = 0,
}) => {
  return (
    <button
      onClick={onClick}
      className={clsx(
        'fixed bottom-6 right-6 z-40',
        'w-14 h-14 rounded-full shadow-lg',
        'flex items-center justify-center transition-all duration-300',
        'hover:scale-110 active:scale-95',
        'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
        'dark:focus:ring-offset-background',
        {
          'bg-primary text-primary-foreground hover:bg-primary/90': !isOpen,
          'bg-destructive text-destructive-foreground hover:bg-destructive/90':
            isOpen,
        }
      )}
      aria-label={isOpen ? 'Close chat' : 'Open chat'}
      title={isOpen ? 'Close chat' : 'Open chat'}
    >
      {isOpen ? (
        <X size={24} />
      ) : (
        <>
          <MessageCircle size={24} />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </>
      )}
    </button>
  )
}
