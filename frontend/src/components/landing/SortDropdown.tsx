import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export type SortOption =
  | 'default'
  | 'price-asc'
  | 'price-desc'
  | 'departure-asc'
  | 'departure-desc'
  | 'duration-asc'
  | 'rating-desc'

interface SortDropdownProps {
  value: SortOption
  onChange: (value: SortOption) => void
}

const sortOptions = [
  { value: 'default', label: 'Default' },
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
  { value: 'departure-asc', label: 'Earliest Departure' },
  { value: 'departure-desc', label: 'Latest Departure' },
  { value: 'duration-asc', label: 'Shortest Duration' },
  { value: 'rating-desc', label: 'Highest Operator Rating' },
]

export function SortDropdown({ value, onChange }: SortDropdownProps) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-full md:w-64 bg-background border-border">
        <SelectValue placeholder="Sort by" />
      </SelectTrigger>
      <SelectContent className="bg-card border-border">
        {sortOptions.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
