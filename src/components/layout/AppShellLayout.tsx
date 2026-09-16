import { type ReactNode, type ComponentType, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Trophy, User as UserIcon, Menu, X } from 'lucide-react';
import NotificationsBell from './NotificationsBell';

export interface NavItem {
  to: string;
  label: string;
  /** Shorter label used only in the mobile bottom tab bar, if the full label is too long. */
  mobileLabel?: string;
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
  /** 'drawer' (default) suits portals with many/dense pages (admin roles).
   *  'bottom-bar' suits portals with a handful of glanceable destinations
   *  people check from their phone (Student). */
  mobileNavStyle?: 'drawer' | 'bottom-bar';
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
  mobileNavStyle = 'drawer',
}: AppShellLayoutProps) {
  const navigate = useNavigate();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const navContent = (onNavigate?: () => void) => (
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
            onClick={onNavigate}
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
  );

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-neutral-50">
      {/* Top header — fixed height, never scrolls */}
      <header className="shrink-0 bg-neutral-950 text-white">
        <div className="px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label="Open menu"
              onClick={() => setMobileNavOpen(true)}
              className={`${mobileNavStyle === 'bottom-bar' ? 'hidden' : 'md:hidden'} w-9 h-9 -ml-1 rounded-lg hover:bg-white/10 flex items-center justify-center shrink-0`}
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="w-8 h-8 rounded-lg bg-orange-500 flex items-center justify-center shrink-0">
              <Trophy className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold whitespace-nowrap">
              PalawanSU <span className="text-orange-500">AthLink</span>
            </span>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            <div className="text-right leading-tight hidden sm:block">
              <p className="text-sm font-medium">{displayName}</p>
              <p className="text-xs text-neutral-400">{roleLabel}</p>
            </div>
            <NotificationsBell />
            <button
              type="button"
              aria-label="Profile"
              onClick={() => navigate(profilePath)}
              className="w-9 h-9 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center shrink-0"
            >
              <UserIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Body: sidebar + content, both height-locked to the remaining
          viewport on desktop, so the sidebar stays put while content
          scrolls. On mobile, the sidebar is hidden and reachable instead
          through the hamburger menu above. */}
      <div className="flex-1 flex min-h-0 overflow-hidden">
        {/* Desktop sidebar — pinned, unchanged from before */}
        <aside className="hidden md:flex md:flex-col w-72 shrink-0 bg-white border-r border-neutral-200 overflow-y-auto">
          {navContent()}
        </aside>

        {/* Main content — the only part that scrolls */}
        <main className="flex-1 min-w-0 overflow-y-auto">
          <div className={`p-4 sm:p-6 space-y-6 ${mobileNavStyle === 'bottom-bar' ? 'pb-24 md:pb-6' : ''}`}>
            {children}
          </div>
        </main>
      </div>

      {/* Mobile bottom tab bar — fixed, thumb-reachable, for portals with a
          few glanceable destinations people check from their phone. */}
      {mobileNavStyle === 'bottom-bar' && (
        <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white border-t border-neutral-200 pb-[env(safe-area-inset-bottom)]">
          <div className="flex">
            {navItems.map(({ to, label, mobileLabel, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `flex-1 flex flex-col items-center justify-center gap-1 py-2.5 text-[11px] leading-tight ${
                    isActive ? 'text-orange-600' : 'text-neutral-500'
                  }`
                }
              >
                <Icon className="w-5 h-5" />
                <span className="text-center px-0.5">{mobileLabel ?? label}</span>
              </NavLink>
            ))}
          </div>
        </nav>
      )}

      {/* Mobile nav drawer — slides in from the left over a backdrop */}
      {mobileNavOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileNavOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-72 max-w-[85vw] bg-white shadow-xl overflow-y-auto">
            <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-100">
              <span className="text-sm font-semibold text-neutral-800">{menuTitle}</span>
              <button
                type="button"
                aria-label="Close menu"
                onClick={() => setMobileNavOpen(false)}
                className="w-8 h-8 rounded-lg hover:bg-neutral-100 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            {navContent(() => setMobileNavOpen(false))}
          </div>
        </div>
      )}
    </div>
  );
}