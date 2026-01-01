import { useState, useEffect } from 'react'
import { request } from '../api/auth'

interface TopRoute {
  route: string
  bookings: number
  revenue: string
  rawRevenue: number
}

interface TrendData {
  day: string
  bookings: number
}

interface RecentBooking {
  id: string
  routeName: string
  passengers: number
  price: string
  rawPrice: number
  status: string
  createdAt: string
}

interface UpcomingTrip {
  trip_id: string
  route: string
  origin: string
  destination: string
  departure_time: string
  arrival_time: string
  bus_type: string
  operator_name: string
  base_price: number
  available_seats: number
  total_seats: number
  status: string
}

interface TrendItem {
  period: string
  totalBookings: number
}

interface RouteItem {
  revenue: number
  route?: string
  origin?: string
  destination?: string
  totalBookings: number
}

interface BookingItem {
  booking_id: string
  booking_reference?: string
  trip?: {
    route?: {
      origin: string
      destination: string
    }
  }
  origin?: string
  destination?: string
  passengers?: unknown[]
  total_price?: number
  status?: string
  created_at?: string
}

interface TripItem {
  trip_id: string
  departure_time?: string
  arrival_time?: string
  base_price?: number
  available_seats?: number
  total_seats?: number
  status: string
  bus_type?: string
  origin?: string
  destination?: string
  route?: {
    origin?: string
    destination?: string
  }
  bus?: {
    bus_type?: string
  }
  operator?: {
    name?: string
  }
  operator_name?: string
  schedule?: {
    departure_time?: string
    arrival_time?: string
  }
  pricing?: {
    base_price?: number
  }
  availability?: {
    available_seats?: number
    total_seats?: number
  }
}

