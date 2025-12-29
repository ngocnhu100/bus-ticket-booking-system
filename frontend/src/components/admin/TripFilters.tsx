import { useState, useEffect } from 'react'
import type { TripFilterParams } from '@/types/adminTripTypes'
import { CustomDropdown } from '../ui/custom-dropdown'
import { CustomDatePicker } from '../ui/custom-datepicker'
import { adminTripService } from '@/services/adminTripService'
import type { RouteAdminData } from '@/types/trip.types'

interface TripFiltersProps {
  filters: TripFilterParams
  onFiltersChange: (filters: TripFilterParams) => void
  onClearFilters: () => void
}

export const TripFilters: React.FC<TripFiltersProps> = ({
  filters,
  onFiltersChange,
  onClearFilters,
}) => {
  const [routes, setRoutes] = useState<RouteAdminData[]>([])
  const [dateFrom, setDateFrom] = useState<Date | null>(
    filters.departure_date_from ? new Date(filters.departure_date_from) : null
  )
  const [dateTo, setDateTo] = useState<Date | null>(
    filters.departure_date_to ? new Date(filters.departure_date_to) : null
  )

  useEffect(() => {
    const loadRoutes = async () => {
      try {
        const response = await adminTripService.getAllRoutes()
        setRoutes(response)
      } catch (error) {
        console.error('Failed to fetch routes:', error)
      }
    }
    loadRoutes()
  }, [])
  const handleFilterChange = (
    key: keyof TripFilterParams,
    value: string | number | undefined
  ) => {
    onFiltersChange({
      ...filters,
      [key]: value,
    })
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-sm mb-10">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">Filters</h2>
        <button
          className="text-sm font-medium text-primary hover:underline"
          onClick={onClearFilters}
        >
          Clear all
        </button>
      </div>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Search
          </label>
          <input
            type="text"
            placeholder="Search by origin or destination..."
            value={filters.search || ''}
            onChange={(e) =>
              handleFilterChange('search', e.target.value || undefined)
            }
            className="w-full px-3 py-2 border border-input bg-background rounded-md text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Bus License Plate
          </label>
          <input
            type="text"
            placeholder="Search by bus license plate..."
            value={filters.license_plate || ''}
            onChange={(e) =>
              handleFilterChange('license_plate', e.target.value || undefined)
            }
            className="w-full px-3 py-2 border border-input bg-background rounded-md text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Status
          </label>
          <CustomDropdown
            options={[
              { id: '', label: 'All statuses' },
              { id: 'scheduled', label: 'Scheduled' },
              { id: 'in_progress', label: 'In Progress' },
              { id: 'completed', label: 'Completed' },
              { id: 'cancelled', label: 'Cancelled' },
            ]}
            value={filters.status || ''}
            onChange={(value) =>
              handleFilterChange('status', value || undefined)
            }
            placeholder="All statuses"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Route
          </label>
          <CustomDropdown
            options={[
              { id: '', label: 'All routes' },
              ...routes.map((route) => ({
                id: route.route_id || '',
                label: `${route.origin} - ${route.destination}`,
              })),
            ]}
            value={filters.route_id || ''}
            onChange={(value) =>
              handleFilterChange('route_id', value || undefined)
            }
            placeholder="All routes"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Departure Date From
          </label>
          <CustomDatePicker
            selected={dateFrom}
            onChange={(date) => {
              setDateFrom(date)
              handleFilterChange(
                'departure_date_from',
                date ? date.toISOString().split('T')[0] : undefined
              )
            }}
            placeholderText="Select start date"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Departure Date To
          </label>
          <CustomDatePicker
            selected={dateTo}
            onChange={(date) => {
              setDateTo(date)
              handleFilterChange(
                'departure_date_to',
                date ? date.toISOString().split('T')[0] : undefined
              )
            }}
            placeholderText="Select end date"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Per Page
          </label>
          <CustomDropdown
            options={[
              { id: '10', label: '10' },
              { id: '20', label: '20' },
              { id: '50', label: '50' },
              { id: '100', label: '100' },
            ]}
            value={(filters.limit || 20).toString()}
            onChange={(value) => handleFilterChange('limit', parseInt(value))}
            placeholder="20"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Sort By
          </label>
          <CustomDropdown
            options={[
              { id: 'departure_time', label: 'Departure Time' },
              { id: 'bookings', label: 'Bookings' },
              { id: 'created_at', label: 'Created At' },
            ]}
            value={filters.sort_by || 'departure_time'}
            onChange={(value) => handleFilterChange('sort_by', value)}
            placeholder="Departure Time"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Sort Order
          </label>
          <CustomDropdown
            options={[
              { id: 'asc', label: 'Ascending' },
              { id: 'desc', label: 'Descending' },
            ]}
            value={filters.sort_order || 'asc'}
            onChange={(value) => handleFilterChange('sort_order', value)}
            placeholder="Ascending"
          />
        </div>
      </div>
    </div>
  )
}
