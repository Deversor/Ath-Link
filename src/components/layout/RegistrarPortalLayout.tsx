import { type ReactNode } from 'react';
import { Users, ClipboardList, CheckCircle2, Clock } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import AppShellLayout from './AppShellLayout';

const NAV_ITEMS = [
  { to: '/registrar/dashboard', label: 'Athletes Gallery', icon: Users },
  { to: '/registrar/gwa-calculator', label: 'GWA Calculator', icon: ClipboardList },
  { to: '/registrar/approved-athletes', label: 'Approved Athletes', icon: CheckCircle2 },
  { to: '/registrar/verification-history', label: 'Verification History', icon: Clock },
];

export default function RegistrarPortalLayout({ children }: { children: ReactNode }) {
  const { profile, user } = useAuthStore();
  const displayName = profile?.full_name ?? user?.email ?? 'Registrar';

  return (
    <AppShellLayout
      roleLabel="Registrar"
      displayName={displayName}
      navItems={NAV_ITEMS}
      profilePath="/registrar/profile-settings"
    >
      {children}
    </AppShellLayout>
  );
}