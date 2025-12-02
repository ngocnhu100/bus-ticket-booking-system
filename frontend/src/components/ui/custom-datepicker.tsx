import React from 'react'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import '@/styles/datepicker.css'
import { Calendar } from 'lucide-react'

interface CustomDatePickerProps {
  selected: Date | null
  onChange: (date: Date | null) => void
  placeholderText?: string
  dateFormat?: string
  required?: boolean
  className?: string
}

export const CustomDatePicker: React.FC<CustomDatePickerProps> = ({
  selected,
  onChange,
  placeholderText = 'Select date',
  dateFormat = 'yyyy-MM-dd',
  required = false,
  className = '',
}) => {
  return (
    <div className={`relative ${className}`}>
      <DatePicker
        selected={selected}
        onChange={onChange}
        dateFormat={dateFormat}
        placeholderText={placeholderText}
        className="w-full h-10 px-3 py-2 text-sm focus:outline-none focus:ring-2 border border-border rounded-lg bg-card text-foreground"
        wrapperClassName="w-full"
        calendarClassName="!shadow-xl !bg-[var(--card)]"
        dayClassName={(date) => {
          const today = new Date()
          today.setHours(0, 0, 0, 0)
          const isToday = date.getTime() === today.getTime()
          const isSelected = selected && date.getTime() === selected.getTime()

          let classes =
            'cursor-pointer hover:bg-muted hover:text-foreground transition-colors'

          if (isSelected) {
            classes +=
              ' bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground font-bold'
          } else if (isToday) {
            classes += ' font-bold ring-2 ring-primary/50'
          }

          return classes
        }}
        required={required}
      />
      <Calendar
        className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4"
        style={{ color: 'var(--muted-foreground)' }}
      />
    </div>
  )
}
