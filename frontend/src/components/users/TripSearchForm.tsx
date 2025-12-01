import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { Search, MapPin, Calendar, Users } from 'lucide-react'

export const TripSearchForm = () => {
  const navigate = useNavigate()
  const [origin, setOrigin] = useState('')
  const [destination, setDestination] = useState('')
  const [date, setDate] = useState('')
  const [passengers, setPassengers] = useState(1)

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()

    if (!origin || !destination || !date) {
      return
    }

    const searchParams = new URLSearchParams({
      origin,
      destination,
      date,
      passengers: passengers.toString(),
    })

    navigate(`/trips/search?${searchParams.toString()}`)
  }

  // Get today's date in YYYY-MM-DD format for min attribute
  const today = new Date().toISOString().split('T')[0]

  return (
    <Card className="p-6">
      <form onSubmit={handleSearch} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Origin */}
          <div className="space-y-2">
            <Label htmlFor="origin" className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-blue-600" />
              From
            </Label>
            <Input
              id="origin"
              type="text"
              placeholder="e.g., Ho Chi Minh City"
              value={origin}
              onChange={(e) => setOrigin(e.target.value)}
              required
            />
          </div>

          {/* Destination */}
          <div className="space-y-2">
            <Label htmlFor="destination" className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-blue-600" />
              To
            </Label>
            <Input
              id="destination"
              type="text"
              placeholder="e.g., Hanoi"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              required
            />
          </div>

          {/* Date */}
          <div className="space-y-2">
            <Label htmlFor="date" className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-600" />
              Date
            </Label>
            <Input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              min={today}
              required
            />
          </div>

          {/* Passengers */}
          <div className="space-y-2">
            <Label htmlFor="passengers" className="flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-600" />
              Passengers
            </Label>
            <Input
              id="passengers"
              type="number"
              value={passengers}
              onChange={(e) => setPassengers(parseInt(e.target.value) || 1)}
              min={1}
              max={10}
              required
            />
          </div>
        </div>

        <Button
          type="submit"
          className="w-full bg-blue-500 hover:bg-blue-600 text-white gap-2"
          size="lg"
        >
          <Search className="w-5 h-5" />
          Search Trips
        </Button>
      </form>
    </Card>
  )
}
