import { useState, useEffect } from 'react'
import { request, getAccessToken } from '../../api/auth'
import type { Trip, RouteAdminData, BusAdminData } from '../../types/trip.types'

export const useAdminTripData = (
  initialTrips: Trip[],
  initialBuses: BusAdminData[],
  initialRoutes: RouteAdminData[]
) => {
  const [trips, setTrips] = useState<Trip[]>(initialTrips)
  const [buses, setBuses] = useState<BusAdminData[]>(initialBuses)
  const [routes, setRoutes] = useState<RouteAdminData[]>(initialRoutes)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchData = async () => {
    setLoading(true)
    setError(null)

    try {
      const [tripsData, busesData, routesData] = await Promise.all([
        request('/search', { method: 'GET', token: getAccessToken() }),
        request('/buses', { method: 'GET', token: getAccessToken() }),
        request('/routes', { method: 'GET', token: getAccessToken() }),
      ])

      setTrips(tripsData.data)
      setBuses(busesData.data)
      setRoutes(routesData.data)
    } catch (err) {
      setError('Failed to fetch data')
      console.error('Failed to fetch admin trip data:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  return {
    trips,
    setTrips,
    buses,
    routes,
    loading,
    error,
    refetch: fetchData,
  }
}
