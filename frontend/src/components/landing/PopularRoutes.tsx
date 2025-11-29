import { useState, useEffect } from 'react'
import { RouteCard } from './RouteCard'

interface Route {
  id: string
  from: string
  to: string
  fromCode: string
  toCode: string
  price: number
}

export function PopularRoutes() {
  const [routes, setRoutes] = useState<Route[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchPopularRoutes = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/routes/popular')
      const data = await response.json()
      setRoutes(data)
    } catch (error) {
      console.error('Failed to fetch popular routes:', error)
      setError('Failed to load popular routes')

      // Fallback to static data with realistic pricing
      const fallbackRoutes: Route[] = [
        {
          id: '1',
          from: 'Ho Chi Minh City',
          to: 'Hanoi',
          fromCode: 'HCM',
          toCode: 'HN',
          price: 350000,
        },
        {
          id: '2',
          from: 'Ho Chi Minh City',
          to: 'Da Lat',
          fromCode: 'HCM',
          toCode: 'DL',
          price: 180000,
        },
        {
          id: '3',
          from: 'Hanoi',
          to: 'Hai Phong',
          fromCode: 'HN',
          toCode: 'HP',
          price: 120000,
        },
        {
          id: '4',
          from: 'Da Nang',
          to: 'Nha Trang',
          fromCode: 'DN',
          toCode: 'NT',
          price: 150000,
        },
      ]
      setRoutes(fallbackRoutes)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {routes.map((route) => (
              <RouteCard
                key={route.id}
                from={route.from}
                to={route.to}
                fromCode={route.fromCode}
                toCode={route.toCode}
                price={route.price}
                onClick={() => {
                  // Trigger search with these parameters
                  const searchParams = new URLSearchParams({
                    from: `${route.from} (${route.fromCode})`,
                    to: `${route.to} (${route.toCode})`,
                    date: new Date().toISOString().split('T')[0],
                    passengers: '1',
                  })
                  window.location.href = `/search-results?${searchParams.toString()}`
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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {routes.map((route) => (
            <RouteCard
              key={route.id}
              from={route.from}
              to={route.to}
              fromCode={route.fromCode}
              toCode={route.toCode}
              price={route.price}
              onClick={() => {
                // Trigger search with these parameters
                const searchParams = new URLSearchParams({
                  from: `${route.from} (${route.fromCode})`,
                  to: `${route.to} (${route.toCode})`,
                  date: new Date().toISOString().split('T')[0],
                  passengers: '1',
                })
                window.location.href = `/search-results?${searchParams.toString()}`
              }}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
