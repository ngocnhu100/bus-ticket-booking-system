import {
  LayoutDashboard,
  Route,
  Bus,
  Briefcase,
  Users,
  BarChart3,
  FileText,
  Settings,
  MapPin,
  Grid3X3,
} from 'lucide-react'
import { NavLink } from '@/components/NavLink'
import { useLocation } from 'react-router-dom'

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar'

const menuItems = [
  { title: 'Overview', url: '/admin', icon: LayoutDashboard },
  { title: 'Routes', url: '/admin/routes', icon: Route },
  { title: 'Buses', url: '/admin/buses', icon: Bus },
  { title: 'Seat Maps', url: '/admin/seat-maps', icon: Grid3X3 },
  { title: 'Trips', url: '/admin/trips', icon: MapPin },
  { title: 'Operators', url: '/admin/operators', icon: Briefcase },
  { title: 'Users', url: '/admin/users', icon: Users },
  { title: 'Analytics', url: '/admin/analytics', icon: BarChart3 },
  { title: 'Reports', url: '/admin/reports', icon: FileText },
  { title: 'Settings', url: '/admin/settings', icon: Settings },
]

export function AppSidebar() {
  const { open } = useSidebar()
  const location = useLocation()

  const isActive = (path: string) => {
    if (path === '/admin') {
      return location.pathname === '/admin'
    }
    return location.pathname.startsWith(path)
  }

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <div className="px-4 py-6">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
              <Bus className="h-6 w-6 text-primary-foreground" />
            </div>
            {open && (
              <div>
                <h2 className="text-lg font-semibold text-sidebar-foreground">
                  Logo
                </h2>
                <p className="text-xs text-sidebar-foreground/70">
                  Admin Panel
                </p>
              </div>
            )}
          </div>
        </div>

        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/70">
            MENU
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.url)}
                    className="hover:bg-sidebar-accent"
                  >
                    <NavLink to={item.url} end={item.url === '/admin'}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}
