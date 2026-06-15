import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'

export function AppShell() {
  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />
      <main className="flex-1 ml-[220px] min-h-screen">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
