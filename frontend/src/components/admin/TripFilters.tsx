import type { RouteAdminData, BusAdminData } from '../../types/trip.types'
import { CustomDropdown } from '../ui/custom-dropdown'
import { ArrowRight } from 'lucide-react'

export interface TripFiltersData {
  route_id: string
  bus_id: string
  status: string
}

interface TripFiltersProps {
  routes: RouteAdminData[]
  buses: BusAdminData[]
  filters: TripFiltersData
  onFiltersChange: (filters: TripFiltersData) => void
  onApplyFilters: () => void
  onClearFilters: () => void
}

export const TripFilters: React.FC<TripFiltersProps> = ({
  routes,
  buses,
  filters,
  onFiltersChange,
  onApplyFilters,
  onClearFilters,
}) => {
  const handleFilterChange = (key: keyof TripFiltersData, value: string) => {
    onFiltersChange({
      ...filters,
      [key]: value,
    })
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">Filters</h2>
        <button
          className="text-sm font-medium text-primary hover:underline"
          onClick={onClearFilters}
        >
          Clear all
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="mr-2">
          <label className="block text-sm font-medium text-foreground mb-2">
            Route
          </label>
          <CustomDropdown
            options={[
              { id: '', label: 'All routes' },
              ...routes.map((r) => ({
                id: r.route_id || '',
                label: (
                  <span className="flex items-center gap-1">
                    {r.origin}
                    <ArrowRight className="w-4 h-4" />
                    {r.destination}
                  </span>
                ),
              })),
            ]}
            value={filters.route_id}
            onChange={(value) => handleFilterChange('route_id', value)}
            placeholder="All routes"
          />
        </div>

        <div className="mr-2">
          <label className="block text-sm font-medium text-foreground mb-2">
            Bus
          </label>
          <CustomDropdown
            options={[
              { id: '', label: 'All buses' },
              ...buses.map((b) => ({
                id: b.bus_id || '',
                label: b.name,
              })),
            ]}
            value={filters.bus_id}
            onChange={(value) => handleFilterChange('bus_id', value)}
            placeholder="All buses"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Status
          </label>
          <CustomDropdown
            options={[
              { id: '', label: 'All statuses' },
              { id: 'active', label: 'Active' },
              { id: 'inactive', label: 'Inactive' },
            ]}
            value={filters.status}
            onChange={(value) => handleFilterChange('status', value)}
            placeholder="All statuses"
          />
        </div>
      </div>

      <button
        onClick={onApplyFilters}
        className="w-full rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm transition hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
      >
        Apply Filters
      </button>
    </div>
  )
}
