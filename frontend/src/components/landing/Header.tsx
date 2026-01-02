import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/button'
import { Menu, X, LogOut } from 'lucide-react'
import { useState } from 'react'
import { ThemeToggle } from '@/components/ThemeToggle'

export function Header() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white shadow-sm dark:bg-slate-950 dark:border-slate-800">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo */}
        <div
          className="flex items-center gap-2 cursor-pointer"
          onClick={() => {
            navigate('/')
            window.scrollTo({ top: 0, behavior: 'smooth' })
          }}
        >
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-lg">🚌</span>
          </div>
          <span className="text-xl font-bold text-gray-900 dark:text-white hidden sm:inline">
            BusGo
          </span>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-8">
          <button
            onClick={() => navigate('/')}
            className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white font-medium transition"
          >
            Home
          </button>
          <button
            onClick={() => {
              navigate('/')
              // Wait for navigation then scroll
              setTimeout(() => {
                document
                  .getElementById('popular-routes')
                  ?.scrollIntoView({ behavior: 'smooth' })
              }, 100)
            }}
            className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white font-medium transition"
          >
            Routes
          </button>
          <button
            onClick={() => {
              navigate('/booking-lookup')
              window.scrollTo({ top: 0, behavior: 'smooth' })
            }}
            className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white font-medium transition"
          >
            Track Booking
          </button>
          <button
            onClick={() => {
              navigate('/')
              // Wait for navigation then scroll
              setTimeout(() => {
                document
                  .getElementById('why-us')
                  ?.scrollIntoView({ behavior: 'smooth' })
              }, 100)
            }}
            className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white font-medium transition"
          >
            About
          </button>
          <button
            onClick={() => {
              navigate('/')
              setTimeout(() => {
                document
                  .getElementById('footer-contact')
                  ?.scrollIntoView({ behavior: 'smooth' })
              }, 100)
            }}
            className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white font-medium transition"
          >
            Support
          </button>
        </div>

        {/* Auth Buttons */}
        <div className="hidden md:flex items-center gap-4">
          <ThemeToggle />
          {user ? (
            <>
              <div className="text-sm text-gray-600 dark:text-gray-300">
                {user.email}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  user.role === 'admin'
                    ? navigate('/admin')
                    : navigate('/dashboard')
                }
              >
                Dashboard
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </Button>
            </>
          ) : (
            <Button
              variant="default"
              size="sm"
              onClick={() => navigate('/login')}
            >
              Login
            </Button>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden p-2"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? (
            <X className="w-6 h-6" />
          ) : (
            <Menu className="w-6 h-6" />
          )}
        </button>
      </nav>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t bg-white dark:bg-slate-950 dark:border-slate-800">
          <div className="px-4 py-4 space-y-3">
            <button
              onClick={() => {
                navigate('/')
                setIsMobileMenuOpen(false)
              }}
              className="block w-full text-left text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white font-medium py-2"
            >
              Home
            </button>
            <button
              onClick={() => {
                navigate('/')
                setIsMobileMenuOpen(false)
                setTimeout(() => {
                  document
                    .getElementById('popular-routes')
                    ?.scrollIntoView({ behavior: 'smooth' })
                }, 100)
              }}
              className="block w-full text-left text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white font-medium py-2"
            >
              Routes
            </button>
            <button
              onClick={() => {
                navigate('/booking-lookup')
                setIsMobileMenuOpen(false)
                window.scrollTo({ top: 0, behavior: 'smooth' })
              }}
              className="block w-full text-left text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white font-medium py-2"
            >
              Track Booking
            </button>
            <button
              onClick={() => {
                navigate('/')
                setIsMobileMenuOpen(false)
                setTimeout(() => {
                  document
                    .getElementById('why-us')
                    ?.scrollIntoView({ behavior: 'smooth' })
                }, 100)
              }}
              className="block w-full text-left text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white font-medium py-2"
            >
              About
            </button>
            <button
              onClick={() => {
                navigate('/')
                setIsMobileMenuOpen(false)
                setTimeout(() => {
                  document
                    .getElementById('footer-contact')
                    ?.scrollIntoView({ behavior: 'smooth' })
                }, 100)
              }}
              className="block w-full text-left text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white font-medium py-2"
            >
              Support
            </button>
            <div className="pt-4 border-t space-y-2">
              <div className="py-2">
                <ThemeToggle />
              </div>
              {user ? (
                <>
                  <div className="text-sm text-gray-600 dark:text-gray-300 py-2">
                    {user.email}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => navigate('/dashboard')}
                  >
                    Dashboard
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full flex items-center gap-2"
                    onClick={handleLogout}
                  >
                    <LogOut className="w-4 h-4" />
                    Logout
                  </Button>
                </>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => navigate('/login')}
                >
                  Login
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
