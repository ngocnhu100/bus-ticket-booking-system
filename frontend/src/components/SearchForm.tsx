import { MapPin, Calendar, ArrowLeftRight } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

const SearchForm = () => {
  return (
    <Card className="p-6 bg-card/95 backdrop-blur-sm">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
        {/* Departure */}
        <div className="md:col-span-3">
          <label className="text-sm font-medium mb-2 block text-card-foreground">
            <MapPin className="inline h-4 w-4 mr-1 text-primary" />
            Nơi xuất phát
          </label>
          <Input placeholder="Chọn điểm đi" className="h-12" />
        </div>

        {/* Swap Button */}
        <div className="md:col-span-1 flex justify-center">
          <Button
            variant="ghost"
            size="icon"
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
          <Input placeholder="Chọn điểm đến" className="h-12" />
        </div>

        {/* Date */}
        <div className="md:col-span-2">
          <label className="text-sm font-medium mb-2 block text-card-foreground">
            <Calendar className="inline h-4 w-4 mr-1 text-primary" />
            Ngày đi
          </label>
          <Input type="date" className="h-12" />
        </div>

        {/* Return Date (Optional) */}
        <div className="md:col-span-2">
          <Button
            variant="link"
            className="text-sm mb-2 p-0 h-auto text-primary"
          >
            Thêm ngày về
          </Button>
          <Input type="date" className="h-12" disabled />
        </div>

        {/* Search Button */}
        <div className="md:col-span-1">
          <Button className="w-full h-12 bg-accent hover:bg-accent/90 text-accent-foreground font-semibold">
            Tìm kiếm
          </Button>
        </div>
      </div>

      <p className="text-xs text-muted-foreground mt-4">
        * <strong>Lưu ý:</strong> Sử dụng tên địa phương trước sáp nhập
      </p>
    </Card>
  )
}

export default SearchForm
