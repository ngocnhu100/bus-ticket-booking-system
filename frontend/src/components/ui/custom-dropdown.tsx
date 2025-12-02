import React, { useState } from 'react'
import { ChevronDown } from 'lucide-react'

interface CustomDropdownOption {
  id: string
  label: string | React.ReactNode
  displayLabel?: string | React.ReactNode
}

interface CustomDropdownProps {
  options: CustomDropdownOption[]
  value: string
  onChange: (value: string) => void
  placeholder?: string
  onOpenChange?: (open: boolean) => void
}

export const CustomDropdown = React.forwardRef<
  HTMLDivElement,
  CustomDropdownProps
>(
  (
    { options, value, onChange, placeholder = 'Select option', onOpenChange },
    ref
  ) => {
    const [isOpen, setIsOpen] = useState(false)

    const handleToggle = () => {
      const newOpen = !isOpen
      setIsOpen(newOpen)
      onOpenChange?.(newOpen)
    }

    const handleSelect = (optionId: string) => {
      onChange(optionId)
      setIsOpen(false)
      onOpenChange?.(false)
    }

    const selectedOption = options.find((opt) => opt.id === value)
    const displayContent = selectedOption
      ? selectedOption.displayLabel || selectedOption.label
      : placeholder

    return (
      <div ref={ref} className="relative">
        <button
          type="button"
          className="w-full rounded-lg px-3 py-2 text-sm text-left focus:outline-none flex items-center justify-between"
          style={{
            border: '1px solid var(--border)',
            backgroundColor: 'var(--card)',
            color: 'var(--foreground)',
            boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
          }}
          onClick={handleToggle}
          onFocus={(e) => {
            e.currentTarget.style.boxShadow =
              '0 0 0 2px color-mix(in srgb, var(--primary) 20%, transparent)'
            e.currentTarget.style.borderColor = 'var(--primary)'
          }}
          onBlur={(e) => {
            e.currentTarget.style.boxShadow = '0 1px 2px 0 rgb(0 0 0 / 0.05)'
            e.currentTarget.style.borderColor = 'var(--border)'
          }}
        >
          <span>{displayContent}</span>
          <ChevronDown
            className="w-4 h-4 transition-transform"
            style={{
              color: 'var(--muted-foreground)',
              transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            }}
          />
        </button>
        <div
          className="absolute top-full left-0 right-0 z-10 mt-1 rounded-lg shadow-lg"
          style={{
            backgroundColor: 'var(--card)',
            border: '1px solid var(--border)',
            display: isOpen ? 'block' : 'none',
          }}
        >
          {options.map((option) => (
            <button
              key={option.id}
              type="button"
              className="flex w-full px-3 py-2 text-sm text-left hover:bg-muted first:rounded-t-lg last:rounded-b-lg"
              style={{
                color: 'var(--foreground)',
              }}
              onClick={() => handleSelect(option.id)}
            >
              <span>{option.label}</span>
            </button>
          ))}
        </div>
      </div>
    )
  }
)

CustomDropdown.displayName = 'CustomDropdown'
