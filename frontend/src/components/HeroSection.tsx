import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Bus, Plane, Train, Car } from 'lucide-react'
import SearchForm from './SearchForm'
import bannerImage from '@/assets/banner.jpg'
import { BadgeCheck, Headphones, Gift, CreditCard } from 'lucide-react'

const features = [
  {
    icon: BadgeCheck,
    title: 'Chắc chắn có chỗ',
    description: 'Đảm bảo chỗ ngồi',
  },
  {
    icon: Headphones,
    title: 'Hỗ trợ 24/7',
    description: 'Luôn sẵn sàng hỗ trợ',
  },
  {
    icon: Gift,
    title: 'Nhiều ưu đãi',
    description: 'Khuyến mãi hấp dẫn',
  },
  {
    icon: CreditCard,
    title: 'Thanh toán đa dạng',
    description: 'Nhiều phương thức',
  },
]
const HeroSection = () => {
  return (
    <section
      className="relative min-h-[600px] py-16 bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: `url(${bannerImage})` }}
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/5 to-background/30"></div>

      {/* Content */}
      <div className="relative container mx-auto px-4">
        <Tabs defaultValue="bus" className="w-full max-w-5xl mx-auto">
          <TabsList className="grid w-full grid-cols-4 bg-background border border-border shadow-lg">
            <TabsTrigger
              value="bus"
              className="relative flex items-center justify-center gap-2"
            >
              <Bus className="h-4 w-4" />
              <span>Xe khách</span>
            </TabsTrigger>
            <TabsTrigger
              value="flight"
              className="relative flex items-center justify-center gap-2"
            >
              <Plane className="h-4 w-4" />
              <span>Máy bay</span>
              <span className="absolute top-1 right-1 text-[10px] bg-destructive text-destructive-foreground px-1.5 py-0.5 rounded font-medium">
                -30k
              </span>
            </TabsTrigger>
            <TabsTrigger
              value="train"
              className="relative flex items-center justify-center gap-2"
            >
              <Train className="h-4 w-4" />
              <span>Tàu hỏa</span>
              <span className="absolute top-1 right-1 text-[10px] bg-destructive text-destructive-foreground px-1.5 py-0.5 rounded font-medium">
                -25%
              </span>
            </TabsTrigger>
            <TabsTrigger
              value="car"
              className="relative flex items-center justify-center gap-2"
            >
              <Car className="h-4 w-4" />
              <span>Thuê xe</span>
              <span className="absolute top-1 right-1 text-[10px] bg-badge-new text-badge-new-foreground px-1.5 py-0.5 rounded font-medium">
                Mới
              </span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="bus" className="mt-6">
            <SearchForm />
          </TabsContent>
          <TabsContent value="flight" className="mt-6">
            <SearchForm />
          </TabsContent>
          <TabsContent value="train" className="mt-6">
            <SearchForm />
          </TabsContent>
          <TabsContent value="car" className="mt-6">
            <SearchForm />
          </TabsContent>
        </Tabs>
      </div>

      <section
        className="
    flex 
    justify-center 
    items-center 
    gap-16 
    w-full 
    h-16 
    px-5 
    bg-[rgba(0,0,0,0.5)] 
    absolute 
    bottom-0 
    left-0
  "
      >
        <div className="flex gap-16">
          {features.map((feature, index) => (
            <div key={index} className="flex items-center gap-3">
              <div className="bg-feature-icon-bg p-3 rounded-full">
                <feature.icon className="h-6 w-6 text-feature-icon" />
              </div>
              <div>
                <h3 className="font-semibold text-white">{feature.title}</h3>
                <p className="text-sm text-gray-300">{feature.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </section>
  )
}

export default HeroSection
