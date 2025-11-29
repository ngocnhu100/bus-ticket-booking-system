import { Header } from '@/components/landing/Header'
import { HeroSection } from '@/components/landing/HeroSection'
import { PopularRoutes } from '@/components/landing/PopularRoutes'
import { WhyChooseUs } from '@/components/landing/WhyChooseUs'
import { Footer } from '@/components/landing/Footer'

export default function Landing() {
  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      <Header />
      <main>
        <HeroSection />
        <PopularRoutes />
        <WhyChooseUs />
      </main>
      <Footer />
    </div>
  )
}
