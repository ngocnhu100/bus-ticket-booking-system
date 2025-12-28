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
import { format } from 'date-fns'
import { useSearchHistory } from '@/hooks/useSearchHistory'
import type { SearchHistoryItem } from '@/types/searchHistory.types'
import { SearchHistoryPanel } from './SearchHistoryPanel'
import { useAuth } from '@/context/AuthContext'

interface SearchFormData {
  from: string
  to: string
  date: Date | null
  passengers: number | string
}

// Fallback cities list
const fallbackCities = [
  'Hanoi',
  'Ho Chi Minh City',
  'Da Nang',
  'Hai Phong',
  'Can Tho',
  'Hue',
  'Nha Trang',
  'Da Lat',
  'Sapa',
]

export function SearchForm() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const {
    searches,
    addSearch,
    removeSearch,
    clearHistory,
    isLoaded: historyLoaded,
  } = useSearchHistory()
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

      // Fetch cities from JSON file
      const response = await fetch('/cities.json')
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data = (await response.json()) as Array<{ NameEn: string }>
      // Extract unique city names from the data and map to our database names
      const cityNames = data
        .map((province) => {
          const name = province.NameEn
          switch (name) {
            case 'Ha Noi':
              return 'Hanoi'
            case 'Ho Chi Minh':
              return 'Ho Chi Minh City'
            case 'Da Nang':
              return 'Da Nang'
            case 'Hai Phong':
              return 'Hai Phong'
            case 'Can Tho':
              return 'Can Tho'
            case 'Thua Thien Hue':
              return 'Hue'
            case 'Khanh Hoa':
              return 'Nha Trang'
            case 'Lam Dong':
              return 'Da Lat'
            case 'Lao Cai':
              return 'Sapa'
            default:
              return name
          }
        })
        .sort()
      setCities(cityNames)
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

    // Add search to history if user is authenticated
    if (user?.userId) {
      addSearch({
        origin: formData.from,
        destination: formData.to,
        date: formData.date ? format(formData.date, 'yyyy-MM-dd') : '',
        passengers: passengerCount,
      })
    }

    const searchParams = new URLSearchParams({
      origin: formData.from,
      destination: formData.to,
      date: formData.date ? format(formData.date, 'yyyy-MM-dd') : '',
      passengers: passengerCount.toString(),
    })

    navigate(`/trip-search-results?${searchParams.toString()}`)
    setIsLoading(false)
  }

  // Handle repeat search
  const handleRepeatSearch = (searchItem: SearchHistoryItem) => {
    // Parse the date string (YYYY-MM-DD) properly to avoid locale issues
    const [year, month, day] = searchItem.date.split('-').map(Number)
    const parsedDate = new Date(year, month - 1, day) // month is 0-indexed in Date constructor
    setFormData({
      from: searchItem.origin,
      to: searchItem.destination,
      date: parsedDate,
      passengers: searchItem.passengers,
    })
    // Trigger search after form is updated
    setTimeout(() => {
      const passengerCount = searchItem.passengers
      const searchParams = new URLSearchParams({
        origin: searchItem.origin,
        destination: searchItem.destination,
        date: searchItem.date,
        passengers: passengerCount.toString(),
      })

      navigate(`/trip-search-results?${searchParams.toString()}`)
    }, 100)
  }

  return (
    <div className="w-full space-y-6">
      {/* Search Form */}
      <div className="w-full -mt-8 relative z-10 px-4">
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
                      className="absolute top-full left-0 z-10000 mt-2"
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
                      popperClassName="!z-[10000]"
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
                  <Label
                    htmlFor="passengers"
                    className="text-base font-semibold"
                  >
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

      {/* Search History Panel - Only show for authenticated users */}
      {user?.userId && historyLoaded && searches.length > 0 && (
        <div className="px-4">
          <SearchHistoryPanel
            searches={searches}
            onSelectSearch={handleRepeatSearch}
            onRemoveSearch={removeSearch}
            onClearHistory={clearHistory}
            isLoading={isLoading}
          />
        </div>
      )}
    </div>
  )
}
