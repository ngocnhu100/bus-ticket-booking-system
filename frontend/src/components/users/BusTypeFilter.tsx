import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { busTypes } from '@/constants/filterConstants'

interface BusTypeFilterProps {
  selectedTypes: string[]
  onChange: (types: string[]) => void
}

export const BusTypeFilter = ({
  selectedTypes,
  onChange,
}: BusTypeFilterProps) => {
  const handleToggle = (value: string) => {
    if (selectedTypes.includes(value)) {
      onChange(selectedTypes.filter((type) => type !== value))
    } else {
      onChange([...selectedTypes, value])
    }
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-foreground">Bus Type</h3>
      <div className="space-y-2">
        {busTypes.map((type) => (
          <div key={type.value} className="flex items-center space-x-2">
            <Checkbox
              id={`bus-${type.value}`}
              checked={selectedTypes.includes(type.value)}
              onCheckedChange={() => handleToggle(type.value)}
            />
            <Label
              htmlFor={`bus-${type.value}`}
              className="text-sm font-normal cursor-pointer"
            >
              {type.label}
              <span className="text-xs text-muted-foreground block">
                {type.description}
              </span>
            </Label>
          </div>
        ))}
      </div>
    </div>
  )
}
