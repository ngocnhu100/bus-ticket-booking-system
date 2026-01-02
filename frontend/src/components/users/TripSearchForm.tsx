import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { LocationAutocomplete } from '@/components/ui/location-autocomplete'
import { AlertCircle, Calendar, ArrowLeftRight, Users } from 'lucide-react'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import '@/styles/datepicker.css'
import { format } from 'date-fns'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface SearchFormData {
  from: string
  to: string
  date: Date | null
  passengers: number | string
}

export const TripSearchForm = () => {
  const navigate = useNavigate()
  const [formData, setFormData] = useState<SearchFormData>({
    from: '',
    to: '',
    date: null,
    passengers: 1,
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(false)

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.from) newErrors.from = 'Please select a departure city'
    if (!formData.to) newErrors.to = 'Please select a destination city'
    if (!formData.date) newErrors.date = 'Please select a date'
    if (formData.from === formData.to && formData.from)
      newErrors.from = 'Departure and destination must be different'

    if (formData.date) {
      const selectedDate = new Date(formData.date)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      if (selectedDate < today) {
        newErrors.date = 'Date must be today or later'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    const passengerCount =
      typeof formData.passengers === 'string'
        ? parseInt(formData.passengers) || 1
        : formData.passengers

    setIsLoading(true)

    const searchParams = new URLSearchParams({
      origin: formData.from,
      destination: formData.to,
      date: formData.date ? format(formData.date, 'yyyy-MM-dd') : '',
      passengers: passengerCount.toString(),
    })

    navigate(`/trip-search-results?${searchParams.toString()}`)
    setIsLoading(false)
  }

  return (
    <Card className="shadow-lg border">
      <CardContent className="p-6 md:p-8">
        <form onSubmit={handleSearch} className="space-y-6">
          {/* From/Date and To/Passengers in 2 columns */}
          <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-4">
            {/* Left Column: From and Date */}
            <div className="space-y-4">
              {/* From */}
              <div className="space-y-2">
                <Label htmlFor="from" className="text-base font-medium">
                  From
                </Label>
                <LocationAutocomplete
                  value={formData.from}
                  onValueChange={(value) => {
                    setFormData({ ...formData, from: value })
                    setErrors({ ...errors, from: '' })
                  }}
                  placeholder="Search departure city or bus station (e.g., ha noi, central station)"
                  type="origin"
                />
                {errors.from && (
                  <div className="flex items-center gap-2 text-sm text-destructive">
                    <AlertCircle className="w-4 h-4" />
                    {errors.from}
                  </div>
                )}
              </div>

              {/* Date */}
              <div className="space-y-2">
                <Label htmlFor="date" className="text-base font-medium">
                  Date
                </Label>
                <div className="relative">
                  <div
                    id="datepicker-portal"
                    className="absolute top-full left-0 z-50 mt-2"
                  ></div>
                  <DatePicker
                    selected={formData.date}
                    onChange={(date) => {
                      setFormData({ ...formData, date })
                      setErrors({ ...errors, date: '' })
                    }}
                    minDate={new Date()}
                    dateFormat="EEEE, MMMM d, yyyy"
                    placeholderText="Select departure date"
                    className="w-full h-12 px-3 py-2 pr-10 text-base bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50"
                    wrapperClassName="w-full"
                    calendarClassName="!bg-card !border !border-border !rounded-md !shadow-xl !w-80"
                    dayClassName={(date) => {
                      const today = new Date()
                      today.setHours(0, 0, 0, 0)
                      const isToday = date.getTime() === today.getTime()
                      const isSelected =
                        formData.date &&
                        date.getTime() === formData.date.getTime()

                      let classes =
                        'cursor-pointer hover:bg-muted hover:text-foreground transition-colors'

                      if (isSelected) {
                        classes +=
                          ' bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground'
                      } else if (isToday) {
                        classes += ' font-bold ring-2 ring-primary/50'
                      }

                      return classes
                    }}
                    popperClassName="!z-50"
                    popperPlacement="bottom-start"
                    portalId="datepicker-portal"
                  />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault()
                      const input =
                        e.currentTarget.previousElementSibling?.querySelector(
                          'input'
                        )
                      if (input) input.focus()
                    }}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors focus:outline-none p-0.5"
                  >
                    <Calendar className="w-5 h-5" />
                  </button>
                </div>
                {errors.date && (
                  <div className="flex items-center gap-2 text-sm text-destructive">
                    <AlertCircle className="w-4 h-4" />
                    {errors.date}
                  </div>
                )}
              </div>
            </div>

            {/* Switch Button */}
            <div className="flex justify-center items-start pt-9">
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => {
                  const newFrom = formData.to
                  const newTo = formData.from
                  setFormData({
                    ...formData,
                    from: newFrom,
                    to: newTo,
                  })
                  setErrors({ ...errors, from: '', to: '' })
                }}
                className="h-10 w-10 rounded-full hover:bg-primary hover:text-primary-foreground transition-colors"
                title="Swap departure and destination"
              >
                <ArrowLeftRight className="w-4 h-4" />
              </Button>
            </div>

            {/* Right Column: To and Passengers */}
            <div className="space-y-4">
              {/* To */}
              <div className="space-y-2">
                <Label htmlFor="to" className="text-base font-medium">
                  To
                </Label>
                <LocationAutocomplete
                  value={formData.to}
                  onValueChange={(value) => {
                    setFormData({ ...formData, to: value })
                    setErrors({ ...errors, to: '' })
                  }}
                  placeholder="Search destination city, bus station, or stop (e.g., da nang, hue, hai phong bus station)"
                  type="destination"
                />
                {errors.to && (
                  <div className="flex items-center gap-2 text-sm text-destructive">
                    <AlertCircle className="w-4 h-4" />
                    {errors.to}
                  </div>
                )}
              </div>

              {/* Passengers */}
              <div className="space-y-2">
                <Label htmlFor="passengers" className="text-base font-medium">
                  Passengers
                </Label>
                <Select
                  value={formData.passengers.toString()}
                  onValueChange={(value) => {
                    setFormData({
                      ...formData,
                      passengers: parseInt(value),
                    })
                  }}
                >
                  <SelectTrigger className="h-12">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-muted-foreground" />
                      <SelectValue placeholder="Select passengers" />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1</SelectItem>
                    <SelectItem value="2">2</SelectItem>
                    <SelectItem value="3">3</SelectItem>
                    <SelectItem value="4">4</SelectItem>
                    <SelectItem value="5">5</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Search Button */}
          <Button
            type="submit"
            className="w-full h-12 text-lg font-medium"
            disabled={isLoading}
          >
            {isLoading ? 'Searching...' : 'Search Trips'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
