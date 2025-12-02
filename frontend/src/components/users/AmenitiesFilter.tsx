import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Wifi, Wind, Droplet, Monitor } from 'lucide-react'

interface AmenitiesFilterProps {
  selectedAmenities: string[]
  onChange: (amenities: string[]) => void
}

const amenities = [
  { value: 'wifi', label: 'WiFi', icon: Wifi },
  { value: 'ac', label: 'Air Conditioning', icon: Wind },
  { value: 'toilet', label: 'Toilet', icon: Droplet },
  { value: 'entertainment', label: 'Entertainment', icon: Monitor },
]

export const AmenitiesFilter = ({
  selectedAmenities,
  onChange,
}: AmenitiesFilterProps) => {
  const handleToggle = (value: string) => {
    if (selectedAmenities.includes(value)) {
      onChange(selectedAmenities.filter((amenity) => amenity !== value))
    } else {
      onChange([...selectedAmenities, value])
    }
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-foreground">Amenities</h3>
      <div className="space-y-2">
        {amenities.map((amenity) => {
          const Icon = amenity.icon
          return (
            <div key={amenity.value} className="flex items-center space-x-2">
              <Checkbox
                id={`amenity-${amenity.value}`}
                checked={selectedAmenities.includes(amenity.value)}
                onCheckedChange={() => handleToggle(amenity.value)}
              />
              <Label
                htmlFor={`amenity-${amenity.value}`}
                className="text-sm font-normal cursor-pointer flex items-center gap-2"
              >
                <Icon className="w-4 h-4 text-muted-foreground" />
                {amenity.label}
              </Label>
            </div>
          )
        })}
      </div>
    </div>
  )
}
