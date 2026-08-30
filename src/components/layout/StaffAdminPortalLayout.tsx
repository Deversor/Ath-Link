import { type ReactNode } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  Trophy,
  LayoutDashboard,
  ShieldCheck,
  Building2,
  Calendar,
  Users,
  UserCog,
  BarChart3,
  Bell,
  User as UserIcon,
} from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';

const NAV_ITEMS = [
  { to: '/staff-admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/staff-admin/whitelist', label: 'Athlete Whitelist', icon: ShieldCheck },
  { to: '/staff-admin/facility-requests', label: 'Facility Requests', icon: Building2 },
  { to: '/staff-admin/coach-schedules', label: 'Coach Schedules', icon: Calendar },
  { to: '/staff-admin/athlete-gallery', label: 'Athlete Gallery', icon: Users },
  { to: '/staff-admin/coach-management', label: 'Coach Management', icon: UserCog },
  { to: '/staff-admin/reports', label: 'Reports', icon: BarChart3 },
];

export default function StaffAdminPortalLayout({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const { profile, user } = useAuthStore();

  const displayName = profile?.full_name ?? user?.email ?? 'Staff Admin';

  return (
    <div className="min-h-screen bg-neutral-50">
      <header className="bg-neutral-950 text-white">
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
              <p className="text-xs text-neutral-400">Staff Admin</p>
            </div>
            <button
              type="button"
              aria-label="Notifications"
              className="w-9 h-9 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center"
            >
              <Bell className="w-4 h-4" />
            </button>
            <button
              type="button"
              aria-label="Profile"
              onClick={() => navigate('/staff-admin/profile-settings')}
              className="w-9 h-9 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center"
            >
              <UserIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-6 flex flex-col md:flex-row gap-6">
        <aside className="md:w-64 shrink-0">
          <div className="bg-white border border-neutral-200 rounded-xl p-4">
            <p className="text-sm font-semibold text-neutral-800 mb-3">Menu</p>
            <nav className="space-y-1">
              {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  className={({ isActive }) =>
                    `flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
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

        <main className="flex-1 min-w-0 space-y-6">{children}</main>
      </div>
    </div>
  );
}
