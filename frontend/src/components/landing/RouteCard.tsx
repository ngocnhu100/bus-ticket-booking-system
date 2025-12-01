import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ArrowRight } from 'lucide-react'

interface RouteCardProps {
  origin: string
  destination: string
  originCode: string
  destinationCode: string
  price: number
  onClick?: () => void
}

export function RouteCard({
  origin,
  destination,
  originCode,
  destinationCode,
  price,
  onClick,
}: RouteCardProps) {
  return (
    <Card
      className="hover:shadow-lg hover:border-primary/50 transition-all cursor-pointer h-full"
      onClick={onClick}
    >
      <CardContent className="p-6 h-full flex flex-col">
        <div className="space-y-4 flex-1">
          <div className="flex items-center justify-between">
            <div className="text-center flex-1">
              <p className="text-sm text-muted-foreground mb-1">{origin}</p>
              <p className="text-xl font-bold text-foreground">{originCode}</p>
            </div>

            <div className="px-4 flex items-center justify-center">
              <ArrowRight className="w-5 h-5 text-primary" />
            </div>

            <div className="text-center flex-1">
              <p className="text-sm text-muted-foreground mb-1">
                {destination}
              </p>
              <p className="text-xl font-bold text-foreground">
                {destinationCode}
              </p>
            </div>
          </div>

          <div className="border-t pt-4 flex-1 flex flex-col justify-between">
            <div className="text-center mb-3">
              <p className="text-xs text-muted-foreground">Starting from</p>
              <p className="text-2xl font-bold text-primary">
                {price.toLocaleString()}đ
              </p>
            </div>
            <Button className="w-full" variant="outline">
              View Trips
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
