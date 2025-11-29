import { Clock, Lock, Headphones } from 'lucide-react'

export function WhyChooseUs() {
  const features = [
    {
      id: 1,
      icon: Clock,
      title: 'Real-time Availability',
      description:
        'Get instant access to seat availability and live booking confirmations',
    },
    {
      id: 2,
      icon: Lock,
      title: 'Secure Payment',
      description:
        'Your transactions are protected with industry-leading encryption',
    },
    {
      id: 3,
      icon: Headphones,
      title: '24/7 Support',
      description: 'Our dedicated support team is always ready to help you',
    },
  ]

  return (
    <section id="why-us" className="py-16 md:py-24 bg-white dark:bg-slate-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Why Choose Us
          </h2>
          <p className="text-gray-600 dark:text-gray-400 text-lg max-w-2xl mx-auto">
            Experience the best bus booking platform in Vietnam
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((feature) => {
            const Icon = feature.icon
            return (
              <div
                key={feature.id}
                className="p-8 rounded-lg border border-border hover:shadow-lg hover:border-primary/20 transition-all text-center"
              >
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-6">
                  <Icon className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-3">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
