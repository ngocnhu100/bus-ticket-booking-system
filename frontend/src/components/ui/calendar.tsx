import React, { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

export interface CalendarEvent {
  id: string
  title: string
  date: Date
  description?: string
  color?: string
  metadata?: Record<string, unknown>
  // Trip-specific fields
  routeLabel?: string
  departureTime?: string
  arrivalTime?: string
  busLabel?: string
  status?: string
  basePrice?: number
}

export interface CalendarProps {
  events?: CalendarEvent[]
  onDateSelect?: (date: Date) => void
  onEventClick?: (event: CalendarEvent) => void
  className?: string
  showNavigation?: boolean
  showTodayButton?: boolean
  defaultView?: 'month' | 'week'
  onViewChange?: (view: 'month' | 'week') => void
}

export const Calendar: React.FC<CalendarProps> = ({
  events = [],
  onDateSelect,
  onEventClick,
  className = '',
  showNavigation = true,
  showTodayButton = true,
  defaultView = 'month',
  onViewChange,
}) => {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [view, setView] = useState<'month' | 'week'>(defaultView)

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  // Group events by date
  const eventsByDate = events.reduce(
    (acc, event) => {
      const dateKey = event.date.toDateString()
      if (!acc[dateKey]) acc[dateKey] = []
      acc[dateKey].push(event)
      return acc
    },
    {} as Record<string, CalendarEvent[]>
  )

  const isToday = (date: Date) => {
    const today = new Date()
    return date.toDateString() === today.toDateString()
  }

  const isCurrentMonth = (date: Date) => date.getMonth() === month

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate((prev) => {
      const newDate = new Date(prev)
      if (direction === 'prev') {
        newDate.setMonth(newDate.getMonth() - 1)
      } else {
        newDate.setMonth(newDate.getMonth() + 1)
      }
      return newDate
    })
  }

  const navigateWeek = (direction: 'prev' | 'next') => {
    setCurrentDate((prev) => {
      const newDate = new Date(prev)
      if (direction === 'prev') {
        newDate.setDate(newDate.getDate() - 7)
      } else {
        newDate.setDate(newDate.getDate() + 7)
      }
      return newDate
    })
  }

  const goToToday = () => setCurrentDate(new Date())

  const handleViewChange = (newView: 'month' | 'week') => {
    setView(newView)
    onViewChange?.(newView)
  }

  const navigate = (direction: 'prev' | 'next') => {
    if (view === 'month') {
      navigateMonth(direction)
    } else {
      navigateWeek(direction)
    }
  }

  const getHeaderTitle = () => {
    if (view === 'month') {
      return currentDate.toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric',
      })
    } else {
      const startOfWeek = new Date(currentDate)
      startOfWeek.setDate(currentDate.getDate() - currentDate.getDay())
      const endOfWeek = new Date(startOfWeek)
      endOfWeek.setDate(startOfWeek.getDate() + 6)

      const startMonth = startOfWeek.toLocaleDateString('en-US', {
        month: 'short',
      })
      const endMonth = endOfWeek.toLocaleDateString('en-US', {
        month: 'short',
      })
      const year = startOfWeek.getFullYear()

      if (startMonth === endMonth) {
        return `${startMonth} ${startOfWeek.getDate()} - ${endOfWeek.getDate()}, ${year}`
      } else {
        return `${startMonth} ${startOfWeek.getDate()} - ${endMonth} ${endOfWeek.getDate()}, ${year}`
      }
    }
  }

  // Generate calendar days for monthly view
  const generateMonthlyCalendar = () => {
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const startDate = new Date(firstDay)
    startDate.setDate(startDate.getDate() - firstDay.getDay())

    const endDate = new Date(lastDay)
    endDate.setDate(endDate.getDate() + (6 - lastDay.getDay()))

    const calendarDays = []
    const current = new Date(startDate)

    while (current <= endDate) {
      calendarDays.push(new Date(current))
      current.setDate(current.getDate() + 1)
    }

    return calendarDays
  }

  // Generate calendar days for weekly view
  const generateWeeklyCalendar = () => {
    const startOfWeek = new Date(currentDate)
    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay())

    const calendarDays = []
    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek)
      day.setDate(startOfWeek.getDate() + i)
      calendarDays.push(day)
    }

    return calendarDays
  }

  const calendarDays =
    view === 'month' ? generateMonthlyCalendar() : generateWeeklyCalendar()

  return (
    <Card className={`p-4 ${className}`}>
      {/* Header */}
      {showNavigation && (
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('prev')}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <h2 className="text-lg font-semibold">{getHeaderTitle()}</h2>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('next')}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex rounded-md border">
              <Button
                variant={view === 'month' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => handleViewChange('month')}
                className="rounded-r-none"
              >
                Month
              </Button>
              <Button
                variant={view === 'week' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => handleViewChange('week')}
                className="rounded-l-none"
              >
                Week
              </Button>
            </div>

            {showTodayButton && (
              <Button variant="outline" size="sm" onClick={goToToday}>
                Today
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Days of Week Header */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
          <div
            key={day}
            className="p-2 text-center text-sm font-medium text-muted-foreground"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((date, index) => {
          const dateKey = date.toDateString()
          const dayEvents = eventsByDate[dateKey] || []

          return (
            <div
              key={index}
              className={`
                min-h-24 border rounded-lg p-1 cursor-pointer transition-colors hover:bg-muted/50
                ${isCurrentMonth(date) ? 'bg-background' : 'bg-muted/30 text-muted-foreground'}
                ${isToday(date) ? 'ring-2 ring-primary ring-offset-1 bg-primary/5' : ''}
              `}
              onClick={() => onDateSelect?.(date)}
            >
              <div className="text-sm font-medium mb-1 text-center">
                {date.getDate()}
              </div>

              <div className="space-y-1">
                {dayEvents.slice(0, view === 'week' ? 3 : 2).map((event) => (
                  <div
                    key={event.id}
                    className={`text-xs rounded px-1 py-1 cursor-pointer hover:opacity-80 transition-opacity border bg-slate-50 border-slate-200 ${
                      event.color || 'bg-primary/10 text-primary'
                    }`}
                    onClick={(e) => {
                      e.stopPropagation()
                      onEventClick?.(event)
                    }}
                    title={`${event.routeLabel || event.title} - ${event.departureTime} → ${event.arrivalTime} - ${event.busLabel} - ${event.basePrice ? event.basePrice.toLocaleString('vi-VN') + ' đ' : ''} - ${event.status}`}
                  >
                    <div className="font-medium text-slate-900 text-[11px]">
                      {event.routeLabel || event.title}
                    </div>
                    <div className="text-slate-700 text-[10px]">
                      {event.departureTime} → {event.arrivalTime}
                    </div>
                    <div className="text-slate-500 text-[10px]">
                      {event.busLabel}
                    </div>
                    {event.basePrice && (
                      <div className="text-slate-600 text-[10px] font-medium">
                        {event.basePrice.toLocaleString('vi-VN')} đ
                      </div>
                    )}
                    {event.status && (
                      <div className="flex items-center justify-end mt-1">
                        <span
                          className={`rounded-full px-1.5 py-0.5 text-[9px] font-semibold ${
                            event.status === 'ACTIVE'
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {event.status === 'ACTIVE' ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    )}
                  </div>
                ))}

                {dayEvents.length > (view === 'week' ? 3 : 2) && (
                  <div className="text-xs text-muted-foreground text-center">
                    +{dayEvents.length - (view === 'week' ? 3 : 2)} more
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </Card>
  )
}

export default Calendar
