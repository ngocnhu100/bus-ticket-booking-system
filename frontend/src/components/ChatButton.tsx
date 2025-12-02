import { MessageCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

const ChatButton = () => {
  return (
    <Button
      size="icon"
      className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg hover:scale-110 transition-transform z-50"
      onClick={() => alert('AI Chat feature coming soon!')}
    >
      <MessageCircle className="h-6 w-6" />
    </Button>
  )
}

export default ChatButton
