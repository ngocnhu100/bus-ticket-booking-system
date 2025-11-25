import { useAuth } from '@/context/AuthContext'
import { Navigate, Outlet } from 'react-router-dom'

export const PassengerRoute = () => {
  const { user, loading } = useAuth()
  if (loading)
    return (
      <div className="flex items-center justify-center min-h-screen">
        Loading...
      </div>
    )
  return user?.role === 'passenger' ? (
    <Outlet />
  ) : (
    <Navigate to="/login" replace />
  )
}

export const AdminRoute = () => {
  const { user, loading } = useAuth()
  if (loading)
    return (
      <div className="flex items-center justify-center min-h-screen">
        Loading...
      </div>
    )
  return user?.role === 'admin' ? <Outlet /> : <Navigate to="/login" replace />
}