export function useAdminDashboard() {
  const [dashboardData, setDashboardData] = useState({
    totalBookings: 0,
    activeUsers: 0,
    revenueLast30Days: 0,
    revenueToday: 0,
  })
  const [bookingsTrend, setBookingsTrend] = useState<TrendData[]>([])
  const [topRoutesData, setTopRoutesData] = useState<TopRoute[]>([])
  const [recentBookings, setRecentBookings] = useState<RecentBooking[]>([])
  const [upcomingTrips, setUpcomingTrips] = useState<UpcomingTrip[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true)
        setError(null)

        // Date ranges
        const today = new Date()

        // For summary: last 30 days
        const thirtyDaysAgo = new Date(today)
        thirtyDaysAgo.setDate(today.getDate() - 30)

        // For trend: last 7 days
        const sevenDaysAgo = new Date(today)
        sevenDaysAgo.setDate(today.getDate() - 7)

        // For top routes & recent bookings: all-time data (use very old date)
        const allTimeDate = new Date('2020-01-01')

        const formatDate = (date: Date) => date.toISOString().split('T')[0]

        const fromDate30 = formatDate(thirtyDaysAgo)
        const fromDate7 = formatDate(sevenDaysAgo)
        const fromDateAllTime = formatDate(allTimeDate)
        const toDate = formatDate(today)

        // Fetch dashboard summary (last 30 days)
        const dashboardResult = await request(
          `/analytics/dashboard?fromDate=${fromDate30}&toDate=${toDate}`,
          { method: 'GET' }
        )

        if (dashboardResult.success) {
          setDashboardData((prev) => ({
            ...prev,
            totalBookings: dashboardResult.data.bookings?.total || 0,
            activeUsers: dashboardResult.data.activeUsers || 0,
            revenueLast30Days: dashboardResult.data.revenue?.total || 0,
          }))
        }

        // Fetch today's revenue
        const todayRevenueResult = await request(
          `/analytics/dashboard?fromDate=${toDate}&toDate=${toDate}`,
          { method: 'GET' }
        )

        if (todayRevenueResult.success) {
          setDashboardData((prev) => ({
            ...prev,
            revenueToday: todayRevenueResult.data.revenue?.total || 0,
          }))
        }

        // Fetch bookings trend (last 7 days only for the trend chart)
        const trendResult = await request(
          `/analytics/bookings?fromDate=${fromDate7}&toDate=${toDate}&groupBy=day`,
          { method: 'GET' }
        )

        console.log('Trend result:', trendResult)

        if (trendResult.success && trendResult.data.trends) {
          const trendData = trendResult.data.trends.map((item: TrendItem) => ({
            day: new Date(item.period).toLocaleDateString('en-US', {
              weekday: 'short',
            }),
            bookings: item.totalBookings || 0,
          }))
          setBookingsTrend(trendData)
        }

        // Fetch top routes and recent bookings (all-time data to show whenever bookings exist)
        const allTimeResult = await request(
          `/analytics/bookings?fromDate=${fromDateAllTime}&toDate=${toDate}&groupBy=month`,
          { method: 'GET' }
        )

        console.log('All-time bookings result:', allTimeResult)

        if (allTimeResult.success && allTimeResult.data.topRoutes) {
          console.log('Top routes data:', allTimeResult.data.topRoutes)
          const topRoutes = allTimeResult.data.topRoutes
            .slice(0, 4)
            .map((route: RouteItem) => {
              const rawRevenue = route.revenue || 0
              return {
                route: route.route || `${route.origin} → ${route.destination}`,
                bookings: route.totalBookings || 0,
                revenue: `${(rawRevenue / 1000000).toFixed(1)}M`,
                rawRevenue: rawRevenue,
              }
            })
          setTopRoutesData(topRoutes)
        } else {
          console.log('No top routes found in all-time data')
        }

        // Fetch recent bookings from the booking admin endpoint
        try {
          const recentBookingsResult = await request(
            '/bookings/admin?limit=5&sortBy=created_at&sortOrder=DESC',
            {
              method: 'GET',
            }
          )

          console.log('Recent bookings result:', recentBookingsResult)

          if (
            recentBookingsResult.success &&
            Array.isArray(recentBookingsResult.data)
          ) {
            // Log the first booking to see the structure
            if (recentBookingsResult.data.length > 0) {
              const firstBooking = recentBookingsResult.data[0]
              console.log('First booking structure:', firstBooking)
              console.log('Booking keys:', Object.keys(firstBooking))
              console.log(
                'Full first booking data:',
                JSON.stringify(firstBooking, null, 2)
              )
            }

            const bookings = recentBookingsResult.data
              .slice(0, 5)
              .map((booking: BookingItem) => {
                console.log('Processing booking:', booking.booking_id, {
                  hasTrip: !!booking.trip,
                  tripKeys: booking.trip ? Object.keys(booking.trip) : [],
                  hasRoute: !!booking.trip?.route,
                  origin: booking.trip?.route?.origin,
                  destination: booking.trip?.route?.destination,
                  passengers: booking.passengers?.length,
                  totalPrice: booking.total_price,
                })

                const route = booking.trip?.route
                const origin = route?.origin || booking.origin || 'Unknown'
                const destination =
                  route?.destination || booking.destination || 'Unknown'
                const passengerCount = booking.passengers?.length || 0
                const totalPrice = booking.total_price || 0

                return {
                  id: booking.booking_id || booking.booking_reference,
                  routeName: `${origin} → ${destination}`,
                  passengers: passengerCount,
                  price: `${(totalPrice / 1000000).toFixed(1)}M`,
                  rawPrice: totalPrice,
                  status: booking.status,
                  createdAt: booking.created_at,
                }
              })
            console.log('Mapped recent bookings:', bookings)
            setRecentBookings(bookings)
          } else {
            console.warn('Recent bookings response:', recentBookingsResult)
          }
        } catch (recentErr) {
          console.warn('Could not fetch recent bookings:', recentErr)
          // Don't fail the whole dashboard if recent bookings fail
        }

        // Fetch upcoming trips (scheduled trips with departure_time in the future)
        try {
          const upcomingTripsResult = await request(
            '/trips?status=scheduled&sort_by=departure_time&sort_order=asc&limit=10',
            {
              method: 'GET',
            }
          )

          console.log('Upcoming trips result:', upcomingTripsResult)

          if (
            upcomingTripsResult.success &&
            upcomingTripsResult.data?.trips &&
            Array.isArray(upcomingTripsResult.data.trips)
          ) {
            console.log(
              'Raw trips data:',
              upcomingTripsResult.data.trips.slice(0, 2)
            )

            const trips = upcomingTripsResult.data.trips
              .filter((trip: TripItem) => {
                // Filter only trips with future departure times
                const departureTimeStr =
                  trip.departure_time || trip.schedule?.departure_time
                if (!departureTimeStr) return false

                const departureTime = new Date(departureTimeStr)
                const now = new Date()
                console.log(
                  `Trip ${trip.trip_id}: departure=${departureTime.toISOString()}, now=${now.toISOString()}, isFuture=${departureTime > now}`
                )
                return departureTime > now
              })
              .slice(0, 10)
              .map((trip: TripItem) => ({
                trip_id: trip.trip_id,
                route: `${trip.route?.origin || trip.origin || 'Unknown'} → ${trip.route?.destination || trip.destination || 'Unknown'}`,
                origin: trip.route?.origin || trip.origin || 'Unknown',
                destination:
                  trip.route?.destination || trip.destination || 'Unknown',
                departure_time:
                  trip.departure_time || trip.schedule?.departure_time,
                arrival_time: trip.arrival_time || trip.schedule?.arrival_time,
                bus_type: trip.bus?.bus_type || trip.bus_type || 'Standard',
                operator_name:
                  trip.operator?.name || trip.operator_name || 'N/A',
                base_price: trip.base_price || trip.pricing?.base_price || 0,
                available_seats:
                  trip.available_seats ||
                  trip.availability?.available_seats ||
                  0,
                total_seats:
                  trip.total_seats || trip.availability?.total_seats || 0,
                status: trip.status || 'scheduled',
              }))
            console.log('Mapped upcoming trips:', trips)
            setUpcomingTrips(trips)
          } else {
            console.warn('Upcoming trips response:', upcomingTripsResult)
          }
        } catch (upcomingErr) {
          console.warn('Could not fetch upcoming trips:', upcomingErr)
          // Don't fail the whole dashboard if upcoming trips fail
        }
      } catch (err) {
        console.error('Error fetching dashboard data:', err)
        if (err instanceof Error) {
          console.error('Error message:', err.message)
          console.error('Error stack:', err.stack)
        }
        setError('Failed to load dashboard data')
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [])

  return {
    dashboardData,
    bookingsTrend,
    topRoutesData,
    recentBookings,
    upcomingTrips,
    loading,
    error,
  }
}
