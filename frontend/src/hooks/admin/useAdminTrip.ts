import { useState } from 'react'
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

  const createTrip = async (tripData: Partial<Trip>) => {
    setLoading(true)
    setError(null)
    try {
      const response = await request('/trips', {
        method: 'POST',
        token: getAccessToken(),
        body: tripData,
      })
      // Assuming the response has the created trip
      setTrips((prev) => [...prev, response.data])
      return response.data
    } catch (err) {
      setError('Failed to create trip')
      console.error('Failed to create trip:', err)
      throw err
    } finally {
      setLoading(false)
    }
  }

  const updateTrip = async (tripId: string, tripData: Partial<Trip>) => {
    setLoading(true)
    setError(null)
    try {
      const response = await request(`/trips/${tripId}`, {
        method: 'PUT',
        token: getAccessToken(),
        body: tripData,
      })
      // Update the trip in state
      setTrips((prev) =>
        prev.map((trip) =>
          trip.trip_id === tripId ? { ...trip, ...response.data } : trip
        )
      )
      return response.data
    } catch (err) {
      setError('Failed to update trip')
      console.error('Failed to update trip:', err)
      throw err
    } finally {
      setLoading(false)
    }
  }

  const deleteTrip = async (tripId: string) => {
    setLoading(true)
    setError(null)
    try {
      await request(`/trips/${tripId}`, {
        method: 'DELETE',
        token: getAccessToken(),
      })
      // Remove the trip from state
      setTrips((prev) => prev.filter((trip) => trip.trip_id !== tripId))
    } catch (err) {
      setError('Failed to delete trip')
      console.error('Failed to delete trip:', err)
      throw err
    } finally {
      setLoading(false)
    }
  }

  return {
    trips,
    setTrips,
    buses,
    routes,
    loading,
    error,
    refetch: fetchData,
    createTrip,
    updateTrip,
    deleteTrip,
  }
}
