import React from 'react'
import clsx from 'clsx'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import type { ChatMessage, ChatAction } from '../../types/chatbot.types'
import { MessageCircle } from 'lucide-react'

interface MessageBubbleProps {
  message: ChatMessage
  onSuggestionClick?: (suggestion: string) => void
}

interface ChatActionRendererProps {
  action: ChatAction
  onSuggestionClick?: (suggestion: string) => void
}

const ChatActionRenderer: React.FC<ChatActionRendererProps> = ({
  action,
  onSuggestionClick,
}) => {
  // Log for debugging
  console.log('[ChatActionRenderer] Rendering action:', {
    type: action.type,
    dataType: typeof action.data,
    isArray: Array.isArray(action.data),
    data: action.data,
  })

  switch (action.type) {
    case 'search_results':
      console.log(
        '[ChatActionRenderer] Rendering TripSearchResults with data:',
        action.data
      )
      return (
        <TripSearchResults
          data={action.data}
          onSelectTrip={onSuggestionClick}
        />
      )
    case 'seat_selection':
      console.log(
        '[ChatActionRenderer] Rendering SeatSelection with data:',
        action.data
      )
      return (
        <SeatSelectionComponent
          data={action.data}
          onSeatsSelected={onSuggestionClick}
        />
      )
    case 'booking_confirmation':
      return <BookingConfirmation data={action.data} />
    case 'payment_link':
      return <PaymentLink data={action.data} />
    default:
      console.warn('[ChatActionRenderer] Unknown action type:', action.type)
      return null
  }
}

interface TripSearchResultsProps {
  data: unknown
  onSelectTrip?: (message: string) => void
}

interface TripData {
  tripId?: string
  trip_id?: string
  departureTime?: string
  departure_time?: string
  arrivalTime?: string
  arrival_time?: string
  price?: number
  base_price?: number
  availableSeats?: number
  available_seats?: number
  busType?: string
  bus_type?: string
  operator?: string
  operator_name?: string
}

