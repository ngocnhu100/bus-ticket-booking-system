import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Input } from '@/components/ui/input'

interface PriceRangeFilterProps {
  minPrice: number
  maxPrice: number
  onChange: (min: number, max: number) => void
  min?: number
  max?: number
}

export const PriceRangeFilter = ({
  minPrice,
  maxPrice,
  onChange,
  min = 0,
  max = 1000000,
}: PriceRangeFilterProps) => {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      maximumFractionDigits: 0,
    }).format(price)
  }

  const handleSliderChange = (values: number[]) => {
    onChange(values[0], values[1])
  }

  const handleMinInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value) || min
    if (value <= maxPrice) {
      onChange(value, maxPrice)
    }
  }

  const handleMaxInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value) || max
    if (value >= minPrice) {
      onChange(minPrice, value)
    }
  }

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-foreground">Price Range</h3>
      <div className="space-y-4">
        <Slider
          value={[minPrice, maxPrice]}
          onValueChange={handleSliderChange}
          min={min}
          max={max}
          step={10000}
          className="w-full"
        />
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <Label
              htmlFor="min-price"
              className="text-xs text-muted-foreground"
            >
              Min
            </Label>
            <Input
              id="min-price"
              type="number"
              value={minPrice}
              onChange={handleMinInputChange}
              min={min}
              max={maxPrice}
              className="mt-1"
            />
          </div>
          <div className="flex-1">
            <Label
              htmlFor="max-price"
              className="text-xs text-muted-foreground"
            >
              Max
            </Label>
            <Input
              id="max-price"
              type="number"
              value={maxPrice}
              onChange={handleMaxInputChange}
              min={minPrice}
              max={max}
              className="mt-1"
            />
          </div>
        </div>
        <div className="text-sm text-muted-foreground text-center">
          {formatPrice(minPrice)} - {formatPrice(maxPrice)}
        </div>
      </div>
    </div>
  )
}
