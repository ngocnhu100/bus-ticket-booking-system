// src/components/admin/DashboardLayout.tsx
import React from 'react'
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/admin/AppSidebar'
import { ThemeToggle } from '@/components/ThemeToggle'
import { Button } from '@/components/ui/button'
import { LogOut } from 'lucide-react'
import { useAuth } from '@/context/AuthContext' // ← Quan trọng: lấy user + logout

interface DashboardLayoutProps {
  children: React.ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user, logout } = useAuth() // ← Lấy user và hàm logout từ context

  // Fallback nếu chưa load xong
  const displayName = user?.fullName || 'Admin'
  const displayEmail = user?.email || 'admin@travel.com'
  const initials = displayName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full overflow-hidden bg-background">
        {/* Sidebar */}
        <AppSidebar />

        {/* Main Area */}
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Header */}
          <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 px-6">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="-ml-1" />
              <h2 className="text-xl font-semibold text-foreground">
                Admin Dashboard
              </h2>
            </div>

            <div className="flex items-center gap-3">
              <ThemeToggle />

              {/* User Info */}
              <div className="hidden sm:flex items-center gap-3 text-sm">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-semibold text-sm">
                    {initials}
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-foreground">{displayName}</p>
                    <p className="text-xs text-muted-foreground">
                      {displayEmail}
                    </p>
                  </div>
                </div>

                {/* Logout Button */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={logout} // ← Dùng logout từ context → xóa hết token + user
                  className="gap-1.5 text-muted-foreground hover:text-foreground"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="hidden sm:inline">Logout</span>
                </Button>
              </div>
            </div>
          </header>

          {/* Content */}
          <main className="flex-1 overflow-y-auto bg-muted/40 p-6">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  )
}
