import { NavLink } from 'react-router-dom';

const NAV_ITEMS = [
  { to: '/', label: 'Events', icon: '\u25CF' },
  { to: '/trends', label: 'Trends', icon: '\u2197' },
  { to: '/funnels', label: 'Funnels', icon: '\u25BD' },
  { to: '/users', label: 'Users', icon: '\u2630' },
  { to: '/settings', label: 'Settings', icon: '\u2699' },
] as const;

export function Sidebar() {
  return (
    <aside className="fixed left-0 top-0 flex h-screen w-60 flex-col bg-neutral-900">
      <div className="px-5 py-6">
        <h1 className="text-2xl font-black text-neutral-50">MiniPanel</h1>
      </div>

      <nav className="flex flex-1 flex-col gap-1 px-3">
        {NAV_ITEMS.map(({ to, label, icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded px-3 py-2 text-sm font-bold transition-colors ${
                isActive
                  ? 'bg-neutral-700 text-neutral-50'
                  : 'text-neutral-300 hover:bg-neutral-800'
              }`
            }
          >
            <span className="h-4 w-4 shrink-0 flex items-center justify-center text-xs">{icon}</span>
            {label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
