import { NavLink, Outlet } from 'react-router-dom'
import { Activity, TrendingUp, Filter, Users, BarChart3 } from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { to: '/events', label: 'Events', icon: Activity },
  { to: '/trends', label: 'Trends', icon: TrendingUp },
  { to: '/funnels', label: 'Funnels', icon: Filter },
  { to: '/users', label: 'Users', icon: Users },
]

export function Layout() {
  return (
    <div className="flex h-screen overflow-hidden">
      <aside className="w-64 flex-shrink-0 border-r bg-card flex flex-col">
        <div className="flex items-center gap-2 px-6 py-5 border-b">
          <BarChart3 className="h-6 w-6 text-primary" />
          <span className="text-lg font-bold tracking-tight">MiniPanel</span>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-accent text-accent-foreground'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                )
              }
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="px-6 py-4 border-t text-xs text-muted-foreground">
          Self-hosted analytics
        </div>
      </aside>
      <main className="flex-1 overflow-auto">
        <div className="p-8">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
