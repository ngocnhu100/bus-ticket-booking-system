import React, { useState } from 'react'
import { ChevronDown, X, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import {
  timeSlots,
  busTypes,
  amenities,
  seatLocations,
} from '@/constants/filterConstants'

export interface Filters {
  departureTimeSlots: string[]
  priceRange: [number, number]
  operators: string[]
  busTypes: string[]
  amenities: string[]
  seatLocations: string[]
  minRating: number
  minSeatsAvailable: number
}

interface FilterPanelProps {
  filters: Filters
  onFiltersChange: (filters: Filters) => void
  onClearFilters: () => void
  availableOperators: string[]
  operatorRatings: Record<string, number>
  resultsCount: number
}

interface CollapsibleSectionProps {
  title: string
  children: React.ReactNode
  defaultOpen?: boolean
  activeCount?: number
}

function CollapsibleSection({
  title,
  children,
  defaultOpen = true,
  activeCount,
}: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <div className="border-b border-border">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between py-3 px-4 hover:bg-accent/50 transition-colors"
      >
        <h3 className="font-semibold text-foreground text-sm flex items-center gap-2">
          {title}
          {activeCount !== undefined && activeCount > 0 && (
            <span className="bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-full font-medium">
              {activeCount}
            </span>
          )}
        </h3>
        <ChevronDown
          className={cn(
            'w-4 h-4 text-muted-foreground transition-transform',
            isOpen && 'rotate-180'
          )}
        />
      </button>
      {isOpen && <div className="px-4 pb-4 space-y-3">{children}</div>}
    </div>
  )
}

interface CheckboxProps {
  id: string
  label: React.ReactNode
  checked: boolean
  onChange: (checked: boolean) => void
}

function Checkbox({ id, label, checked, onChange }: CheckboxProps) {
  return (
    <label className="flex items-center gap-2 cursor-pointer group">
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="w-4 h-4 rounded border-2 border-input accent-primary cursor-pointer"
      />
      <span className="text-sm text-foreground group-hover:text-primary transition-colors">
        {label}
      </span>
    </label>
  )
}

interface RadioButtonProps {
  id: string
  name: string
  label: React.ReactNode
  checked: boolean
  onChange: (checked: boolean) => void
}

function RadioButton({ id, name, label, checked, onChange }: RadioButtonProps) {
  return (
    <label className="flex items-center gap-2 cursor-pointer group">
      <input
        id={id}
        name={name}
        type="radio"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="w-4 h-4 rounded-full border-2 border-input accent-primary cursor-pointer"
      />
      <span className="text-sm text-foreground group-hover:text-primary transition-colors">
        {label}
      </span>
    </label>
  )
}

interface RangeSliderProps {
  min: number
  max: number
  value: [number, number]
  onChange: (value: [number, number]) => void
  step?: number
}

function RangeSlider({
  min,
  max,
  value,
  onChange,
  step = 10000,
}: RangeSliderProps) {
  const handleMinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newMin = Math.min(parseInt(e.target.value), value[1] - step)
    onChange([newMin, value[1]])
  }

  const handleMaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newMax = Math.max(parseInt(e.target.value), value[0] + step)
    onChange([value[0], newMax])
  }

  const minPercent = ((value[0] - min) / (max - min)) * 100
  const maxPercent = ((value[1] - min) / (max - min)) * 100

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Min:</span>
        <span className="font-semibold text-foreground">
          {value[0].toLocaleString('vi-VN')}đ
        </span>
      </div>
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Max:</span>
        <span className="font-semibold text-foreground">
          {value[1].toLocaleString('vi-VN')}đ
        </span>
      </div>

      {/* Dual range slider */}
      <div className="relative h-8 flex items-center">
        <div
          className="absolute w-full h-1 bg-secondary rounded-lg pointer-events-none"
          style={{ zIndex: 1 }}
        >
          <div
            className="absolute h-1 bg-primary rounded-lg"
            style={{
              left: `${minPercent}%`,
              width: `${maxPercent - minPercent}%`,
            }}
          />
        </div>
        <input
          type="range"
          min={min}
          max={max}
          value={value[0]}
          onChange={handleMinChange}
          step={step}
          className="absolute w-full h-1 bg-transparent appearance-none cursor-pointer slider-thumb"
          style={{ zIndex: value[0] > (max - min) / 2 ? 10 : 8 }}
        />
        <input
          type="range"
          min={min}
          max={max}
          value={value[1]}
          onChange={handleMaxChange}
          step={step}
          className="absolute w-full h-1 bg-transparent appearance-none cursor-pointer slider-thumb"
          style={{ zIndex: value[1] > (max - min) / 2 ? 10 : 8 }}
        />
      </div>
    </div>
  )
}

