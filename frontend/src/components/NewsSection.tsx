import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const newsItems = [
  {
    title: 'Chương trình tích điểm đổi quà tại Vexere',
    description: 'Tích điểm và nhận nhiều ưu đãi hấp dẫn',
  },
  {
    title:
      '[Phóng sự HTV9] Vexere và công cuộc cách mạng hoá ngành vận tải hành khách',
    description: 'Vexere được ghi nhận trong phóng sự của HTV9',
  },
  {
    title:
      '[Phóng sự VTV9] Đặt dịch vụ xe khách nhanh chóng, tiện lợi, nhiều ưu đãi tại Vexere',
    description: 'Trải nghiệm đặt vé dễ dàng và tiện lợi',
  },
]

const NewsSection = () => {
  return (
    <section className="py-12 bg-background">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold mb-2">Tin tức</h2>
        <p className="text-muted-foreground mb-8">
          Cập nhật tin tức mới nhất từ Vexere
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {newsItems.map((item, index) => (
            <Card
              key={index}
              className="hover:shadow-lg transition-shadow cursor-pointer"
            >
              <CardHeader>
                <div className="h-48 bg-gradient-to-br from-primary/20 to-accent/20 rounded-md mb-4 flex items-center justify-center">
                  <p className="text-4xl">📰</p>
                </div>
                <CardTitle className="text-base line-clamp-2">
                  {item.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {item.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}

export default NewsSection
