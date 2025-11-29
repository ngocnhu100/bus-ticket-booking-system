import { Separator } from '@/components/ui/separator'

export function Footer() {
  return (
    <footer className="bg-muted/50 border-t border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* About Section */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <span className="text-2xl">🚌</span>
              <h3 className="text-lg font-bold text-foreground">BusGo</h3>
            </div>
            <p className="text-muted-foreground text-sm">
              Your trusted partner for convenient and affordable intercity bus
              travel in Vietnam.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-sm font-bold mb-4 uppercase tracking-wide text-foreground">
              Quick Links
            </h4>
            <ul className="space-y-2 text-muted-foreground text-sm">
              <li>
                <a
                  href="#"
                  className="hover:text-foreground transition text-muted-foreground"
                >
                  Home
                </a>
              </li>
              <li>
                <a
                  href="#popular-routes"
                  className="hover:text-foreground transition text-muted-foreground"
                >
                  Routes
                </a>
              </li>
              <li>
                <a
                  href="#why-us"
                  className="hover:text-foreground transition text-muted-foreground"
                >
                  About Us
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="hover:text-gray-900 dark:hover:text-white transition text-gray-600 dark:text-gray-400"
                >
                  Contact
                </a>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="text-sm font-bold mb-4 uppercase tracking-wide text-gray-900 dark:text-white">
              Support
            </h4>
            <ul className="space-y-2 text-gray-600 dark:text-gray-400 text-sm">
              <li>
                <a
                  href="#"
                  className="hover:text-gray-900 dark:hover:text-white transition text-gray-600 dark:text-gray-400"
                >
                  Help Center
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="hover:text-gray-900 dark:hover:text-white transition text-gray-600 dark:text-gray-400"
                >
                  FAQ
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="hover:text-gray-900 dark:hover:text-white transition text-gray-600 dark:text-gray-400"
                >
                  Contact Us
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="hover:text-gray-900 dark:hover:text-white transition text-gray-600 dark:text-gray-400"
                >
                  Terms & Privacy
                </a>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="text-sm font-bold mb-4 uppercase tracking-wide text-foreground">
              Contact Info
            </h4>
            <ul className="space-y-2 text-muted-foreground text-sm">
              <li>Email: support@busgo.vn</li>
              <li>Phone: 1900 1234</li>
              <li>Address: Ho Chi Minh City, Vietnam</li>
              <li>Hours: 24/7</li>
            </ul>
          </div>
        </div>

        <Separator />

        <div className="mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-muted-foreground text-sm mb-4 md:mb-0">
            © 2025 BusGo. All rights reserved.
          </p>
          <div className="flex gap-6 text-muted-foreground text-sm">
            <a
              href="#"
              className="hover:text-foreground transition text-muted-foreground"
            >
              Privacy Policy
            </a>
            <a
              href="#"
              className="hover:text-foreground transition text-muted-foreground"
            >
              Terms of Service
            </a>
            <a
              href="#"
              className="hover:text-foreground transition text-muted-foreground"
            >
              Cookie Policy
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
