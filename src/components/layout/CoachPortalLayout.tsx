import { type ReactNode } from 'react';
import { Users, FileText, Calendar, Building2 } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import AppShellLayout from './AppShellLayout';

const NAV_ITEMS = [
  { to: '/coach/dashboard', label: 'Dashboard', icon: FileText },
  { to: '/coach/athletes', label: 'Athletes', icon: Users },
  { to: '/coach/schedules', label: 'Schedules', icon: Calendar },
  { to: '/facility-reservation', label: 'Facility Reservation', icon: Building2 },
  { to: '/coach/reports', label: 'Reports', icon: FileText },
];

export default function CoachPortalLayout({ children }: { children: ReactNode }) {
  const { profile, user } = useAuthStore();

  const displayName = profile?.full_name ?? user?.email ?? 'Coach';

  return (
    <AppShellLayout
      roleLabel="Coach"
      displayName={displayName}
      menuTitle="Coach Menu"
      menuIcon={Users}
      sidebarSubtitle={
        <p className="text-xs text-neutral-500">
          Managing: <span className="text-orange-600 font-medium">{profile?.sport ?? '—'}</span>
        </p>
      }
      navItems={NAV_ITEMS}
      profilePath="/coach/profile-settings"
    >
      {children}
    </AppShellLayout>
  );
}