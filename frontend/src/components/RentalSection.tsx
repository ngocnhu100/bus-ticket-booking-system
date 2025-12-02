import { Card, CardContent } from '@/components/ui/card'

const rentalItems = [
  { title: 'Thuê xe máy tại Vũng Tàu', price: 'từ 110K', location: 'VŨNG TÀU' },
  {
    title: 'Thuê xe máy Phan Thiết - Mũi Né',
    price: 'từ 130K',
    location: 'PHAN THIẾT',
  },
  { title: 'Thuê xe máy tại Sapa', price: 'từ 100K', location: 'SAPA' },
  {
    title: 'Thuê xe Sài Gòn đi Tây Ninh',
    price: 'từ 1.300.000đ/chiếu',
    location: 'Sài Gòn > Tây Ninh',
  },
  {
    title: 'Thuê xe Sài Gòn đi Long Hải',
    price: 'từ 1.000.000đ/chiếu',
    location: 'Sài Gòn > Long Hải',
  },
  {
    title: 'Thuê xe Sài Gòn đi Đồng Nai',
    price: 'từ 500.000đ/chiếu',
    location: 'Sài Gòn > Đồng Nai',
  },
]

const RentalSection = () => {
  return (
    <section className="py-12 bg-muted/30">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold mb-2">Thuê xe</h2>
        <p className="text-muted-foreground mb-8">
          Dịch vụ cho thuê xe máy và xe du lịch
        </p>

        <div className="mb-12">
          <h3 className="text-2xl font-semibold mb-6">Thuê xe máy</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {rentalItems.slice(0, 3).map((item, index) => (
              <Card
                key={index}
                className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
              >
                <div className="h-48 bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                  <div className="text-center">
                    <p className="text-sm font-medium text-primary">
                      {item.location}
                    </p>
                    <p className="text-3xl font-bold text-accent mt-2">
                      {item.price}
                    </p>
                  </div>
                </div>
                <CardContent className="pt-4">
                  <h4 className="font-semibold">{item.title}</h4>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-2xl font-semibold mb-6">Thuê xe du lịch</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {rentalItems.slice(3, 6).map((item, index) => (
              <Card
                key={index}
                className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
              >
                <div className="h-48 bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                  <div className="text-center">
                    <p className="text-sm font-medium text-primary">
                      {item.location}
                    </p>
                    <p className="text-2xl font-bold text-accent mt-2">
                      {item.price}
                    </p>
                  </div>
                </div>
                <CardContent className="pt-4">
                  <h4 className="font-semibold">{item.title}</h4>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

export default RentalSection
