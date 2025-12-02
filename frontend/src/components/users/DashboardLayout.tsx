import type { ReactNode } from 'react'
import { NavLink } from '@/components/NavLink'
import { Button } from '@/components/ui/button'
import { Calendar, History, User, CreditCard, Bell, LogOut } from 'lucide-react'
import { ThemeToggle } from '@/components/ThemeToggle'
import { useAuth } from '@/context/AuthContext'

interface DashboardLayoutProps {
  children: ReactNode
}

const navigation = [
  { name: 'Upcoming', icon: Calendar, path: '/dashboard' },
  { name: 'History', icon: History, path: '/dashboard/history' },
  { name: 'Profile', icon: User, path: '/dashboard/profile' },
  { name: 'Payments', icon: CreditCard, path: '/dashboard/payments' },
  { name: 'Notifications', icon: Bell, path: '/dashboard/notifications' },
]

export const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const { logout, user } = useAuth()
  const displayName = user?.fullName || 'Guest'
  const displayEmail = user?.email || 'guest@example.com'
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 h-[var(--header-height)] bg-card border-b border-border z-50">
        <div className="h-full px-6 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-lg">
                T
              </span>
            </div>
            <span className="text-xl font-bold">TravelDash</span>
          </div>

          {/* User + Theme + Logout */}
          <div className="flex items-center gap-4">
            <ThemeToggle />

            <div className="text-right">
              <p className="text-sm font-medium">{displayName}</p>
              <p className="text-xs text-muted-foreground">{displayEmail}</p>
            </div>

            <Button
              variant="ghost"
              size="sm"
              className="gap-2"
              onClick={logout}
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Page layout */}
      <div className="flex pt-[var(--header-height)]">
        {/* Sidebar */}
        <aside className="fixed left-0 bottom-0 top-[var(--header-height)] w-[var(--sidebar-width)] bg-card border-r border-border">
          <nav className="p-4 space-y-2">
            <p className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
              Navigation
            </p>

            {navigation.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
                activeClassName="bg-primary/10 text-primary hover:bg-primary/15 hover:text-primary font-medium"
              >
                <item.icon className="w-5 h-5" />
                <span>{item.name}</span>
              </NavLink>
            ))}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 ml-[var(--sidebar-width)] p-6">{children}</main>
      </div>
    </div>
  )
}
