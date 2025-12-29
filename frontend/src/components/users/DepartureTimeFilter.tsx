import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { timeSlots } from '@/constants/filterConstants'

interface DepartureTimeFilterProps {
  selectedTimes: string[]
  onChange: (times: string[]) => void
}

export const DepartureTimeFilter = ({
  selectedTimes,
  onChange,
}: DepartureTimeFilterProps) => {
  const handleToggle = (value: string) => {
    if (selectedTimes.includes(value)) {
      onChange(selectedTimes.filter((time) => time !== value))
    } else {
      onChange([...selectedTimes, value])
    }
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-foreground">Departure Time</h3>
      <div className="space-y-2">
        {timeSlots.map((slot) => (
          <div key={slot.value} className="flex items-center space-x-2">
            <Checkbox
              id={`time-${slot.value}`}
              checked={selectedTimes.includes(slot.value)}
              onCheckedChange={() => handleToggle(slot.value)}
            />
            <Label
              htmlFor={`time-${slot.value}`}
              className="text-sm font-normal cursor-pointer"
            >
              {slot.label}{' '}
              <span className="text-muted-foreground">({slot.time})</span>
            </Label>
          </div>
        ))}
      </div>
    </div>
  )
}
