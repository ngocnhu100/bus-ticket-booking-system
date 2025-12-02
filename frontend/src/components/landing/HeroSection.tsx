import { SearchForm } from './SearchForm'

export function HeroSection() {
  return (
    <section className="relative bg-linear-to-br from-background via-background to-primary/10 dark:to-primary/20 pt-20 md:pt-32 pb-24 md:pb-32 overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-96 h-96 bg-primary/5 rounded-full mix-blend-multiply filter blur-3xl opacity-10 dark:opacity-5"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-primary/3 rounded-full mix-blend-multiply filter blur-3xl opacity-10 dark:opacity-5"></div>
        {/* Search form highlight */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/4">
          <div className="w-[600px] h-[300px] bg-primary/5 dark:bg-primary/10 rounded-full blur-2xl opacity-30"></div>
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8 md:mb-12">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6 leading-tight">
            Find Your Perfect Bus Trip
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Book intercity bus tickets easily, securely, and at the best prices.
            Travel across Vietnam with comfort and confidence.
          </p>
        </div>

        {/* Search Form - positioned with negative margin */}
        <SearchForm />
      </div>
    </section>
  )
}
