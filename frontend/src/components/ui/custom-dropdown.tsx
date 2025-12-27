import React, { useState, useEffect } from 'react'
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
  disabled?: boolean
  className?: string
}

export const CustomDropdown = React.forwardRef<
  HTMLDivElement,
  CustomDropdownProps
>(
  (
    {
      options,
      value,
      onChange,
      placeholder = 'Select option',
      onOpenChange,
      disabled = false,
      className,
    },
    ref
  ) => {
    const [isOpen, setIsOpen] = useState(false)
    const [dropdownPosition, setDropdownPosition] = useState({
      top: 0,
      left: 0,
      width: 0,
    })
    const buttonRef = React.useRef<HTMLButtonElement>(null)
    // Close dropdown on scroll or resize
    useEffect(() => {
      if (!isOpen) return

      const handleClose = () => {
        setIsOpen(false)
        onOpenChange?.(false)
      }

      const handleScroll = () => handleClose()
      const handleResize = () => handleClose()

      window.addEventListener('scroll', handleScroll, true)
      window.addEventListener('resize', handleResize)

      return () => {
        window.removeEventListener('scroll', handleScroll, true)
        window.removeEventListener('resize', handleResize)
      }
    }, [isOpen, onOpenChange])

    const handleToggle = () => {
      if (disabled) return

      if (!isOpen && buttonRef.current) {
        // Calculate position before opening
        const rect = buttonRef.current.getBoundingClientRect()
        setDropdownPosition({
          top: rect.bottom + window.scrollY,
          left: rect.left + window.scrollX,
          width: rect.width,
        })
      }

      const newOpen = !isOpen
      setIsOpen(newOpen)
      onOpenChange?.(newOpen)
    }

    const handleSelect = (optionId: string) => {
      if (disabled) return
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
          ref={buttonRef}
          type="button"
          disabled={disabled}
          className={`w-full rounded-lg px-3 py-2 text-sm text-left focus:outline-none flex items-center justify-between ${className || ''}`}
          style={{
            border: '1px solid var(--border)',
            backgroundColor: disabled ? 'var(--muted)' : 'var(--card)',
            color: disabled ? 'var(--muted-foreground)' : 'var(--foreground)',
            boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
            cursor: disabled ? 'not-allowed' : 'pointer',
          }}
          onClick={handleToggle}
          onFocus={(e) => {
            if (disabled) return
            e.currentTarget.style.boxShadow =
              '0 0 0 2px color-mix(in srgb, var(--primary) 20%, transparent)'
            e.currentTarget.style.borderColor = 'var(--primary)'
          }}
          onBlur={(e) => {
            if (disabled) return
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

        {/* Overlay to handle outside clicks */}
        {isOpen && (
          <div
            className="fixed inset-0 z-40"
            onClick={() => {
              setIsOpen(false)
              onOpenChange?.(false)
            }}
          />
        )}

        <div
          className="fixed z-50 mt-1 rounded-lg shadow-lg"
          style={{
            backgroundColor: 'var(--card)',
            border: '1px solid var(--border)',
            display: isOpen ? 'block' : 'none',
            top: `${dropdownPosition.top}px`,
            left: `${dropdownPosition.left}px`,
            minWidth: `${dropdownPosition.width}px`,
            width: 'auto',
            maxWidth: '300px',
            maxHeight: '200px',
            overflowY: 'auto',
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
