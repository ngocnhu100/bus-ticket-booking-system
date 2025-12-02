import Header from '@/components/Header'
import HeroSection from '@/components/HeroSection'
import PopularRoutes from '@/components/PopularRoutes'
import RentalSection from '@/components/RentalSection'
import NewsSection from '@/components/NewsSection'
import Footer from '@/components/Footer'
import ChatButton from '@/components/ChatButton'

const HomePage = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <HeroSection />
      <PopularRoutes />
      <RentalSection />
      <NewsSection />
      <Footer />
      <ChatButton />
    </div>
  )
}

export default HomePage
