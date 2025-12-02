import { Toaster as Sonner } from '@/components/ui/sonner'
import { Toaster } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import Dashboard from './pages/users/Dashboard'
// import { DashboardLayout } from '@/components/users/DashboardLayout'
// import Dashboard from './pages/users/Dashboard'
import Login from './pages/Login'
import Register from './pages/Register'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import VerifyEmail from './pages/VerifyEmail'
import AuthGoogleCallback from './pages/AuthGoogleCallback'
import { ThemeProvider } from 'next-themes'
import History from './pages/users/History'
import Profile from './pages/users/Profile'
import Payments from './pages/users/Payments'
import Notifications from './pages/users/Notifications'
import { AuthProvider } from '@/context/AuthContext'
import { PassengerRoute, AdminRoute } from '@/components/ProtectedRoute'
import AdminDashboard from '@/pages/admin/Dashboard'
import HomePage from './pages/HomePage'

const queryClient = new QueryClient()

function ThemeProviderWithSuppress({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system" // mặc định theo hệ thống
      enableSystem // bật hệ thống
      disableTransitionOnChange // cái này loại bỏ animation flash cực mượt
    >
      {children}
    </ThemeProvider>
  )
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <AuthProvider>
        {' '}
        {/* Wrap ở đây */}
        <ThemeProviderWithSuppress>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<HomePage />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/verify-email" element={<VerifyEmail />} />
              <Route
                path="/auth/google/callback"
                element={<AuthGoogleCallback />}
              />

              {/* Passenger routes - protected */}
              <Route element={<PassengerRoute />}>
                <Route path="/dashboard" element={<Dashboard />} />{' '}
                {/* Passenger Dashboard */}
                <Route path="/dashboard/history" element={<History />} />
                <Route path="/dashboard/profile" element={<Profile />} />
                <Route path="/dashboard/payments" element={<Payments />} />
                <Route
                  path="/dashboard/notifications"
                  element={<Notifications />}
                />
              </Route>

              {/* Admin routes - protected */}
              <Route element={<AdminRoute />}>
                <Route path="/admin" element={<AdminDashboard />} />{' '}
                {/* Admin Dashboard */}
                {/* Add thêm admin sub-routes nếu có, e.g. /admin/users, /admin/bookings */}
              </Route>

              <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
          </TooltipProvider>
        </ThemeProviderWithSuppress>
      </AuthProvider>
    </BrowserRouter>
  </QueryClientProvider>
)

export default App
