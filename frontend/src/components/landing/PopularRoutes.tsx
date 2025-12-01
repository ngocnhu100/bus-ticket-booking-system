import { useState, useEffect } from 'react'
import { RouteCard } from './RouteCard'

interface Route {
  route_id: string
  origin: string
  destination: string
  distance_km: number
  estimated_minutes: number
  starting_price: number
}

// Function to extract initials from city name
function getCode(cityName: string): string {
  return cityName
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase())
    .join('')
}

export function PopularRoutes() {
  const [routes, setRoutes] = useState<Route[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchPopularRoutes = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/routes')
      const data = await response.json()
      setRoutes(data)
    } catch (error) {
      console.error('Failed to fetch popular routes:', error)
      setError('Failed to load popular routes')

      // Fallback to static data with realistic pricing
      const fallbackRoutes: Route[] = [
        {
          route_id: '1',
          origin: 'Ho Chi Minh',
          destination: 'Ha Noi',
          distance_km: 1700,
          estimated_minutes: 1800,
          starting_price: 350000,
        },
        {
          route_id: '2',
          origin: 'Ho Chi Minh',
          destination: 'Da Nang',
          distance_km: 300,
          estimated_minutes: 360,
          starting_price: 180000,
        },
        {
          route_id: '3',
          origin: 'Ha Noi',
          destination: 'Hai Phong',
          distance_km: 100,
          estimated_minutes: 120,
          starting_price: 120000,
        },
        {
          route_id: '4',
          origin: 'Da Nang',
          destination: 'Hue',
          distance_km: 500,
          estimated_minutes: 600,
          starting_price: 150000,
        },
        {
          route_id: '5',
          origin: 'Ho Chi Minh',
          destination: 'Dak Lak',
          distance_km: 400,
          estimated_minutes: 480,
          starting_price: 200000,
        },
        {
          route_id: '6',
          origin: 'Ha Noi',
          destination: 'Hue',
          distance_km: 600,
          estimated_minutes: 720,
          starting_price: 280000,
        },
        {
          route_id: '7',
          origin: 'Phu Tho',
          destination: 'Bac Lieu',
          distance_km: 200,
          estimated_minutes: 240,
          starting_price: 160000,
        },
        {
          route_id: '8',
          origin: 'Ho Chi Minh',
          destination: 'Vinh Phuc',
          distance_km: 200,
          estimated_minutes: 240,
          starting_price: 220000,
        },
      ]
      setRoutes(fallbackRoutes)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPopularRoutes()

    // Set up periodic refresh every 5 minutes (300000ms)
    const interval = setInterval(() => {
      fetchPopularRoutes()
    }, 300000)

    return () => clearInterval(interval)
  }, [])

  if (loading) {
    return (
      <section id="popular-routes" className="py-16 md:py-24 bg-muted/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Popular Routes
            </h2>
            <p className="text-muted-foreground text-lg">
              Loading popular routes...
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="bg-background rounded-lg p-6 shadow-sm border animate-pulse"
              >
                <div className="h-4 bg-muted rounded mb-2"></div>
                <div className="h-6 bg-muted rounded mb-4"></div>
                <div className="h-8 bg-muted rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </section>
    )
  }

  if (error) {
    return (
      <section id="popular-routes" className="py-16 md:py-24 bg-muted/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Popular Routes
            </h2>
            <p className="text-muted-foreground text-lg">
              {error}. Showing default routes.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {routes.map((route) => (
              <RouteCard
                key={route.route_id}
                origin={route.origin}
                destination={route.destination}
                originCode={getCode(route.origin)}
                destinationCode={getCode(route.destination)}
                price={route.starting_price}
                onClick={() => {
                  // Trigger search with these parameters
                  const searchParams = new URLSearchParams({
                    origin: `${route.origin}`,
                    destination: `${route.destination}`,
                    date: new Date().toISOString().split('T')[0],
                    passengers: '1',
                  })
                  window.location.href = `/trip-search-results?${searchParams.toString()}`
                }}
              />
            ))}
          </div>
        </div>
      </section>
    )
  }

  return (
    <section id="popular-routes" className="py-16 md:py-24 bg-muted/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Popular Routes
          </h2>
          <p className="text-muted-foreground text-lg">
            Explore our most booked routes with competitive prices
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {routes.map((route) => (
            <RouteCard
              key={route.route_id}
              origin={route.origin}
              destination={route.destination}
              originCode={getCode(route.origin)}
              destinationCode={getCode(route.destination)}
              price={route.starting_price}
              onClick={() => {
                // Trigger search with these parameters
                const searchParams = new URLSearchParams({
                  origin: `${route.origin}`,
                  destination: `${route.destination}`,
                  date: new Date().toISOString().split('T')[0],
                  passengers: '1',
                })
                window.location.href = `/trip-search-results?${searchParams.toString()}`
              }}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
