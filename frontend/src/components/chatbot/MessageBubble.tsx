import React from 'react'
import clsx from 'clsx'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import type { ChatMessage, ChatAction } from '../../types/chatbot.types'
import { MessageCircle } from 'lucide-react'
import { PassengerInfoForm } from './PassengerInfoForm'
import { MessageFeedback } from './MessageFeedback'

interface MessageBubbleProps {
  message: ChatMessage
  onSuggestionClick?: (suggestion: string) => void
  onMessageFromAction?: (message: ChatMessage) => void
  sessionId?: string
}

interface ChatActionRendererProps {
  action: ChatAction
  onSuggestionClick?: (suggestion: string) => void
  onMessageFromAction?: (message: ChatMessage) => void
  sessionId?: string
}

interface PassengerField {
  name: string
  type: string
  label: string
  required: boolean
}

const ChatActionRenderer: React.FC<ChatActionRendererProps> = ({
  action,
  onSuggestionClick,
  onMessageFromAction,
  sessionId,
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
    case 'passenger_info_form':
      console.log(
        '[ChatActionRenderer] Rendering PassengerInfoForm with action:',
        action
      )
      return (
        <PassengerInfoForm
          data={{
            seats: action.seats as (
              | string
              | { seat_code: string; price: number }
            )[],
            required_fields: action.required_fields as PassengerField[],
          }}
          sessionId={sessionId || ''}
          onFormSubmitted={onMessageFromAction}
        />
      )
    case 'booking_confirmation':
      return <BookingConfirmation data={action.data} />
    case 'payment_link':
      return <PaymentLink data={action.data} />
    case 'payment_method_selector':
      return <PaymentMethodSelector data={action.data} />
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
  date?: string
  departureDate?: string
  departure_date?: string
  schedule?: {
    departureTime?: string
    arrivalTime?: string
  }
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
          const departure =
            trip.schedule?.departureTime ||
            trip.departureTime ||
            trip.departure_time ||
            'N/A'
          const arrival =
            trip.schedule?.arrivalTime ||
            trip.arrivalTime ||
            trip.arrival_time ||
            'N/A'
          const tripDate =
            trip.date || trip.departureDate || trip.departure_date || 'N/A'
          const tripPrice = trip.price || trip.base_price || 0
          const seats = trip.availableSeats || trip.available_seats || 0
          const busType = trip.busType || trip.bus_type || 'Standard'
          const operator =
            trip.operator || trip.operator_name || 'Unknown Operator'

          // Format date for display
          const formattedDate =
            tripDate !== 'N/A'
              ? new Date(tripDate).toLocaleDateString('en-US', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                })
              : 'Date N/A'

          return (
            <div
              key={tripId}
              className="border border-primary/20 rounded-lg p-3 bg-card hover:bg-accent/50 hover:border-primary/50 transition-all cursor-pointer shadow-sm"
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <div className="text-xs text-muted-foreground font-medium mb-1">
                    {formattedDate}
                  </div>
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

interface PassengerData {
  full_name?: string
  fullName?: string
  seat_code?: string
  seatCode?: string
  phone?: string
}

interface PricingData {
  basePrice?: number
  base_price?: number
  subtotal?: number
  serviceFee?: number
  service_fee?: number
  total?: number
  currency?: string
}

interface TripDetailsData {
  origin?: string
  destination?: string
  departureTime?: string
  departure_time?: string
  arrivalTime?: string
  arrival_time?: string
  route?: {
    origin?: string
    destination?: string
  }
  schedule?: {
    departure_time?: string
    arrival_time?: string
  }
}

interface BookingData {
  bookingId?: string
  bookingReference?: string
  status?: string
  passengers?: PassengerData[]
  pricing?: PricingData
  tripDetails?: TripDetailsData
  booking?: {
    bookingId?: string
    bookingReference?: string
    passengers?: PassengerData[]
    pricing?: PricingData
    tripDetails?: TripDetailsData
  }
}

const BookingConfirmation: React.FC<BookingConfirmationProps> = ({ data }) => {
  // Handle nested booking structure - extract from booking.booking if exists
  const rawData = (data as Partial<BookingData>) || {}
  const booking = rawData.booking || rawData

  // Extract passengers with proper field mapping
  const passengers = (booking.passengers || []).map((p: PassengerData) => ({
    fullName: p.full_name || p.fullName || '',
    seatCode: p.seat_code || p.seatCode || '',
    phone: p.phone || '',
  }))

  // Extract and normalize pricing
  const pricingData = booking.pricing as Partial<PricingData> | undefined
  const pricing = {
    basePrice: pricingData?.base_price || pricingData?.basePrice || 0,
    serviceFee: pricingData?.service_fee || pricingData?.serviceFee || 0,
    total: pricingData?.total || 0,
    currency: pricingData?.currency || 'VND',
  }

  // Extract trip details with proper field mapping
  const tripData = booking.tripDetails as Partial<TripDetailsData> | undefined
  const tripDetails = {
    origin: tripData?.route?.origin || tripData?.origin || '',
    destination: tripData?.route?.destination || tripData?.destination || '',
    departureTime:
      tripData?.schedule?.departure_time ||
      tripData?.departure_time ||
      tripData?.departureTime ||
      '',
    arrivalTime:
      tripData?.schedule?.arrival_time ||
      tripData?.arrival_time ||
      tripData?.arrivalTime ||
      '',
  }

  return (
    <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 space-y-3">
      <div className="text-sm font-semibold text-green-800 dark:text-green-200">
        ✅ Booking Created!
      </div>

      {/* Booking Reference */}
      {booking.bookingReference && (
        <div className="bg-white dark:bg-gray-800 rounded p-2">
          <div className="text-xs text-gray-600 dark:text-gray-400">
            Booking Reference
          </div>
          <div className="text-sm font-mono font-bold text-green-700 dark:text-green-300">
            {booking.bookingReference}
          </div>
        </div>
      )}

      {/* Trip Details */}
      {tripDetails.origin && (
        <div className="bg-white dark:bg-gray-800 rounded p-2 text-xs space-y-1">
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">Trip:</span>
            <span className="font-semibold text-gray-800 dark:text-gray-200">
              {tripDetails.origin} → {tripDetails.destination}
            </span>
          </div>
          {tripDetails.departureTime && (
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">
                Departure:
              </span>
              <span className="text-gray-800 dark:text-gray-200">
                {new Date(tripDetails.departureTime).toLocaleString()}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Passengers */}
      {passengers && passengers.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded p-2 text-xs space-y-1">
          <div className="font-semibold text-gray-800 dark:text-gray-200 mb-1">
            Passengers ({passengers.length})
          </div>
          {passengers.map((passenger, idx) => (
            <div
              key={idx}
              className="flex justify-between text-gray-700 dark:text-gray-300"
            >
              <span>{passenger.fullName}</span>
              <span className="font-mono">Seat {passenger.seatCode}</span>
            </div>
          ))}
        </div>
      )}

      {/* Pricing */}
      {pricing && (
        <div className="bg-white dark:bg-gray-800 rounded p-2 text-xs space-y-1">
          {pricing.basePrice > 0 && (
            <div className="flex justify-between text-gray-700 dark:text-gray-300">
              <span>Base Price:</span>
              <span>{pricing.basePrice.toLocaleString()} VND</span>
            </div>
          )}
          {pricing.serviceFee > 0 && (
            <div className="flex justify-between text-gray-700 dark:text-gray-300">
              <span>Service Fee:</span>
              <span>+ {pricing.serviceFee.toLocaleString()} VND</span>
            </div>
          )}
          {pricing.total > 0 && (
            <div className="flex justify-between font-bold text-green-700 dark:text-green-300 border-t border-gray-300 dark:border-gray-600 pt-1">
              <span>Total:</span>
              <span>{pricing.total.toLocaleString()} VND</span>
            </div>
          )}
        </div>
      )}

      <div className="text-xs text-gray-600 dark:text-gray-400">
        Please complete payment to confirm your booking.
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

interface PaymentMethodData {
  bookingId: string
  bookingReference: string
  amount: number
  paymentMethods: Array<{
    id: string
    name: string
    icon: string
    available: boolean
  }>
}

interface PaymentMethodSelectorProps {
  data: unknown
}

const PaymentMethodSelector: React.FC<PaymentMethodSelectorProps> = ({
  data,
}) => {
  const paymentData = data as Partial<PaymentMethodData>
  const [isProcessing, setIsProcessing] = React.useState(false)
  const [selectedMethod, setSelectedMethod] = React.useState<string | null>(
    null
  )

  const handlePaymentSelect = async (methodId: string) => {
    if (!paymentData.bookingId) return

    setSelectedMethod(methodId)
    setIsProcessing(true)

    try {
      // Call payment API through API Gateway
      const API_BASE_URL =
        import.meta.env.VITE_API_URL || 'http://localhost:3000'

      // If amount is not provided or is 0, fetch it from booking
      let amount = paymentData.amount || 0
      if (amount === 0) {
        console.log('[PaymentMethodSelector] Amount is 0, fetching from booking...')
        const bookingResponse = await fetch(
          `${API_BASE_URL}/bookings/${paymentData.bookingId}/guest`,
          {
            method: 'GET',
          }
        )
        if (bookingResponse.ok) {
          const bookingData = await bookingResponse.json()
          amount = bookingData.data?.pricing?.total || bookingData.data?.total_price || 0
          console.log('[PaymentMethodSelector] Fetched amount from booking:', amount)
        }
      }

      console.log('[PaymentMethodSelector] Creating payment:', {
        bookingId: paymentData.bookingId,
        paymentMethod: methodId,
        amount: amount,
      })

      // Call payment API to create payment session
      const response = await fetch(`${API_BASE_URL}/payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bookingId: paymentData.bookingId,
          paymentMethod: methodId,
          amount: amount,
          description: `Thanh toán đặt vé ${paymentData.bookingReference}`,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to initiate payment')
      }

      const result = await response.json()

      console.log('[PaymentMethodSelector] Payment response:', result)

      // Redirect to payment provider URL
      if (result.paymentUrl) {
        window.location.href = result.paymentUrl
      } else if (result.payUrl) {
        // MoMo uses payUrl
        window.location.href = result.payUrl
      } else {
        console.error('No payment URL returned:', result)
        alert('Không thể tạo link thanh toán. Vui lòng thử lại.')
      }
    } catch (error) {
      console.error('Payment error:', error)
      alert(
        `Có lỗi xảy ra: ${error instanceof Error ? error.message : 'Vui lòng thử lại'}`
      )
    } finally {
      setIsProcessing(false)
      setSelectedMethod(null)
    }
  }

  return (
    <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg p-4">
      <div className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
        💳 Chọn phương thức thanh toán
      </div>
      <div className="grid grid-cols-2 gap-2">
        {paymentData.paymentMethods?.map((method) => (
          <button
            key={method.id}
            onClick={() => handlePaymentSelect(method.id)}
            disabled={!method.available || isProcessing}
            className={`
              flex flex-col items-center justify-center p-3 rounded-lg border-2 transition-all
              ${
                !method.available || isProcessing
                  ? 'bg-gray-100 dark:bg-slate-800 border-gray-200 dark:border-slate-700 opacity-50 cursor-not-allowed'
                  : 'bg-white dark:bg-slate-800 border-gray-300 dark:border-slate-600 hover:border-blue-500 dark:hover:border-blue-400 hover:shadow-md cursor-pointer'
              }
              ${selectedMethod === method.id ? 'border-blue-500 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/20' : ''}
            `}
          >
            <span className="text-2xl mb-1">{method.icon}</span>
            <span className="text-xs font-medium text-gray-900 dark:text-white">
              {method.name}
            </span>
            {selectedMethod === method.id && isProcessing && (
              <div className="mt-1">
                <div className="animate-spin h-3 w-3 border-2 border-blue-500 border-t-transparent rounded-full" />
              </div>
            )}
          </button>
        ))}
      </div>
      <div className="mt-3 text-xs text-gray-500 dark:text-gray-400 text-center">
        Số tiền: {paymentData.amount?.toLocaleString('vi-VN')}₫
      </div>
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

  // Organize seats by row for better layout - MUST be before early returns
  const seatsByRow = React.useMemo(() => {
    const rows = new Map<number, SeatData[]>()
    seatMapData.seats?.forEach((seat) => {
      const row = seat.row || 1
      if (!rows.has(row)) {
        rows.set(row, [])
      }
      rows.get(row)!.push(seat)
    })
    return Array.from(rows.entries()).sort(([a], [b]) => a - b)
  }, [seatMapData.seats])

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
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-2 space-y-2 w-full">
      <div className="text-xs font-semibold text-gray-900 dark:text-gray-100 flex items-center justify-between">
        <span>Select seats:</span>
        <div className="flex gap-2 text-xs font-normal">
          <div className="flex items-center gap-1">
            <div className="w-2.5 h-2.5 bg-green-500 rounded"></div>
            <span className="text-gray-600 dark:text-gray-400">Free</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2.5 h-2.5 bg-red-500 rounded"></div>
            <span className="text-gray-600 dark:text-gray-400">Booked</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2.5 h-2.5 bg-blue-500 rounded"></div>
            <span className="text-gray-600 dark:text-gray-400">Selected</span>
          </div>
        </div>
      </div>

      {/* Compact seat grid by row */}
      <div className="max-h-40 overflow-y-auto bg-gray-50 dark:bg-gray-700 p-2 rounded space-y-1">
        {seatsByRow.map(([rowNum, rowSeats]) => (
          <div key={rowNum} className="flex gap-1 flex-wrap">
            {rowSeats.map((seat) => {
              const seatCode = seat.seat_code || seat.seat_id || ''
              const isSelected = selectedSeats.includes(seatCode)
              const isBooked =
                seat.status === 'booked' ||
                seat.status === 'locked' ||
                seat.status === 'occupied'

              return (
                <button
                  key={seatCode}
                  onClick={() =>
                    !isBooked && handleSeatSelect(seat, !isSelected)
                  }
                  disabled={isBooked}
                  title={
                    isBooked
                      ? 'This seat is booked'
                      : `${seatCode} - ${isSelected ? 'Selected' : 'Available'}`
                  }
                  className={`w-7 h-7 text-xs rounded font-semibold transition-all border-2 flex items-center justify-center ${
                    isBooked
                      ? 'bg-red-500/30 border-red-500 text-red-700 dark:text-red-400 cursor-not-allowed opacity-60'
                      : isSelected
                        ? 'bg-blue-500 border-blue-600 text-white shadow-sm'
                        : 'bg-green-500 border-green-600 text-white hover:shadow-md hover:scale-105'
                  }`}
                >
                  {seatCode}
                </button>
              )
            })}
          </div>
        ))}
      </div>

      {selectedSeats.length > 0 && (
        <div className="flex items-center justify-between pt-1 border-t border-gray-200 dark:border-gray-700 gap-2">
          <div className="text-xs text-gray-600 dark:text-gray-400 font-medium">
            {selectedSeats.length} seat{selectedSeats.length !== 1 ? 's' : ''}{' '}
            selected
          </div>
          <button
            onClick={handleConfirmSeats}
            className="px-3 py-1 bg-blue-600 text-white text-xs rounded font-medium hover:bg-blue-700 transition-colors whitespace-nowrap active:scale-95"
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
  onMessageFromAction,
  sessionId,
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
                  onMessageFromAction={onMessageFromAction}
                  sessionId={sessionId}
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
        {/* Add feedback component for assistant messages */}
        {isBot && sessionId && (
          <MessageFeedback messageId={message.id} sessionId={sessionId} />
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
  onMessageFromAction?: (message: ChatMessage) => void
  sessionId?: string
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
  onMessageFromAction,
  sessionId,
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
              onMessageFromAction={onMessageFromAction}
              sessionId={sessionId}
            />
          ))}
          {isLoading && <TypingIndicator />}
        </>
      )}
    </div>
  )
}
