import { NavLink } from 'react-router-dom';
import { Activity, TrendingUp, Filter, Users, Settings } from 'lucide-react';

const navItems = [
  { label: 'Events',   icon: Activity,   to: '/'         },
  { label: 'Trends',   icon: TrendingUp, to: '/trends'   },
  { label: 'Funnels',  icon: Filter,     to: '/funnels'  },
  { label: 'Users',    icon: Users,      to: '/users'    },
  { label: 'Settings', icon: Settings,   to: '/settings' },
] as const;

export default function Sidebar() {
  return (
    <aside
      data-testid="sidebar"
      className="fixed left-0 top-0 h-screen w-60 bg-neutral-900 text-neutral-300 flex flex-col"
    >
      {/* Logo / Title */}
      <div className="h-16 flex items-center justify-center text-neutral-50 text-2xl font-black select-none">
        MiniPanel
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-2 flex flex-col gap-1">
        {navItems.map(({ label, icon: Icon, to }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              [
                'flex items-center gap-3 h-10 px-4 rounded-lg text-sm font-bold transition-colors duration-150',
                isActive
                  ? 'bg-neutral-700 text-neutral-50'
                  : 'hover:bg-neutral-800',
              ].join(' ')
            }
          >
            {({ isActive }) => (
              <>
                <Icon size={16} strokeWidth={2} aria-hidden="true" />
                <span aria-current={isActive ? 'page' : undefined}>{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
