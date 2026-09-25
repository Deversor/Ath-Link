import { type ReactNode } from 'react';
import {
  LayoutDashboard,
  Users,
  ShieldCheck,
  Building2,
  Calendar,
  UserCog,
  Trophy as TrophyIcon,
  Clock,
  FileText,
  Archive,
  Database,
  Settings,
} from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import AppShellLayout from './AppShellLayout';

const NAV_ITEMS = [
  { to: '/superadmin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/superadmin/users', label: 'User Management', icon: Users },
  { to: '/superadmin/whitelist', label: 'Athlete Whitelist', icon: ShieldCheck },
  { to: '/superadmin/facility-requests', label: 'Facility Requests', icon: Building2 },
  { to: '/superadmin/coach-schedules', label: 'Coach Schedules', icon: Calendar },
  { to: '/superadmin/athlete-gallery', label: 'Athlete Gallery', icon: Users },
  { to: '/superadmin/coach-management', label: 'Coach Management', icon: UserCog },
  { to: '/superadmin/sport-programs', label: 'Sport Programs', icon: TrophyIcon },
  { to: '/superadmin/system-logs', label: 'System Logs', icon: Clock },
  { to: '/superadmin/reports', label: 'Reports', icon: FileText },
  { to: '/superadmin/document-archive', label: 'Document Archive', icon: Archive },
  { to: '/superadmin/database', label: 'Database', icon: Database },
  { to: '/superadmin/system-settings', label: 'System Settings', icon: Settings },
];

export default function SuperAdminPortalLayout({ children }: { children: ReactNode }) {
  const { profile, user } = useAuthStore();
  const displayName = profile?.full_name ?? user?.email ?? 'Super Admin';

  return (
    <AppShellLayout
      roleLabel="Super Admin"
      displayName={displayName}
      navItems={NAV_ITEMS}
      profilePath="/superadmin/profile-settings"
    >
      {children}
    </AppShellLayout>
  );
}