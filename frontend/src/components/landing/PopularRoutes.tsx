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

  useEffect(() => {
    const fetchPopularRoutes = async () => {
      try {
        setLoading(true)
        setError(null)

        // Fetch từ API backend /popular-routes (default 10, hoặc ?limit=8 để 8 results)
        const response = await fetch(
          'http://localhost:3000/trips/popular-routes?limit=8'
        )
        if (!response.ok) {
          throw new Error('Failed to fetch')
        }
        const result = await response.json()
        if (result.success) {
          setRoutes(result.data)
        } else {
          throw new Error(result.error?.message || 'API error')
        }
      } catch (err) {
        console.error('Failed to fetch popular routes:', err)
        setError('Failed to load popular routes. Showing default routes.')

        // Fallback to static data with realistic pricing and cities from cities.json
        const fallbackRoutes: Route[] = [
          {
            route_id: '1',
            origin: 'Ho Chi Minh',
            destination: 'Ha Noi',
            distance_km: 1700,
            estimated_minutes: 1980,
            starting_price: 800000,
          },
          {
            route_id: '2',
            origin: 'Ho Chi Minh',
            destination: 'Da Nang',
            distance_km: 950,
            estimated_minutes: 1140,
            starting_price: 500000,
          },
          {
            route_id: '3',
            origin: 'Ha Noi',
            destination: 'Hai Phong',
            distance_km: 100,
            estimated_minutes: 120,
            starting_price: 150000,
          },
          {
            route_id: '4',
            origin: 'Da Nang',
            destination: 'Hue',
            distance_km: 100,
            estimated_minutes: 120,
            starting_price: 100000,
          },
          {
            route_id: '5',
            origin: 'Ho Chi Minh',
            destination: 'Dak Lak',
            distance_km: 350,
            estimated_minutes: 480,
            starting_price: 300000,
          },
          {
            route_id: '6',
            origin: 'Ha Noi',
            destination: 'Hue',
            distance_km: 700,
            estimated_minutes: 840,
            starting_price: 450000,
          },
          {
            route_id: '7',
            origin: 'Phu Tho',
            destination: 'Bac Ninh',
            distance_km: 150,
            estimated_minutes: 180,
            starting_price: 120000,
          },
          {
            route_id: '8',
            origin: 'Ho Chi Minh',
            destination: 'Vinh Long',
            distance_km: 150,
            estimated_minutes: 180,
            starting_price: 100000,
          },
          {
            route_id: '9',
            origin: 'Can Tho',
            destination: 'Ca Mau',
            distance_km: 200,
            estimated_minutes: 240,
            starting_price: 150000,
          },
          {
            route_id: '10',
            origin: 'Dong Nai',
            destination: 'Lam Dong',
            distance_km: 250,
            estimated_minutes: 300,
            starting_price: 200000,
          },
        ]
        setRoutes(fallbackRoutes)
      } finally {
        setLoading(false)
      }
    }

    fetchPopularRoutes()
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
