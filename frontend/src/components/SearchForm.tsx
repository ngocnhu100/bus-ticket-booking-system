import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MapPin, Calendar, ArrowLeftRight } from 'lucide-react'
import { LocationAutocomplete } from '@/components/ui/location-autocomplete'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { format } from 'date-fns'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import '@/styles/datepicker.css'

const SearchForm = () => {
  const navigate = useNavigate()
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [date, setDate] = useState<Date | null>(null)

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()

    if (!from || !to || !date) {
      return
    }

    const searchParams = new URLSearchParams({
      origin: from,
      destination: to,
      date: format(date, 'yyyy-MM-dd'),
      passengers: '1',
    })

    navigate(`/trip-search-results?${searchParams.toString()}`)
  }

  const handleSwap = () => {
    const temp = from
    setFrom(to)
    setTo(temp)
  }

  return (
    <Card className="p-6 bg-card/95 backdrop-blur-sm">
      <form onSubmit={handleSearch}>
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
          {/* Departure */}
          <div className="md:col-span-3">
            <label className="text-sm font-medium mb-2 block text-card-foreground">
              <MapPin className="inline h-4 w-4 mr-1 text-primary" />
              Nơi xuất phát
            </label>
            <LocationAutocomplete
              value={from}
              onValueChange={setFrom}
              placeholder="Nhập điểm đi (vd: ha noi)"
              type="origin"
            />
          </div>

          {/* Swap Button */}
          <div className="md:col-span-1 flex justify-center">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={handleSwap}
              className="rounded-full bg-primary/10 hover:bg-primary/20 h-10 w-10"
            >
              <ArrowLeftRight className="h-4 w-4 text-primary" />
            </Button>
          </div>

          {/* Destination */}
          <div className="md:col-span-3">
            <label className="text-sm font-medium mb-2 block text-card-foreground">
              <MapPin className="inline h-4 w-4 mr-1 text-destructive" />
              Nơi đến
            </label>
            <LocationAutocomplete
              value={to}
              onValueChange={setTo}
              placeholder="Nhập điểm đến (vd: da lat)"
              type="destination"
            />
          </div>

          {/* Date */}
          <div className="md:col-span-2">
            <label className="text-sm font-medium mb-2 block text-card-foreground">
              <Calendar className="inline h-4 w-4 mr-1 text-primary" />
              Ngày đi
            </label>
            <div className="relative">
              <DatePicker
                selected={date}
                onChange={(date) => setDate(date)}
                minDate={new Date()}
                dateFormat="dd/MM/yyyy"
                placeholderText="Chọn ngày"
                className="w-full h-12 px-3 py-2 pr-10 text-base bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                wrapperClassName="w-full"
              />
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault()
                  const input =
                    e.currentTarget.previousElementSibling?.querySelector(
                      'input'
                    )
                  if (input) input.focus()
                }}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors focus:outline-none p-0.5"
              >
                <Calendar className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Return Date (Optional) - Disabled for now */}
          <div className="md:col-span-2">
            <Button
              variant="link"
              className="text-sm mb-2 p-0 h-auto text-primary"
              disabled
            >
              Thêm ngày về
            </Button>
            <div className="h-12 px-3 py-2 text-base bg-muted border border-input rounded-md flex items-center text-muted-foreground">
              Chưa hỗ trợ
            </div>
          </div>

          {/* Search Button */}
          <div className="md:col-span-1">
            <Button
              type="submit"
              className="w-full h-12 bg-accent hover:bg-accent/90 text-accent-foreground font-semibold"
              disabled={!from || !to || !date}
            >
              Tìm kiếm
            </Button>
          </div>
        </div>

        <p className="text-xs text-muted-foreground mt-4">
          * <strong>Lưu ý:</strong> Có thể gõ không dấu (vd: "ha noi" tìm được
          "Hà Nội")
        </p>
      </form>
    </Card>
  )
}

export default SearchForm
