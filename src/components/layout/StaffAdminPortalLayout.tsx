import { type ReactNode } from 'react';
import { LayoutDashboard, ShieldCheck, Building2, Calendar, Users, UserCog, BarChart3 } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import AppShellLayout from './AppShellLayout';

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
  const { profile, user } = useAuthStore();
  const displayName = profile?.full_name ?? user?.email ?? 'Staff Admin';

  return (
    <AppShellLayout
      roleLabel="Staff Admin"
      displayName={displayName}
      navItems={NAV_ITEMS}
      profilePath="/staff-admin/profile-settings"
    >
      {children}
    </AppShellLayout>
  );
}