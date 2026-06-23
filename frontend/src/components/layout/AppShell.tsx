import { Outlet } from 'react-router-dom'
import { MobileNav, Sidebar } from './Sidebar'

export function AppShell() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Sidebar />
      <MobileNav />
      <main className="min-h-screen lg:pl-[248px]">
        <div className="mx-auto max-w-7xl px-4 pb-10 pt-20 sm:px-6 lg:px-8 lg:pt-8">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
