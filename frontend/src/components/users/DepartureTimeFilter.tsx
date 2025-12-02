import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'

interface DepartureTimeFilterProps {
  selectedTimes: string[]
  onChange: (times: string[]) => void
}

const timeSlots = [
  { value: 'morning', label: 'Morning', time: '06:00 - 12:00' },
  { value: 'afternoon', label: 'Afternoon', time: '12:00 - 18:00' },
  { value: 'evening', label: 'Evening', time: '18:00 - 24:00' },
  { value: 'night', label: 'Night', time: '00:00 - 06:00' },
]

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
