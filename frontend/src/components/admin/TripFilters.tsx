import type { Route, Bus } from '../../types/trip.types'
import { ChevronDown } from 'lucide-react'

export interface TripFiltersData {
  routeId: string
  busId: string
  status: string
}

interface TripFiltersProps {
  routes: Route[]
  buses: Bus[]
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
          <div className="relative">
            <select
              value={filters.routeId}
              onChange={(e) => handleFilterChange('routeId', e.target.value)}
              className="w-full appearance-none rounded-lg border border-border bg-card px-3 py-2 pr-8 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">All routes</option>
              {routes.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.from} → {r.to}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          </div>
        </div>

        <div className="mr-2">
          <label className="block text-sm font-medium text-foreground mb-2">
            Bus
          </label>
          <div className="relative">
            <select
              value={filters.busId}
              onChange={(e) => handleFilterChange('busId', e.target.value)}
              className="w-full appearance-none rounded-lg border border-border bg-card px-3 py-2 pr-8 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">All buses</option>
              {buses.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Status
          </label>
          <div className="relative">
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="w-full appearance-none rounded-lg border border-border bg-card px-3 py-2 pr-8 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">All statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>
            <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          </div>
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
