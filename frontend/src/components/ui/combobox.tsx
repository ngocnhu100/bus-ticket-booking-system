import * as React from 'react'
import { ChevronDown, MapPin, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

interface ComboboxProps {
  options: string[]
  value?: string
  onValueChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
}

export function Combobox({
  options,
  value,
  onValueChange,
  placeholder = 'Select city...',
  disabled = false,
}: ComboboxProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const [searchTerm, setSearchTerm] = React.useState('')
  const [inputValue, setInputValue] = React.useState(value || '')
  const containerRef = React.useRef<HTMLDivElement>(null)

  const filteredOptions = options.filter((option) =>
    option.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleSelect = (option: string) => {
    setInputValue(option)
    onValueChange(option)
    setIsOpen(false)
    setSearchTerm('')
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setInputValue(newValue)
    setSearchTerm(newValue)
    onValueChange(newValue)
    setIsOpen(true)
  }

  const handleClear = () => {
    setInputValue('')
    setSearchTerm('')
    onValueChange('')
  }

  React.useEffect(() => {
    setInputValue(value || '')
  }, [value])

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="relative" ref={containerRef}>
      <div className="relative">
        <Input
          value={inputValue}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          className="h-12 pl-10 pr-10"
          disabled={disabled}
        />
        <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        {inputValue && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-8 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="w-4 h-4" />
          </button>
        )}
        <ChevronDown
          className={cn(
            'absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground transition-transform duration-200',
            isOpen && 'rotate-180'
          )}
        />
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-background border border-border rounded-md shadow-lg max-h-60 overflow-auto">
          {filteredOptions.length === 0 ? (
            <div className="px-3 py-2 text-sm text-muted-foreground">
              No cities found
            </div>
          ) : (
            filteredOptions.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => handleSelect(option)}
                className={cn(
                  'w-full px-3 py-2 text-left hover:bg-accent hover:text-accent-foreground flex items-center gap-2',
                  value === option && 'bg-accent text-accent-foreground'
                )}
              >
                <MapPin className="w-4 h-4 text-muted-foreground" />
                {option}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  )
}
