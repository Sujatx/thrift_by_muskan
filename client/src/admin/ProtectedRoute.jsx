import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

/**
 * Gates the admin dashboard. While auth is loading, render nothing to
 * avoid a flash; once resolved, redirect unauthenticated users to login
 * (preserving the intended destination).
 */
export function ProtectedRoute({ children }) {
  const { isAdmin, adminLoading } = useAuth()
  const location = useLocation()

  if (adminLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-muted border-t-primary" />
      </div>
    )
  }

  if (!isAdmin) {
    return <Navigate to="/admin/login" replace state={{ from: location }} />
  }

  return children
}
