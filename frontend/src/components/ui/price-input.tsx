import React, { useState, useRef } from 'react'

interface PriceInputProps {
  value: number | string
  onChange: (value: number) => void
  placeholder?: string
  className?: string
  disabled?: boolean
  min?: number
  max?: number
}

export const PriceInput: React.FC<PriceInputProps> = ({
  value,
  onChange,
  placeholder = 'Enter price',
  className = '',
  disabled = false,
  min,
  max,
}) => {
  // Use ref to track if we're currently focused (editing mode)
  const isEditingRef = useRef(false)

  // Format number with thousand separators
  const formatNumber = (num: number): string => {
    return num.toLocaleString('en-US')
  }

  // Parse display value to number
  const parseNumber = (str: string): number => {
    // Remove all non-digit characters except decimal point
    const cleanStr = str.replace(/[^\d.]/g, '')
    const num = parseFloat(cleanStr) || 0
    return num
  }

  // Compute the current display value
  const getCurrentDisplayValue = React.useCallback((): string => {
    if (isEditingRef.current) {
      // When editing, show raw number for easier input
      const numValue =
        typeof value === 'number' ? value : parseNumber(value?.toString() || '')
      return numValue.toString()
    } else {
      // When not editing, show formatted number
      const numValue =
        typeof value === 'number' ? value : parseNumber(value?.toString() || '')
      return numValue > 0 ? formatNumber(numValue) : ''
    }
  }, [value])

  const [displayValue, setDisplayValue] = useState('')

  // Update display value when value prop changes (only when not editing)
  React.useEffect(() => {
    if (!isEditingRef.current) {
      setDisplayValue(getCurrentDisplayValue())
    }
  }, [value, getCurrentDisplayValue])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value

    // Allow empty input
    if (inputValue === '') {
      setDisplayValue('')
      onChange(0)
      return
    }

    // Remove leading zeros and format
    const numericValue = parseNumber(inputValue)

    // Validate min/max if provided
    if (min !== undefined && numericValue < min) {
      return
    }
    if (max !== undefined && numericValue > max) {
      return
    }

    // Update display with current input (no formatting during typing)
    setDisplayValue(inputValue.replace(/[^\d.]/g, ''))

    // Call onChange with numeric value
    onChange(numericValue)
  }

  const handleFocus = () => {
    isEditingRef.current = true
    // Switch to raw number format for editing, but show empty if value is 0
    const numValue =
      typeof value === 'number' ? value : parseNumber(value?.toString() || '')
    setDisplayValue(numValue === 0 ? '' : numValue.toString())
  }

  const handleBlur = () => {
    isEditingRef.current = false
    // Format the value with thousand separators
    const numValue =
      typeof value === 'number' ? value : parseNumber(displayValue)
    setDisplayValue(numValue > 0 ? formatNumber(numValue) : '')
  }

  return (
    <input
      type="text"
      value={displayValue}
      onChange={handleInputChange}
      onFocus={handleFocus}
      onBlur={handleBlur}
      placeholder={placeholder}
      disabled={disabled}
      className={`w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
    />
  )
}
