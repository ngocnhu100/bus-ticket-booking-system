import { Toaster as Sonner } from '@/components/ui/sonner'
import { Toaster } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import Dashboard from './pages/users/Dashboard'
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
import TripSearch from './pages/users/TripSearch'
import { AuthProvider } from '@/context/AuthContext'
import { PassengerRoute, AdminRoute } from '@/components/ProtectedRoute'
import AdminDashboard from '@/pages/admin/Dashboard'
import AdminTripScheduling from '@/pages/admin/AdminTripScheduling'
import AdminRouteManagement from '@/pages/admin/AdminRouteManagement'
import AdminBusManagement from '@/pages/admin/AdminBusManagement'
import AdminSeatMapManagement from '@/pages/admin/AdminSeatMapManagement'
import AdminOperatorManagement from '@/pages/admin/AdminOperatorManagement'
import Landing from './pages/Landing'
import TripSearchResults from './pages/TripSearchResults'
import { SeatSelection } from './pages/users/SeatSelection'
import { BookingConfirmation } from './pages/BookingConfirmation'
import { BookingLookup } from './pages/BookingLookup'
import { BookingReview } from './pages/BookingReview'
import ETicketPreview from './pages/ETicketPreview'

const queryClient = new QueryClient()

function ThemeProviderWithSuppress({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system" // default to system theme
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
              <Route path="/" element={<Landing />} />
              <Route
                path="/trip-search-results"
                element={<TripSearchResults />}
              />
              <Route path="/booking-lookup" element={<BookingLookup />} />
              <Route
                path="/booking-confirmation/:bookingReference"
                element={<BookingConfirmation />}
              />
              <Route path="/e-ticket-preview" element={<ETicketPreview />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/verify-email" element={<VerifyEmail />} />
              <Route
                path="/auth/google/callback"
                element={<AuthGoogleCallback />}
              />
              {/* Seat selection - accessible to both guests and authenticated users */}
              <Route
                path="/booking/:tripId/seats"
                element={<SeatSelection />}
              />
              {/* Booking review/payment - accessible to both guests and authenticated users */}
              <Route
                path="/booking/:bookingId/review"
                element={<BookingReview />}
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
                <Route path="/trips/search" element={<TripSearch />} />
              </Route>

              {/* Admin routes - protected */}
              <Route element={<AdminRoute />}>
                <Route path="/admin" element={<AdminDashboard />} />{' '}
                {/* Admin Dashboard */}
                <Route
                  path="/admin/trips"
                  element={<AdminTripScheduling />}
                />{' '}
                {/* Trip Scheduling */}
                <Route
                  path="/admin/routes"
                  element={<AdminRouteManagement />}
                />{' '}
                {/* Route Management */}
                <Route
                  path="/admin/buses"
                  element={<AdminBusManagement />}
                />{' '}
                {/* Bus Management */}
                <Route
                  path="/admin/seat-maps"
                  element={<AdminSeatMapManagement />}
                />{' '}
                {/* Seat Map Management */}
                <Route
                  path="/admin/operators"
                  element={<AdminOperatorManagement />}
                />{' '}
                {/* Operator Management */}
              </Route>

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </TooltipProvider>
        </ThemeProviderWithSuppress>
      </AuthProvider>
    </BrowserRouter>
  </QueryClientProvider>
)

export default App
