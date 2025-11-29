import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Combobox } from '@/components/ui/combobox'
import { AlertCircle, Calendar, ArrowLeftRight } from 'lucide-react'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import '@/styles/datepicker.css'

interface SearchFormData {
  from: string
  to: string
  date: Date | null
  passengers: number | string
}

// Mock cities as fallback when API is not available
const fallbackCities = [
  'Ho Chi Minh City (HCM)',
  'Hanoi (HN)',
  'Da Nang (DN)',
  'Hai Phong (HP)',
  'Nha Trang (NT)',
  'Da Lat (DL)',
  'Can Tho (CT)',
  'Hue (HU)',
  'Vung Tau (VT)',
]

export function SearchForm() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState<SearchFormData>({
    from: '',
    to: '',
    date: null,
    passengers: 1,
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(false)
  const [cities, setCities] = useState<string[]>(fallbackCities)
  const [citiesLoading, setCitiesLoading] = useState(true)
  const [citiesError, setCitiesError] = useState<string | null>(null)

  const fetchCities = async () => {
    try {
      setCitiesLoading(true)
      setCitiesError(null)

      const response = await fetch('/cities')
      const data = await response.json()
      setCities(data)
    } catch (error) {
      console.error('Failed to load cities:', error)
      setCitiesError('Failed to load cities. Using default list.')
      setCities(fallbackCities)
    } finally {
      setCitiesLoading(false)
    }
  }

  // Fetch cities on component mount
  useEffect(() => {
    fetchCities()
  }, [])

  // Validate form
  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.from) newErrors.from = 'Please select a departure city'
    if (!formData.to) newErrors.to = 'Please select a destination city'
    if (!formData.date) newErrors.date = 'Please select a date'
    if (formData.from === formData.to && formData.from)
      newErrors.from = 'Departure and destination must be different'

    // Date validation - must be today or later
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

    // Ensure passengers is a valid number
    const passengerCount =
      typeof formData.passengers === 'string'
        ? parseInt(formData.passengers) || 1
        : formData.passengers

    setIsLoading(true)

    // Simulate API call
    setTimeout(() => {
      const searchParams = new URLSearchParams({
        from: formData.from,
        to: formData.to,
        date: formData.date ? formData.date.toISOString().split('T')[0] : '',
        passengers: passengerCount.toString(),
      })

      navigate(`/search-results?${searchParams.toString()}`)
      setIsLoading(false)
    }, 500)
  }

  return (
    <div className="w-full -mt-20 relative z-10 px-4">
      <Card className="w-full max-w-4xl mx-auto shadow-2xl shadow-indigo-100 border-0">
        <CardContent className="p-6 md:p-8">
          <form onSubmit={handleSearch} className="space-y-6">
            {/* From and To */}
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-4 items-end">
                {/* From */}
                <div className="space-y-2">
                  <Label htmlFor="from" className="text-base font-semibold">
                    From
                  </Label>
                  <Combobox
                    options={cities}
                    value={formData.from}
                    onValueChange={(value) => {
                      setFormData({ ...formData, from: value })
                      setErrors({ ...errors, from: '' })
                    }}
                    placeholder={
                      citiesLoading
                        ? 'Loading cities...'
                        : 'Select departure city'
                    }
                    disabled={citiesLoading}
                  />
                </div>

                {/* Switch Button */}
                <div className="flex justify-center mb-2 md:mb-0">
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
                      // Clear any existing errors
                      setErrors({ ...errors, from: '', to: '' })
                    }}
                    className="h-10 w-10 rounded-full hover:bg-primary hover:text-primary-foreground transition-colors"
                    title="Swap departure and destination"
                  >
                    <ArrowLeftRight className="w-4 h-4" />
                  </Button>
                </div>

                {/* To */}
                <div className="space-y-2">
                  <Label htmlFor="to" className="text-base font-semibold">
                    To
                  </Label>
                  <Combobox
                    options={cities}
                    value={formData.to}
                    onValueChange={(value) => {
                      setFormData({ ...formData, to: value })
                      setErrors({ ...errors, to: '' })
                    }}
                    placeholder={
                      citiesLoading
                        ? 'Loading cities...'
                        : 'Select destination city'
                    }
                    disabled={citiesLoading}
                  />
                </div>
              </div>

              {/* Error messages for From/To row */}
              {(errors.from || errors.to || citiesError) && (
                <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-4">
                  <div>
                    {errors.from && (
                      <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
                        <AlertCircle className="w-4 h-4" />
                        {errors.from}
                      </div>
                    )}
                  </div>
                  <div></div> {/* Empty space for switch button */}
                  <div>
                    {errors.to && (
                      <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
                        <AlertCircle className="w-4 h-4" />
                        {errors.to}
                      </div>
                    )}
                    {citiesError && !errors.to && (
                      <div className="flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400">
                        <AlertCircle className="w-4 h-4" />
                        {citiesError}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Date and Passengers */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Date */}
              <div className="space-y-2">
                <Label htmlFor="date" className="text-base font-semibold">
                  Date
                </Label>
                <div className="relative">
                  <div
                    id="datepicker-portal"
                    className="absolute top-full left-0 z-9999 mt-2"
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
                    className="w-full h-12 px-3 py-2 text-base bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50"
                    wrapperClassName="w-full"
                    calendarClassName="!bg-background !border !border-border !rounded-md !shadow-xl !w-80"
                    dayClassName={(date) => {
                      const today = new Date()
                      today.setHours(0, 0, 0, 0)
                      const isToday = date.getTime() === today.getTime()
                      const isPast = date < today

                      if (isPast) {
                        return 'text-muted-foreground/50 cursor-not-allowed opacity-30'
                      }
                      if (isToday) {
                        return 'bg-primary text-primary-foreground font-bold ring-2 ring-primary/50'
                      }
                      return 'hover:bg-accent hover:text-accent-foreground cursor-pointer'
                    }}
                    popperClassName="!z-9999"
                    popperPlacement="bottom-start"
                    portalId="datepicker-portal"
                  />
                  <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
                </div>
                {errors.date && (
                  <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
                    <AlertCircle className="w-4 h-4" />
                    {errors.date}
                  </div>
                )}
              </div>

              {/* Passengers */}
              <div className="space-y-2">
                <Label htmlFor="passengers" className="text-base font-semibold">
                  Passengers
                </Label>
                <div className="flex items-center gap-2 h-12">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-12 w-12 p-0"
                    onClick={() =>
                      setFormData({
                        ...formData,
                        passengers: Math.max(
                          1,
                          Number(formData.passengers) - 1
                        ),
                      })
                    }
                  >
                    −
                  </Button>
                  <Input
                    id="passengers"
                    type="number"
                    min="1"
                    value={formData.passengers}
                    onChange={(e) => {
                      const value = e.target.value
                      if (value === '') {
                        // Allow empty input temporarily
                        setFormData({
                          ...formData,
                          passengers: '', // Temporary empty state
                        })
                      } else {
                        const numValue = parseInt(value)
                        if (!isNaN(numValue)) {
                          setFormData({
                            ...formData,
                            passengers: numValue,
                          })
                        }
                      }
                    }}
                    onBlur={(e) => {
                      // Set default value when field loses focus
                      if (
                        e.target.value === '' ||
                        parseInt(e.target.value) < 1
                      ) {
                        setFormData({
                          ...formData,
                          passengers: 1,
                        })
                      }
                    }}
                    className="flex-1 text-center h-12 [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield]"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-12 w-12 p-0"
                    onClick={() =>
                      setFormData({
                        ...formData,
                        passengers: Number(formData.passengers) + 1,
                      })
                    }
                  >
                    +
                  </Button>
                </div>
              </div>
            </div>

            {/* Search Button */}
            <Button
              type="submit"
              className="w-full h-12 text-lg font-semibold"
              disabled={isLoading}
            >
              {isLoading ? 'Searching...' : 'Search Trips'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
