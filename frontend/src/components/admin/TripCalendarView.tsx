import React, { useState } from 'react'
import { type TripData } from '@/types/adminTripTypes'
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react'

interface TripCalendarViewProps {
  trips: TripData[]
  onEditTrip?: (trip: TripData) => void
}

export const TripCalendarView: React.FC<TripCalendarViewProps> = ({
  trips,
  onEditTrip,
}) => {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [calendarView, setCalendarView] = useState<'MONTH' | 'WEEK'>('MONTH')

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  // Group trips by date
  const tripsByDate = trips.reduce(
    (acc, trip) => {
      // Handle cases where departure_time might be undefined or null
      if (!trip.schedule?.departure_time) {
        console.warn('Trip missing departure_time:', trip.trip_id)
        return acc
      }

      const dateKey = trip.schedule.departure_time.split('T')[0]
      if (!acc[dateKey]) acc[dateKey] = []
      acc[dateKey].push(trip)
      return acc
    },
    {} as Record<string, TripData[]>
  )

  const formatDateKey = (date: Date) => date.toISOString().slice(0, 10)

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
    calendarView === 'MONTH'
      ? generateMonthlyCalendar()
      : generateWeeklyCalendar()

  const navigate = (direction: 'prev' | 'next') => {
    if (calendarView === 'MONTH') {
      navigateMonth(direction)
    } else {
      navigateWeek(direction)
    }
  }

  const getHeaderTitle = () => {
    if (calendarView === 'MONTH') {
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
      const endMonth = endOfWeek.toLocaleDateString('en-US', { month: 'short' })
      const year = startOfWeek.getFullYear()

      if (startMonth === endMonth) {
        return `${startMonth} ${startOfWeek.getDate()} - ${endOfWeek.getDate()}, ${year}`
      } else {
        return `${startMonth} ${startOfWeek.getDate()} - ${endMonth} ${endOfWeek.getDate()}, ${year}`
      }
    }
  }

  return (
    <div className="space-y-4 w-full">
      {/* Calendar Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('prev')}
            className="rounded-lg p-2 transition-colors"
            style={{
              border: '1px solid var(--border)',
              backgroundColor: 'transparent',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--muted)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent'
            }}
          >
            <ChevronLeft
              className="w-4 h-4"
              style={{ color: 'var(--foreground)' }}
            />
          </button>
          <h2
            className="text-lg font-semibold"
            style={{ color: 'var(--foreground)' }}
          >
            {getHeaderTitle()}
          </h2>
          <button
            onClick={() => navigate('next')}
            className="rounded-lg p-2 transition-colors"
            style={{
              border: '1px solid var(--border)',
              backgroundColor: 'transparent',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--muted)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent'
            }}
          >
            <ChevronRight
              className="w-4 h-4"
              style={{ color: 'var(--foreground)' }}
            />
          </button>
        </div>
        <div className="flex items-center gap-2">
          <div
            className="flex rounded-lg p-1"
            style={{ border: '1px solid var(--border)' }}
          >
            <button
              onClick={() => setCalendarView('MONTH')}
              className="px-3 py-1 text-sm rounded-md transition-colors"
              style={{
                backgroundColor:
                  calendarView === 'MONTH' ? 'var(--primary)' : 'transparent',
                color:
                  calendarView === 'MONTH'
                    ? 'var(--primary-foreground)'
                    : 'var(--muted-foreground)',
              }}
            >
              Month
            </button>
            <button
              onClick={() => setCalendarView('WEEK')}
              className="px-3 py-1 text-sm rounded-md transition-colors"
              style={{
                backgroundColor:
                  calendarView === 'WEEK' ? 'var(--primary)' : 'transparent',
                color:
                  calendarView === 'WEEK'
                    ? 'var(--primary-foreground)'
                    : 'var(--muted-foreground)',
              }}
            >
              Week
            </button>
          </div>
          <button
            onClick={goToToday}
            className="rounded-lg px-3 py-1 text-sm font-medium transition-colors"
            style={{
              backgroundColor: 'var(--primary)',
              color: 'var(--primary-foreground)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor =
                'color-mix(in srgb, var(--primary) 90%, black)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--primary)'
            }}
          >
            Today
          </button>
        </div>
      </div>

      {/* Days of Week Header */}
      <div className="grid grid-cols-7 gap-2 w-full p-1">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
          <div
            key={day}
            className="p-2 text-center text-sm font-medium"
            style={{ color: 'var(--muted-foreground)' }}
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-2 w-full p-1">
        {calendarDays.map((date, index) => {
          const dateKey = formatDateKey(date)
          const dayTrips = tripsByDate[dateKey] || []

          return (
            <div
              key={index}
              className={`${
                calendarView === 'MONTH' ? 'min-h-[140px]' : 'min-h-40'
              } border rounded-lg p-2 flex flex-col relative`}
              style={{
                border: '1px solid var(--border)',
                backgroundColor: isCurrentMonth(date)
                  ? isToday(date)
                    ? 'color-mix(in srgb, var(--primary) 5%, var(--card))'
                    : 'var(--card)'
                  : 'color-mix(in srgb, var(--muted) 30%, var(--card))',
                color: isCurrentMonth(date)
                  ? 'var(--foreground)'
                  : 'var(--muted-foreground)',
              }}
            >
              <div className="text-sm font-medium mb-2 shrink-0 flex items-center gap-1">
                <span
                  className={
                    isToday(date)
                      ? 'rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold'
                      : ''
                  }
                  style={
                    isToday(date)
                      ? {
                          backgroundColor: 'var(--primary)',
                          color: 'var(--primary-foreground)',
                        }
                      : undefined
                  }
                >
                  {date.getDate()}
                </span>
                {calendarView === 'MONTH' && !isCurrentMonth(date) && (
                  <span
                    className="text-xs"
                    style={{ color: 'var(--muted-foreground)' }}
                  >
                    {date.toLocaleDateString('en-US', { month: 'short' })}
                  </span>
                )}
              </div>
              <div className="space-y-1 flex-1 overflow-y-auto">
                {dayTrips
                  .slice(0, calendarView === 'WEEK' ? 6 : 4)
                  .map((trip) => (
                    <div
                      key={trip.trip_id}
                      className="text-xs rounded px-2 py-1.5 transition-colors cursor-pointer space-y-1"
                      style={{
                        backgroundColor: 'var(--card)',
                        border: '1px solid var(--border)',
                      }}
                      onClick={() => {
                        onEditTrip?.(trip)
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor =
                          'color-mix(in srgb, var(--muted) 50%, var(--card))'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'var(--card)'
                      }}
                    >
                      {/* Route */}
                      <div
                        className="font-medium leading-tight"
                        style={{ color: 'var(--foreground)' }}
                      >
                        <div className="truncate">
                          {trip.route?.origin || 'Unknown'}
                        </div>
                        <div
                          className="text-[10px] flex items-center gap-1"
                          style={{ color: 'var(--muted-foreground)' }}
                        >
                          <ArrowRight className="w-3 h-3" />{' '}
                          {trip.route?.destination || 'Unknown'}
                        </div>
                      </div>
                      {/* Times */}
                      <div
                        className="text-[10px] flex items-center gap-1"
                        style={{ color: 'var(--muted-foreground)' }}
                      >
                        <span
                          className="font-medium"
                          style={{ color: 'var(--foreground)' }}
                        >
                          {trip.schedule?.departure_time
                            ?.split('T')[1]
                            ?.slice(0, 5) || 'N/A'}
                        </span>
                        <ArrowRight className="w-3 h-3" />
                        <span>
                          {trip.schedule?.arrival_time
                            ?.split('T')[1]
                            ?.slice(0, 5) || 'N/A'}
                        </span>
                      </div>
                      {/* Bus */}
                      <div
                        className="text-[10px] truncate"
                        style={{ color: 'var(--muted-foreground)' }}
                      >
                        {trip.bus?.model || 'Unknown Bus'}
                      </div>
                      {/* Price and Status */}
                      <div className="text-[10px] flex items-center justify-between gap-1">
                        <span
                          className="font-medium"
                          style={{ color: 'var(--foreground)' }}
                        >
                          {(trip.pricing?.base_price || 0).toLocaleString(
                            'vi-VN'
                          )}{' '}
                          VND
                        </span>
                        <span
                          className="px-1.5 py-0.5 rounded-full text-[9px] font-medium"
                          style={
                            trip.status === 'in_progress'
                              ? {
                                  backgroundColor:
                                    'color-mix(in srgb, var(--success) 30%, var(--card))',
                                  color: 'var(--primary)',
                                }
                              : {
                                  backgroundColor: 'var(--muted)',
                                  color: 'var(--muted-foreground)',
                                }
                          }
                        >
                          {trip.status === 'in_progress'
                            ? 'In Progress'
                            : trip.status}
                        </span>
                      </div>
                    </div>
                  ))}
                {dayTrips.length > (calendarView === 'WEEK' ? 6 : 4) && (
                  <div
                    className="text-xs text-center py-1"
                    style={{ color: 'var(--muted-foreground)' }}
                  >
                    +{dayTrips.length - (calendarView === 'WEEK' ? 6 : 4)} more
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
