import { Card, CardContent } from '@/components/ui/card'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel'

const routes = [
  {
    route: 'Sài Gòn - Nha Trang',
    price: 'Từ 200.000đ',
    image:
      'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=400&h=250&fit=crop',
  },
  {
    route: 'Hà Nội - Hải Phòng',
    price: 'Từ 90.000đ',
    image:
      'https://images.unsplash.com/photo-1559628376-f3fe5f782a2e?w=400&h=250&fit=crop',
  },
  {
    route: 'Sài Gòn - Phan Thiết',
    price: 'Từ 150.000đ',
    image:
      'https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=400&h=250&fit=crop',
  },
  {
    route: 'Sài Gòn - Phan Rang',
    price: 'Từ 175.000đ',
    image:
      'https://images.unsplash.com/photo-1598948485421-33a1655d3c18?w=400&h=250&fit=crop',
  },
  {
    route: 'Sài Gòn - Đà Lạt',
    price: 'Từ 180.000đ',
    image:
      'https://images.unsplash.com/photo-1587474260584-136574528ed5?w=400&h=250&fit=crop',
  },
]

const PopularRoutes = () => {
  return (
    <section className="py-12 bg-background">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold mb-8 text-foreground">
          Tuyến đường phổ biến
        </h2>

        <Carousel
          opts={{
            align: 'start',
            loop: true,
          }}
          className="w-full"
        >
          <CarouselContent className="-ml-2 md:-ml-4">
            {routes.map((route, index) => (
              <CarouselItem
                key={index}
                className="pl-2 md:pl-4 md:basis-1/2 lg:basis-1/3 xl:basis-1/4"
              >
                <Card className="overflow-hidden cursor-pointer transition-all hover:shadow-lg group">
                  <CardContent className="p-0">
                    <div className="relative h-40 overflow-hidden">
                      <img
                        src={route.image}
                        alt={route.route}
                        className="w-full h-full object-cover transition-transform group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                      <div className="absolute bottom-3 left-3 right-3 text-white">
                        <h3 className="font-bold text-lg mb-1">
                          {route.route}
                        </h3>
                        <p className="text-sm font-semibold text-accent">
                          {route.price}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="hidden md:flex" />
          <CarouselNext className="hidden md:flex" />
        </Carousel>
      </div>
    </section>
  )
}

export default PopularRoutes
