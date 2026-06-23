import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { LoaderCircle } from 'lucide-react'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { AppShell } from '@/components/layout/AppShell'

const LoginPage = lazy(() => import('@/auth/LoginPage'))
const RegisterPage = lazy(() => import('@/auth/RegisterPage'))
const DashboardPage = lazy(() => import('@/pages/DashboardPage'))
const RoomsPage = lazy(() => import('@/pages/RoomsPage'))
const RoomPage = lazy(() => import('@/pages/RoomPage'))
const GoalsPage = lazy(() => import('@/pages/GoalsPage'))
const MatchesPage = lazy(() => import('@/pages/MatchesPage'))
const AIPlannerPage = lazy(() => import('@/pages/AIPlannerPage'))
const ProfilePage = lazy(() => import('@/pages/ProfilePage'))
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage'))

function RouteFallback() {
  return (
    <div className="grid min-h-[60vh] place-items-center">
      <div className="flex items-center gap-3 text-sm text-muted-foreground">
        <LoaderCircle className="h-5 w-5 animate-spin text-primary" /> Loading OpenStudy…
      </div>
    </div>
  )
}

export default function App() {
  return (
    <Suspense fallback={<RouteFallback />}>
      <Routes>
        <Route path="/auth/login" element={<LoginPage />} />
        <Route path="/auth/register" element={<RegisterPage />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<AppShell />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/rooms" element={<RoomsPage />} />
            <Route path="/rooms/:roomId" element={<RoomPage />} />
            <Route path="/goals" element={<GoalsPage />} />
            <Route path="/matches" element={<MatchesPage />} />
            <Route path="/planner" element={<AIPlannerPage />} />
            <Route path="/profile" element={<ProfilePage />} />
          </Route>
        </Route>

        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  )
}