const TripSearchResults: React.FC<TripSearchResultsProps> = ({
  data,
  onSelectTrip,
}) => {
  // Log raw data for debugging
  console.log('[TripSearchResults] Raw data received:', {
    data,
    type: typeof data,
    isArray: Array.isArray(data),
    length: Array.isArray(data) ? data.length : undefined,
    dataKeys:
      data && typeof data === 'object'
        ? Object.keys(data as Record<string, unknown>)
        : [],
  })

  // Handle various data formats
  let trips: TripData[] = []

  if (Array.isArray(data)) {
    trips = data as TripData[]
    console.log(
      '[TripSearchResults] Parsed as array, trips count:',
      trips.length
    )
  } else if (data && typeof data === 'object') {
    // Check if data is a single trip object that needs to be wrapped in an array
    if ('departureTime' in data || 'departure_time' in data) {
      trips = [data as TripData]
      console.log('[TripSearchResults] Parsed as single trip object')
    }
  }

  // Log for debugging
  if (trips.length === 0) {
    console.warn(
      '[TripSearchResults] No trips found or invalid data format:',
      data
    )
  } else {
    console.log('[TripSearchResults] Successfully parsed trips:', {
      count: trips.length,
      firstTrip: trips[0],
    })
  }

  if (trips.length === 0) {
    return <div className="text-sm text-muted-foreground">No trips found.</div>
  }

  return (
    <div className="space-y-2">
      <h4 className="text-sm font-semibold text-foreground">
        Available Trips:
      </h4>
      <div className="space-y-2 max-h-80 overflow-y-auto pr-2 w-full">
        {trips.map((trip, index) => {
          // Handle both camelCase and snake_case field names
          const tripId = trip.tripId || trip.trip_id || `trip_${index}`
          const departure = trip.departureTime || trip.departure_time || 'N/A'
          const arrival = trip.arrivalTime || trip.arrival_time || 'N/A'
          const tripPrice = trip.price || trip.base_price || 0
          const seats = trip.availableSeats || trip.available_seats || 0
          const busType = trip.busType || trip.bus_type || 'Standard'
          const operator =
            trip.operator || trip.operator_name || 'Unknown Operator'

          return (
            <div
              key={tripId}
              className="border border-primary/20 rounded-lg p-3 bg-card hover:bg-accent/50 hover:border-primary/50 transition-all cursor-pointer shadow-sm"
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <div className="font-semibold text-sm text-foreground">
                    {departure} → {arrival}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {operator} • {busType}
                  </div>
                </div>
                <div className="text-right ml-3">
                  <div className="font-bold text-base text-primary">
                    {typeof tripPrice === 'number'
                      ? `${tripPrice.toLocaleString('vi-VN')}₫`
                      : 'N/A'}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {typeof seats === 'number'
                      ? `${seats} seats`
                      : 'Check availability'}
                  </div>
                </div>
              </div>
              <button
                onClick={() => {
                  console.log('[TripSelection] User selected trip:', {
                    index,
                    tripId,
                  })
                  onSelectTrip?.(`Book trip #${index + 1}`)
                }}
                className="w-full px-3 py-2 bg-primary text-primary-foreground text-sm font-medium rounded hover:bg-primary/90 transition-colors active:scale-95"
              >
                Select Trip
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}

interface BookingConfirmationProps {
  data: unknown
}

const BookingConfirmation: React.FC<BookingConfirmationProps> = () => {
  return (
    <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
      <div className="text-sm text-green-800 dark:text-green-200">
        ✅ Booking confirmed! Check your email for details.
      </div>
    </div>
  )
}

interface PaymentLinkData {
  url: string
}

interface PaymentLinkProps {
  data: unknown
}

const PaymentLink: React.FC<PaymentLinkProps> = ({ data }) => {
  const paymentUrl = (data as Partial<PaymentLinkData>)?.url || ''
  return (
    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
      <div className="text-sm text-blue-800 dark:text-blue-200 mb-2">
        💳 Complete your payment to confirm booking:
      </div>
      {paymentUrl && (
        <a
          href={paymentUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors"
        >
          Pay Now
        </a>
      )}
    </div>
  )
}

interface SeatSelectionComponentProps {
  data: unknown
  onSeatsSelected?: (message: string) => void
}

interface SeatData {
  seat_code?: string
  seat_id?: string
  row?: number
  column?: number
  status?: string
}

interface SeatMapDataStructure {
  seats?: SeatData[]
  rows?: number
  columns?: number
}

const SeatSelectionComponent: React.FC<SeatSelectionComponentProps> = ({
  data,
  onSeatsSelected,
}) => {
  const [selectedSeats, setSelectedSeats] = React.useState<string[]>([])

  // Parse seat map data - handle both direct array and nested structure
  let seatMapData: SeatMapDataStructure = {}

  console.log('[SeatSelectionComponent] Parsing seat data:', {
    type: typeof data,
    isArray: Array.isArray(data),
    keys:
      data && typeof data === 'object'
        ? Object.keys(data as Record<string, unknown>)
        : [],
    data,
  })

  if (data) {
    if (Array.isArray(data)) {
      // If data is directly an array of seats
      console.log('[SeatSelectionComponent] Data is direct array of seats')
      seatMapData = { seats: data as SeatData[] }
    } else if (typeof data === 'object') {
      if ('seats' in data || 'rows' in data) {
        console.log('[SeatSelectionComponent] Data has seats or rows property')
        seatMapData = data as SeatMapDataStructure
      } else {
        const dataObj = data as Record<string, unknown>
        if (Array.isArray(dataObj.data)) {
          // If data has a 'data' property that's an array
          console.log(
            '[SeatSelectionComponent] Data has data property with array'
          )
          seatMapData = { seats: dataObj.data as SeatData[] }
        } else if (Array.isArray(dataObj.seats)) {
          // Handle case where data is wrapped in object with seats array
          console.log('[SeatSelectionComponent] Data has seats array property')
          seatMapData = { seats: dataObj.seats as SeatData[] }
        }
      }
    }
  }

  // Handle no data
  console.log('[SeatSelectionComponent] Parsed seat map data:', {
    hasSeats: !!seatMapData.seats,
    seatsLength: seatMapData.seats?.length || 0,
  })

  if (!seatMapData.seats || seatMapData.seats.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 text-center">
        <p className="text-xs text-gray-600 dark:text-gray-400">
          Loading seat information...
        </p>
      </div>
    )
  }

  const handleSeatSelect = (seat: SeatData, isSelected: boolean) => {
    const seatCode = seat.seat_code || seat.seat_id || ''
    if (seatCode) {
      if (isSelected) {
        setSelectedSeats([...selectedSeats, seatCode])
      } else {
        setSelectedSeats(selectedSeats.filter((s) => s !== seatCode))
      }
    }
  }

  const handleConfirmSeats = () => {
    if (selectedSeats.length > 0 && onSeatsSelected) {
      // Send seat selection back to chatbot
      const message = `I want to select seats: ${selectedSeats.join(', ')}`
      onSeatsSelected(message)
    }
  }

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 space-y-2 max-w-sm">
      <div className="text-xs font-semibold text-gray-900 dark:text-gray-100">
        Select seats:
      </div>
      {/* Compact seat grid */}
      <div className="max-h-48 overflow-y-auto bg-gray-50 dark:bg-gray-700 p-2 rounded">
        <div className="grid gap-1">
          {seatMapData.seats.map((seat) => {
            const seatCode = seat.seat_code || seat.seat_id || ''
            const isSelected = selectedSeats.includes(seatCode)
            const isBooked =
              seat.status === 'booked' || seat.status === 'locked'

            return (
              <button
                key={seatCode}
                onClick={() => handleSeatSelect(seat, !isSelected)}
                disabled={isBooked}
                className={`px-2 py-1 text-xs rounded font-medium transition-colors ${
                  isBooked
                    ? 'bg-gray-300 dark:bg-gray-600 text-gray-500 cursor-not-allowed'
                    : isSelected
                      ? 'bg-blue-600 text-white'
                      : 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-500 hover:border-blue-500'
                }`}
              >
                {seatCode}
              </button>
            )
          })}
        </div>
      </div>

      {selectedSeats.length > 0 && (
        <div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-gray-700 gap-2">
          <div className="text-xs text-gray-600 dark:text-gray-400">
            {selectedSeats.length} seat{selectedSeats.length !== 1 ? 's' : ''}
          </div>
          <button
            onClick={handleConfirmSeats}
            className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors whitespace-nowrap"
          >
            Confirm
          </button>
        </div>
      )}
    </div>
  )
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  onSuggestionClick,
}) => {
  const isBot = message.role === 'assistant'

  return (
    <div
      className={clsx('flex gap-3 mb-4', {
        'flex-row': isBot,
        'flex-row-reverse': !isBot,
      })}
    >
      {/* Avatar */}
      <div
        className={clsx(
          'shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold',
          {
            'bg-primary text-primary-foreground': isBot,
            'bg-secondary text-secondary-foreground': !isBot,
          }
        )}
      >
        {isBot ? 'AI' : 'You'}
      </div>

      {/* Message bubble */}
      <div
        className={clsx('px-4 py-2 rounded-lg text-sm flex flex-col', {
          'bg-primary text-primary-foreground rounded-bl-none': isBot,
          'bg-secondary text-secondary-foreground rounded-br-none': !isBot,
        })}
        style={{ maxWidth: 'calc(100vw - 120px)' }}
      >
        <div className="wrap-break-word leading-relaxed max-w-none">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
              ul: ({ children }) => (
                <ul className="list-disc list-inside mb-2 space-y-1">
                  {children}
                </ul>
              ),
              ol: ({ children }) => (
                <ol className="list-decimal list-inside mb-2 space-y-1">
                  {children}
                </ol>
              ),
              li: ({ children }) => (
                <li className="leading-relaxed">{children}</li>
              ),
              strong: ({ children }) => (
                <strong className="font-semibold">{children}</strong>
              ),
              em: ({ children }) => <em className="italic">{children}</em>,
              code: ({ children }) => (
                <code className="bg-black/10 dark:bg-white/10 px-1 py-0.5 rounded text-xs font-mono">
                  {children}
                </code>
              ),
              pre: ({ children }) => (
                <pre className="bg-black/10 dark:bg-white/10 p-2 rounded text-xs font-mono overflow-x-auto mb-2">
                  {children}
                </pre>
              ),
              blockquote: ({ children }) => (
                <blockquote className="border-l-2 border-current pl-3 italic opacity-80 mb-2">
                  {children}
                </blockquote>
              ),
              h1: ({ children }) => (
                <h1 className="text-lg font-bold mb-2">{children}</h1>
              ),
              h2: ({ children }) => (
                <h2 className="text-base font-bold mb-2">{children}</h2>
              ),
              h3: ({ children }) => (
                <h3 className="text-sm font-bold mb-1">{children}</h3>
              ),
              h4: ({ children }) => (
                <h4 className="text-sm font-semibold mb-1">{children}</h4>
              ),
              h5: ({ children }) => (
                <h5 className="text-sm font-semibold mb-1">{children}</h5>
              ),
              h6: ({ children }) => (
                <h6 className="text-sm font-semibold mb-1">{children}</h6>
              ),
            }}
          >
            {message.content}
          </ReactMarkdown>
        </div>
        {message.timestamp && (
          <span className="text-xs opacity-70 mt-1 block">
            {new Date(message.timestamp).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
        )}
        {message.actions && message.actions.length > 0 && (
          <div className="mt-3 space-y-2">
            {message.actions.map((action, index) => {
              console.log('[MessageBubble] Rendering action:', {
                index,
                action,
                messageId: message.id,
              })
              return (
                <ChatActionRenderer
                  key={index}
                  action={action}
                  onSuggestionClick={onSuggestionClick}
                />
              )
            })}
          </div>
        )}
        {message.suggestions &&
          message.suggestions.length > 0 &&
          onSuggestionClick && (
            <div className="mt-3 flex flex-wrap gap-2">
              {message.suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => onSuggestionClick(suggestion)}
                  className="px-3 py-1 text-xs bg-secondary text-secondary-foreground rounded-full hover:bg-secondary/80 transition-colors"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          )}
      </div>
    </div>
  )
}

interface MessageListProps {
  messages: ChatMessage[]
  isLoading: boolean
  containerRef?: React.RefObject<HTMLDivElement | null>
  onSuggestionClick?: (suggestion: string) => void
}

export const TypingIndicator: React.FC = () => {
  return (
    <div className="flex gap-3 mb-4">
      <div className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold bg-primary text-primary-foreground">
        AI
      </div>
      <div className="bg-primary text-primary-foreground px-4 py-2 rounded-lg rounded-bl-none flex gap-1">
        <span className="w-2 h-2 bg-primary-foreground rounded-full animate-bounce" />
        <span
          className="w-2 h-2 bg-primary-foreground rounded-full animate-bounce"
          style={{ animationDelay: '0.1s' }}
        />
        <span
          className="w-2 h-2 bg-primary-foreground rounded-full animate-bounce"
          style={{ animationDelay: '0.2s' }}
        />
      </div>
    </div>
  )
}

export const MessageList: React.FC<MessageListProps> = ({
  messages,
  isLoading,
  containerRef,
  onSuggestionClick,
}) => {
  return (
    <div
      ref={containerRef}
      className="flex-1 overflow-y-auto p-4 space-y-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent dark:scrollbar-thumb-gray-600"
    >
      {messages.length === 0 ? (
        <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground">
          <MessageCircle className="w-8 h-8 mb-4" />
          <h3 className="font-semibold mb-2">Start a conversation</h3>
          <p className="text-sm max-w-xs">
            Ask me about trips, bookings, or anything else. I'm here to help!
          </p>
        </div>
      ) : (
        <>
          {messages.map((message) => (
            <MessageBubble
              key={message.id}
              message={message}
              onSuggestionClick={onSuggestionClick}
            />
          ))}
          {isLoading && <TypingIndicator />}
        </>
      )}
    </div>
  )
}
