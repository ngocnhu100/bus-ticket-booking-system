import { useState, useEffect, useRef, useCallback } from 'react'
import {
  Check,
  ChevronsUpDown,
  MapPin,
  Loader2,
  Lightbulb,
  CircleX,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandList,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

interface LocationSuggestion {
  location: string
  type: 'origin' | 'destination' | 'stop' | 'dropoff_point'
  relevance: number
  origin?: string
  destination?: string
}

interface PopularRoute {
  origin: string
  destination: string
  distance_km: number
  estimated_minutes: number
}

interface LocationAutocompleteProps {
  value?: string
  onValueChange?: (value: string) => void
  placeholder?: string
  disabled?: boolean
  type?: 'origin' | 'destination' | 'both' | 'all'
  className?: string
}

/**
 * LocationAutocomplete Component
 *
 * Advanced location search with:
 * - Real-time autocomplete suggestions from backend
 * - Unaccented search (e.g., "ha noi" finds "Hà Nội")
 * - Fuzzy matching (handles typos)
 * - Full-text search
 * - Debounced API calls to reduce server load
 */
export function LocationAutocomplete({
  value = '',
  onValueChange,
  placeholder = 'Select location',
  disabled = false,
  type = 'both',
  className,
}: LocationAutocompleteProps) {
  const [open, setOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([])
  const [topRoutes, setTopRoutes] = useState<PopularRoute[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)

  // Fetch top popular routes
  const fetchTopRoutes = useCallback(async () => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/trips/popular-routes?limit=8`
      )

      if (!response.ok) {
        throw new Error('Failed to fetch popular routes')
      }

      const data = await response.json()

      if (data.success && data.data) {
        setTopRoutes(data.data)
      }
    } catch (err) {
      console.error('Top routes error:', err)
      // Don't set error state for top routes, just leave empty
    }
  }, [])

  // Fetch suggestions from API
  const fetchSuggestions = useCallback(
    async (query: string) => {
      if (!query || query.trim().length < 2) {
        setSuggestions([])
        return
      }

      setIsLoading(true)
      setError(null)

      try {
        // For destination searches, also include stops and dropoff points
        // since users might search for bus stations, stops, or dropoff locations
        const searchType = type === 'destination' ? 'all' : type

        const response = await fetch(
          `${API_BASE_URL}/trips/autocomplete/locations?q=${encodeURIComponent(query)}&type=${searchType}&limit=10`
        )

        if (!response.ok) {
          throw new Error('Failed to fetch suggestions')
        }

        const data = await response.json()

        if (data.success && data.data.suggestions) {
          setSuggestions(data.data.suggestions)
        } else {
          setSuggestions([])
        }
      } catch (err) {
        console.error('Autocomplete error:', err)
        setError('Failed to load suggestions')
        setSuggestions([])
      } finally {
        setIsLoading(false)
      }
    },
    [type]
  )

  // Fetch top routes on mount
  useEffect(() => {
    fetchTopRoutes()
  }, [fetchTopRoutes])

  // Debounced search
  useEffect(() => {
    // Clear previous timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    // Set new timer
    if ((searchQuery || '').trim().length >= 2) {
      debounceTimerRef.current = setTimeout(() => {
        fetchSuggestions(searchQuery)
      }, 300) // 300ms debounce
    } else {
      setSuggestions([])
    }

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [searchQuery, fetchSuggestions])

  const handleSelect = (suggestion: LocationSuggestion) => {
    let valueToSet = suggestion.location

    // For stops and dropoff points, use the route's origin/destination based on the field type
    if (
      type === 'origin' &&
      (suggestion.type === 'stop' || suggestion.type === 'dropoff_point')
    ) {
      valueToSet = suggestion.origin || suggestion.location
    } else if (
      type === 'destination' &&
      (suggestion.type === 'stop' || suggestion.type === 'dropoff_point')
    ) {
      valueToSet = suggestion.destination || suggestion.location
    }

    onValueChange?.(valueToSet)
    setSearchQuery(suggestion.location) // Display the selected location name
    setOpen(false)
  }

  const displayValue = searchQuery || value || 'Select location...'

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            'w-full h-12 justify-between font-normal',
            !value && 'text-muted-foreground',
            className
          )}
        >
          <div className="flex items-center gap-2 overflow-hidden">
            <MapPin className="h-4 w-4 shrink-0 opacity-50" />
            <span className="truncate">{displayValue}</span>
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command shouldFilter={false}>
          <div className="relative">
            <CommandInput
              placeholder={placeholder}
              value={searchQuery}
              onValueChange={setSearchQuery}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  // Auto-select first item when Enter is pressed
                  if ((searchQuery || '').length < 2 && topRoutes.length > 0) {
                    // Select first popular route
                    const locationToSelect: LocationSuggestion = {
                      location:
                        type === 'destination'
                          ? topRoutes[0].destination
                          : topRoutes[0].origin,
                      type: type === 'destination' ? 'destination' : 'origin',
                      relevance: 1,
                      origin: topRoutes[0].origin,
                      destination: topRoutes[0].destination,
                    }
                    handleSelect(locationToSelect)
                  } else if (suggestions && suggestions.length > 0) {
                    // Select first suggestion
                    handleSelect(suggestions[0])
                  }
                }
              }}
              onBlur={() => {
                // If user blurs and searchQuery is empty, clear the value
                if (!(searchQuery || '').trim()) {
                  onValueChange?.('')
                }
              }}
              disabled={disabled}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 z-10 p-1 hover:bg-gray-200 rounded transition-colors cursor-pointer"
                title="Clear search"
              >
                <CircleX className="h-4 w-4 text-gray-700 dark:text-gray-300" />
              </button>
            )}
          </div>
          <CommandList>
            {isLoading && (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                <span className="ml-2 text-sm text-muted-foreground">
                  Searching...
                </span>
              </div>
            )}

            {!isLoading && error && (
              <CommandEmpty>
                <div className="text-center py-6">
                  <p className="text-sm text-destructive">{error}</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Please try again
                  </p>
                </div>
              </CommandEmpty>
            )}

            {!isLoading &&
              !error &&
              (searchQuery || '').length >= 2 &&
              suggestions &&
              suggestions.length === 0 && (
                <CommandEmpty>
                  <div className="text-center py-6">
                    <MapPin className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm">No locations found</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Try a different search term
                    </p>
                  </div>
                </CommandEmpty>
              )}

            {!isLoading &&
              (searchQuery || '').length < 2 &&
              topRoutes.length === 0 && (
                <CommandEmpty>
                  <div className="text-center py-6">
                    <MapPin className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      Type at least 2 characters to search
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      e.g., "ha noi", "da lat", "da nang"
                    </p>
                  </div>
                </CommandEmpty>
              )}

            {!isLoading &&
              (searchQuery || '').length < 2 &&
              topRoutes.length > 0 && (
                <CommandGroup heading="Popular Routes">
                  {topRoutes.map((route, index) => (
                    <div
                      key={`${route.origin}-${route.destination}-${index}`}
                      className="flex items-center px-2 py-1.5 text-sm cursor-pointer hover:bg-accent hover:text-accent-foreground rounded-sm"
                      onClick={() => {
                        const locationToSelect: LocationSuggestion = {
                          location:
                            type === 'destination'
                              ? route.destination
                              : route.origin,
                          type:
                            type === 'destination' ? 'destination' : 'origin',
                          relevance: 1,
                          origin: route.origin,
                          destination: route.destination,
                        }
                        handleSelect(locationToSelect)
                      }}
                    >
                      <MapPin className="mr-2 h-4 w-4 text-muted-foreground" />
                      <div className="flex-1">
                        <span className="font-medium">
                          {type === 'destination'
                            ? route.destination
                            : route.origin}
                        </span>
                        <span className="text-xs text-muted-foreground ml-2">
                          {route.origin} → {route.destination} (
                          {route.distance_km}km)
                        </span>
                      </div>
                    </div>
                  ))}
                </CommandGroup>
              )}

            {!isLoading && suggestions && suggestions.length > 0 && (
              <CommandGroup heading="Suggestions">
                {suggestions.map((suggestion, index) => (
                  <div
                    key={`${suggestion.location}-${index}`}
                    className="flex items-center px-2 py-1.5 text-sm cursor-pointer hover:bg-accent hover:text-accent-foreground rounded-sm"
                    onClick={() => handleSelect(suggestion)}
                  >
                    <Check
                      className={cn(
                        'mr-2 h-4 w-4',
                        value === suggestion.location
                          ? 'opacity-100'
                          : 'opacity-0'
                      )}
                    />
                    <MapPin className="mr-2 h-4 w-4 text-muted-foreground" />
                    <div className="flex-1">
                      <span>{suggestion.location}</span>
                      <span className="ml-2 text-xs text-muted-foreground">
                        {suggestion.type === 'origin' && (
                          <>
                            <MapPin className="inline w-3 h-3 mr-1" />
                            Origin
                          </>
                        )}
                        {suggestion.type === 'destination' && (
                          <>
                            <MapPin className="inline w-3 h-3 mr-1" />
                            Destination
                          </>
                        )}
                        {suggestion.type === 'stop' && (
                          <>
                            <MapPin className="inline w-3 h-3 mr-1" />
                            Route Stop
                          </>
                        )}
                        {suggestion.type === 'dropoff_point' && (
                          <>
                            <MapPin className="inline w-3 h-3 mr-1" />
                            Drop-off Point
                          </>
                        )}
                        {suggestion.relevance > 0 &&
                          ` (${Math.min(Math.round(suggestion.relevance * 100), 100)}% match)`}
                      </span>
                    </div>
                  </div>
                ))}
              </CommandGroup>
            )}

            {(searchQuery || '').length >= 2 && (
              <div className="border-t px-3 py-2 text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Lightbulb className="w-3 h-3" />
                  <span>
                    You can search without diacritics (e.g., "ha noi" → "Hà
                    Nội")
                  </span>
                </div>
              </div>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
