import { useEffect } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { LoaderCircle } from 'lucide-react'
import { useMe } from '@/hooks/useUser'
import { useAuthStore } from '@/store/authStore'

export function ProtectedRoute() {
  const location = useLocation()
  const logout = useAuthStore(state => state.logout)
  const { data: user, isLoading, isError } = useMe(true)

  useEffect(() => {
    if (isError) logout()
  }, [isError, logout])

  if (isLoading) {
    return (
      <div className="grid min-h-screen place-items-center bg-background">
        <div className="flex items-center gap-3 text-muted-foreground">
          <LoaderCircle className="h-5 w-5 animate-spin text-primary" />
          Restoring your study space…
        </div>
      </div>
    )
  }

  if (isError || !user) {
    return <Navigate to="/auth/login" replace state={{ from: location.pathname }} />
  }

  return <Outlet />
}
