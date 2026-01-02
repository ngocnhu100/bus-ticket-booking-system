import React, { useState, useEffect } from 'react'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import {
  Loader2,
  User,
  Phone,
  Mail,
  CreditCard,
  ClipboardList,
} from 'lucide-react'
import { chatbotApi } from '../../api/chatbot'
import { getAccessToken } from '../../api/auth'
import type { ChatMessage } from '../../types/chatbot.types'
import { useAuth } from '../../context/AuthContext'

interface PassengerField {
  name: string
  type: string
  label: string
  required: boolean
}

interface SeatInfo {
  seat_code: string
  price: number
}

interface PassengerInfoFormProps {
  data: {
    seats?: (string | SeatInfo)[]
    required_fields?: PassengerField[]
  }
  sessionId: string
  lang?: 'vi' | 'en'
  onFormSubmitted?: (response: ChatMessage) => void
}

interface PassengerData {
  seat_code: string
  full_name: string
  phone: string
  email: string
  id_number?: string
}

export const PassengerInfoForm: React.FC<PassengerInfoFormProps> = ({
  data,
  sessionId,
  lang = 'vi',
  onFormSubmitted,
}) => {
  const { seats = [], required_fields = [] } = data || {}
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()

  // Translations
  const translations = {
    vi: {
      title: 'Thông tin hành khách',
      passenger: 'Hành khách',
      seat: 'ghế',
      required: '*',
      submit: 'Xác nhận thông tin',
      submitting: 'Đang gửi...',
      noData: 'Không có thông tin ghế hoặc form. Vui lòng thử lại.',
      fillField: 'Vui lòng điền',
      forPassenger: 'cho hành khách',
      invalidPhone: 'Số điện thoại không hợp lệ',
      invalidEmail: 'Email không hợp lệ',
      invalidId: 'CMND/CCCD phải có 9-12 chữ số',
      noPassengerData: 'Không có thông tin hành khách để gửi.',
      submitError: 'Không thể gửi thông tin. Vui lòng thử lại.',
      generalError: 'Có lỗi xảy ra. Vui lòng thử lại.',
      preFilledInfo:
        'Thông tin của bạn đã được điền sẵn. Vui lòng kiểm tra và xác nhận.',
    },
    en: {
      title: 'Passenger Information',
      passenger: 'Passenger',
      seat: 'seat',
      required: '*',
      submit: 'Confirm Information',
      submitting: 'Sending...',
      noData: 'No seat or form information available. Please try again.',
      fillField: 'Please fill in',
      forPassenger: 'for passenger',
      invalidPhone: 'Invalid phone number',
      invalidEmail: 'Invalid email',
      invalidId: 'ID number must be 9-12 digits',
      noPassengerData: 'No passenger information to submit.',
      submitError: 'Unable to submit information. Please try again.',
      generalError: 'An error occurred. Please try again.',
      preFilledInfo:
        'Your information has been pre-filled. Please review and confirm.',
    },
  }

  const t = translations[lang]
  console.log('[PassengerInfoForm] Rendering with data:', {
    seats,
    required_fields,
    hasData: !!data,
  })

  // Helper to extract seat code from seat data
  const getSeatCode = (seat: string | SeatInfo): string => {
    return typeof seat === 'string' ? seat : seat.seat_code
  }

  // Initialize form data for each passenger
  const [passengers, setPassengers] = useState<PassengerData[]>(
    seats.map((seat, index) => ({
      seat_code: getSeatCode(seat),
      // Auto-fill first passenger with user info if logged in
      full_name: index === 0 && user ? user.fullName : '',
      phone: index === 0 && user ? user.phone || '' : '',
      email: index === 0 && user ? user.email : '',
      id_number: '',
    }))
  )
  const [isPreFilled, setIsPreFilled] = useState(false)

  // Show notification when user info is pre-filled
  useEffect(() => {
    if (user && passengers.length > 0 && passengers[0].full_name) {
      setIsPreFilled(true)
      // Auto-clear notification after 5 seconds
      const timer = setTimeout(() => setIsPreFilled(false), 5000)
      return () => clearTimeout(timer)
    }
  }, [user])

  // If no seats or fields, show error
  if (seats.length === 0 || required_fields.length === 0) {
    console.error('[PassengerInfoForm] Missing data:', {
      seats,
      required_fields,
    })
    return (
      <div className="bg-card rounded-lg border border-border p-4 my-2">
        <h3 className="text-lg font-semibold mb-4 text-card-foreground flex items-center gap-2">
          <ClipboardList className="h-5 w-5" />
          {t.title}
        </h3>
        <div className="bg-destructive/10 text-destructive text-sm p-3 rounded border border-destructive/20">
          {t.noData}
        </div>
      </div>
    )
  }

  const handleFieldChange = (
    index: number,
    fieldName: keyof PassengerData,
    value: string
  ) => {
    setPassengers((prev) => {
      const updated = [...prev]
      updated[index] = { ...updated[index], [fieldName]: value }
      return updated
    })
  }

  const validateForm = (): boolean => {
    // Check all required fields are filled
    for (let i = 0; i < passengers.length; i++) {
      const passenger = passengers[i]
      const seatCode = getSeatCode(seats[i])

      for (const field of required_fields) {
        if (field.required) {
          const value = passenger[field.name as keyof PassengerData]
          if (!value || value.toString().trim() === '') {
            setError(
              `${t.fillField} ${field.label} ${t.forPassenger} ${t.seat} ${seatCode}`
            )
            return false
          }
        }
      }

      // Validate phone format
      if (passenger.phone) {
        const phoneRegex = /^(\+84|84|0)[0-9]{9,10}$/
        if (!phoneRegex.test(passenger.phone)) {
          setError(`${t.invalidPhone} ${t.forPassenger} ${t.seat} ${seatCode}`)
          return false
        }
      }

      // Validate email format
      if (passenger.email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(passenger.email)) {
          setError(`${t.invalidEmail} ${t.forPassenger} ${t.seat} ${seatCode}`)
          return false
        }
      }

      // Validate ID number if provided
      if (passenger.id_number && passenger.id_number.trim() !== '') {
        const idRegex = /^[0-9]{9,12}$/
        if (!idRegex.test(passenger.id_number)) {
          setError(`${t.invalidId} ${t.forPassenger} ${t.seat} ${seatCode}`)
          return false
        }
      }
    }

    setError(null)
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    // Ensure we have passengers data
    if (passengers.length === 0) {
      setError(t.noPassengerData)
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const token = getAccessToken()

      // Clean up passenger data - remove empty id_number and ensure all required fields exist
      const cleanedPassengers = passengers
        .filter((p) => p.seat_code && p.full_name && p.phone && p.email) // Only include complete passengers
        .map((p) => ({
          seat_code: p.seat_code,
          full_name: p.full_name.trim(),
          phone: p.phone.trim(),
          email: p.email.trim(),
          ...(p.id_number && p.id_number.trim()
            ? { id_number: p.id_number.trim() }
            : {}),
        }))

      console.log('[PassengerInfoForm] Submitting passengers:', {
        count: cleanedPassengers.length,
        data: cleanedPassengers,
      })

      const response = await chatbotApi.submitPassengerInfo(
        {
          sessionId,
          passengers: cleanedPassengers,
        },
        token || undefined
      )

      if (response.success && response.data) {
        // Create a bot message from the response
        const botMsg: ChatMessage = {
          id: `msg_${Date.now()}_bot`,
          role: 'assistant',
          content: response.data.text,
          timestamp: Date.now(),
          suggestions: response.data.suggestions,
          actions: response.data.actions,
        }

        // Notify parent with the bot message to add to chat
        if (onFormSubmitted) {
          onFormSubmitted(botMsg)
        }
      } else {
        setError(t.submitError)
      }
    } catch (err) {
      console.error('[PassengerInfoForm] Submit error:', err)
      setError(err instanceof Error ? err.message : t.generalError)
    } finally {
      setIsSubmitting(false)
    }
  }

  const getFieldIcon = (fieldType: string) => {
    switch (fieldType) {
      case 'text':
        return <User className="h-4 w-4" />
      case 'tel':
        return <Phone className="h-4 w-4" />
      case 'email':
        return <Mail className="h-4 w-4" />
      default:
        return <CreditCard className="h-4 w-4" />
    }
  }

  return (
    <div className="bg-card rounded-lg border border-border p-4 my-2">
      <h3 className="text-lg font-semibold mb-4 text-card-foreground flex items-center gap-2">
        <ClipboardList className="h-5 w-5" />
        {t.title}
      </h3>

      {isPreFilled && (
        <div className="bg-primary/10 text-primary text-sm p-3 rounded border border-primary/20 mb-4">
          ✓ {t.preFilledInfo}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {passengers.map((passenger, index) => (
          <div
            key={index}
            className="border border-border rounded-lg p-4 bg-muted/30"
          >
            <h4 className="font-medium mb-3 text-foreground flex items-center gap-2">
              <span className="bg-primary text-primary-foreground w-6 h-6 rounded-full flex items-center justify-center text-sm">
                {index + 1}
              </span>
              {t.passenger} {t.seat} {getSeatCode(seats[index])}
            </h4>

            <div className="space-y-3">
              {required_fields.map((field) => (
                <div key={field.name} className="space-y-1">
                  <Label
                    htmlFor={`passenger-${index}-${field.name}`}
                    className="text-foreground font-medium"
                  >
                    {field.label}
                    {field.required && (
                      <span className="text-destructive ml-1">
                        {t.required}
                      </span>
                    )}
                  </Label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                      {getFieldIcon(field.type)}
                    </div>
                    <Input
                      id={`passenger-${index}-${field.name}`}
                      type={field.type}
                      placeholder={field.label}
                      value={passenger[field.name as keyof PassengerData] || ''}
                      onChange={(e) =>
                        handleFieldChange(
                          index,
                          field.name as keyof PassengerData,
                          e.target.value
                        )
                      }
                      required={field.required}
                      className="pl-10"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        {error && (
          <div className="bg-destructive/10 text-destructive text-sm p-3 rounded border border-destructive/20">
            {error}
          </div>
        )}

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {t.submitting}
            </>
          ) : (
            t.submit
          )}
        </Button>
      </form>
    </div>
  )
}
