import { type ReactNode, type ComponentType } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Trophy, User as UserIcon } from 'lucide-react';
import NotificationsBell from './NotificationsBell';

export interface NavItem {
  to: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
}

interface AppShellLayoutProps {
  roleLabel: string;
  displayName: string;
  menuTitle?: string;
  menuIcon?: ComponentType<{ className?: string }>;
  sidebarSubtitle?: ReactNode;
  navItems: NavItem[];
  profilePath: string;
  children: ReactNode;
}

export default function AppShellLayout({
  roleLabel,
  displayName,
  menuTitle = 'Menu',
  menuIcon: MenuIcon,
  sidebarSubtitle,
  navItems,
  profilePath,
  children,
}: AppShellLayoutProps) {
  const navigate = useNavigate();

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-neutral-50">
      {/* Top header — fixed height, never scrolls */}
      <header className="shrink-0 bg-neutral-950 text-white">
        <div className="px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-orange-500 flex items-center justify-center">
              <Trophy className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold">
              PalawanSU <span className="text-orange-500">AthLink</span>
            </span>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right leading-tight hidden sm:block">
              <p className="text-sm font-medium">{displayName}</p>
              <p className="text-xs text-neutral-400">{roleLabel}</p>
            </div>
            <NotificationsBell />
            <button
              type="button"
              aria-label="Profile"
              onClick={() => navigate(profilePath)}
              className="w-9 h-9 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center"
            >
              <UserIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Body: sidebar + content. On desktop both are height-locked to the
          remaining viewport so the sidebar stays put while content scrolls.
          On mobile it falls back to a simple stacked layout. */}
      <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-y-auto md:overflow-hidden">
        {/* Sidebar — pinned on desktop; a normal stacked block on mobile. */}
        <aside className="w-full md:w-72 shrink-0 bg-white border-b md:border-b-0 md:border-r border-neutral-200 md:overflow-y-auto">
          <div className="p-5">
            <div className="flex items-center gap-2 text-sm font-semibold text-neutral-800 mb-1">
              {MenuIcon && <MenuIcon className="w-4 h-4" />}
              {menuTitle}
            </div>
            {sidebarSubtitle && <div className="mb-3">{sidebarSubtitle}</div>}
            <nav className={`space-y-1 ${sidebarSubtitle ? '' : 'mt-3'}`}>
              {navItems.map(({ to, label, icon: Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  className={({ isActive }) =>
                    `flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                      isActive
                        ? 'bg-orange-500 text-white font-medium'
                        : 'text-neutral-600 hover:bg-neutral-100'
                    }`
                  }
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </NavLink>
              ))}
            </nav>
          </div>
        </aside>

        {/* Main content — the only part that scrolls on desktop */}
        <main className="flex-1 min-w-0 md:overflow-y-auto">
          <div className="p-6 space-y-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