export function FilterPanel({
  filters,
  onFiltersChange,
  onClearFilters,
  availableOperators,
  resultsCount,
}: FilterPanelProps) {
  // Check if any filters are active
  const hasActiveFilters =
    filters.departureTimeSlots.length > 0 ||
    filters.priceRange[0] > 0 ||
    filters.priceRange[1] < 5000000 ||
    filters.operators.length > 0 ||
    filters.busTypes.length > 0 ||
    filters.amenities.length > 0 ||
    filters.seatLocations.length > 0 ||
    filters.minRating > 0 ||
    filters.minSeatsAvailable > 1

  // Count active filters in each section
  const getDepartureTimeCount = () => filters.departureTimeSlots.length
  const getPriceRangeCount = () =>
    filters.priceRange[0] > 0 || filters.priceRange[1] < 5000000 ? 1 : 0
  const getOperatorsCount = () => filters.operators.length
  const getBusTypesCount = () => filters.busTypes.length
  const getAmenitiesCount = () => filters.amenities.length
  const getSeatAvailabilityCount = () => (filters.minSeatsAvailable > 1 ? 1 : 0)
  const getSeatLocationCount = () => filters.seatLocations.length
  const getRatingFilterCount = () => (filters.minRating > 0 ? 1 : 0)

  // Calculate total active filters
  const getTotalActiveFilters = () =>
    getDepartureTimeCount() +
    getPriceRangeCount() +
    getOperatorsCount() +
    getBusTypesCount() +
    getAmenitiesCount() +
    getSeatAvailabilityCount() +
    getSeatLocationCount() +
    getRatingFilterCount()

  return (
    <Card className="p-0 h-fit sticky top-20 bg-card border-border">
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div>
          <h2 className="font-semibold text-foreground flex items-center gap-2">
            Filters
            {getTotalActiveFilters() > 0 && (
              <span className="bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-full font-medium">
                {getTotalActiveFilters()}
              </span>
            )}
          </h2>
          <p className="text-sm text-muted-foreground">
            {resultsCount} result{resultsCount !== 1 ? 's' : ''}
          </p>
        </div>
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearFilters}
            className="h-auto p-1 text-xs text-muted-foreground hover:text-foreground"
          >
            <X className="w-3 h-3 mr-1" />
            Clear filters
          </Button>
        )}
      </div>

      <div className="overflow-y-auto max-h-[calc(100vh-200px)]">
        {/* Departure Time Slots */}
        <CollapsibleSection
          title="Departure Time"
          defaultOpen
          activeCount={getDepartureTimeCount()}
        >
          <div className="space-y-2">
            {timeSlots.map((slot) => (
              <Checkbox
                key={slot.id}
                id={slot.id}
                label={slot.label}
                checked={filters.departureTimeSlots.includes(slot.value)}
                onChange={(checked) => {
                  const newSlots = checked
                    ? [...filters.departureTimeSlots, slot.value]
                    : filters.departureTimeSlots.filter((s) => s !== slot.value)
                  onFiltersChange({ ...filters, departureTimeSlots: newSlots })
                }}
              />
            ))}
          </div>
        </CollapsibleSection>

        {/* Price Range */}
        <CollapsibleSection
          title="Price Range"
          activeCount={getPriceRangeCount()}
        >
          <RangeSlider
            min={0}
            max={5000000}
            value={filters.priceRange}
            onChange={(value) =>
              onFiltersChange({ ...filters, priceRange: value })
            }
          />
        </CollapsibleSection>

        {/* Operators */}
        {availableOperators.length > 0 && (
          <CollapsibleSection
            title="Operators"
            defaultOpen={false}
            activeCount={getOperatorsCount()}
          >
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {availableOperators.map((operator) => {
                const isSelected = filters.operators.includes(operator)
                return (
                  <Checkbox
                    key={operator}
                    id={operator}
                    label={
                      <div className="flex items-center justify-between w-full">
                        <span>{operator}</span>
                      </div>
                    }
                    checked={isSelected}
                    onChange={(checked) => {
                      // Checkbox behavior: multiple operators can be selected
                      const newOperators = checked
                        ? [...filters.operators, operator]
                        : filters.operators.filter((o) => o !== operator)
                      onFiltersChange({ ...filters, operators: newOperators })
                    }}
                  />
                )
              })}
            </div>
          </CollapsibleSection>
        )}

        {/* Bus Types */}
        <CollapsibleSection title="Bus Type" activeCount={getBusTypesCount()}>
          <div className="space-y-2">
            {busTypes.map((type) => (
              <Checkbox
                key={type.id}
                id={type.id}
                label={type.label}
                checked={filters.busTypes.includes(type.id)}
                onChange={(checked) => {
                  const newTypes = checked
                    ? [...filters.busTypes, type.id]
                    : filters.busTypes.filter((t) => t !== type.id)
                  onFiltersChange({ ...filters, busTypes: newTypes })
                }}
              />
            ))}
          </div>
        </CollapsibleSection>

        {/* Amenities */}
        <CollapsibleSection
          title="Amenities"
          defaultOpen={false}
          activeCount={getAmenitiesCount()}
        >
          <div className="space-y-2">
            {amenities.map((amenity) => (
              <Checkbox
                key={amenity.id}
                id={amenity.id}
                label={amenity.label}
                checked={filters.amenities.includes(amenity.id)}
                onChange={(checked) => {
                  const newAmenities = checked
                    ? [...filters.amenities, amenity.id]
                    : filters.amenities.filter((a) => a !== amenity.id)
                  onFiltersChange({ ...filters, amenities: newAmenities })
                }}
              />
            ))}
          </div>
        </CollapsibleSection>

        {/* Seat Availability */}
        <CollapsibleSection
          title="Seat Availability"
          defaultOpen={false}
          activeCount={getSeatAvailabilityCount()}
        >
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  const newValue = Math.max(1, filters.minSeatsAvailable - 1)
                  onFiltersChange({ ...filters, minSeatsAvailable: newValue })
                }}
                className="w-8 h-8 rounded border border-input bg-background hover:bg-accent flex items-center justify-center text-sm font-medium"
                disabled={filters.minSeatsAvailable <= 1}
              >
                -
              </button>
              <input
                type="number"
                min="1"
                value={filters.minSeatsAvailable}
                onChange={(e) => {
                  const value = parseInt(e.target.value) || 1
                  onFiltersChange({
                    ...filters,
                    minSeatsAvailable: Math.max(1, value),
                  })
                }}
                className="w-20 px-2 py-1 text-center border border-input bg-background rounded text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="1"
              />
              <button
                onClick={() => {
                  const newValue = filters.minSeatsAvailable + 1
                  onFiltersChange({ ...filters, minSeatsAvailable: newValue })
                }}
                className="w-8 h-8 rounded border border-input bg-background hover:bg-accent flex items-center justify-center text-sm font-medium"
              >
                +
              </button>
              <span className="text-sm text-muted-foreground ml-2">
                seats available
              </span>
            </div>
          </div>
        </CollapsibleSection>

        {/* Seat Location */}
        <CollapsibleSection
          title="Seat Position"
          defaultOpen={false}
          activeCount={getSeatLocationCount()}
        >
          <div className="space-y-2">
            {seatLocations.map((location) => (
              <Checkbox
                key={location.id}
                id={location.id}
                label={location.label}
                checked={filters.seatLocations.includes(location.id)}
                onChange={(checked) => {
                  const newLocations = checked
                    ? [...filters.seatLocations, location.id]
                    : filters.seatLocations.filter((l) => l !== location.id)
                  onFiltersChange({ ...filters, seatLocations: newLocations })
                }}
              />
            ))}
          </div>
        </CollapsibleSection>

        {/* Minimum Rating */}
        <CollapsibleSection
          title="Operator Rating"
          defaultOpen={false}
          activeCount={getRatingFilterCount()}
        >
          <div className="space-y-2">
            {/* All ratings option */}
            <RadioButton
              id="rating-all"
              name="rating"
              label="All ratings"
              checked={filters.minRating === 0}
              onChange={(checked) => {
                if (checked) {
                  onFiltersChange({
                    ...filters,
                    minRating: 0,
                  })
                }
              }}
            />
            {[5, 4, 3, 2, 1].map((rating) => (
              <RadioButton
                key={rating}
                id={`rating-${rating}`}
                name="rating"
                label={
                  <div className="flex items-center gap-1">
                    <span>{rating}</span>
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <span>+</span>
                  </div>
                }
                checked={filters.minRating === rating}
                onChange={(checked) => {
                  onFiltersChange({
                    ...filters,
                    minRating: checked ? rating : 0,
                  })
                }}
              />
            ))}
          </div>
        </CollapsibleSection>
      </div>
    </Card>
  )
}
