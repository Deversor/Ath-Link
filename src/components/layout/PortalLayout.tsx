import { type ReactNode } from 'react';
import { LayoutDashboard, FileText, Calendar, Building2 } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import AppShellLayout from './AppShellLayout';

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/documents', label: 'Documents', icon: FileText },
  { to: '/schedules', label: 'Schedules', icon: Calendar },
  { to: '/facility-reservation', label: 'Facility Reservation', mobileLabel: 'Facility', icon: Building2 },
];

export default function PortalLayout({ children }: { children: ReactNode }) {
  const { profile, user } = useAuthStore();

  const displayName = profile?.full_name ?? user?.email ?? 'Student Athlete';
  const roleLabel =
    profile?.role === 'student' ? 'Student Athlete' : profile?.role ?? 'Student Athlete';

  return (
    <AppShellLayout
      roleLabel={roleLabel}
      displayName={displayName}
      menuTitle="Navigation"
      menuIcon={FileText}
      navItems={NAV_ITEMS}
      profilePath="/profile-settings"
      mobileNavStyle="bottom-bar"
    >
      {children}
    </AppShellLayout>
  );
}