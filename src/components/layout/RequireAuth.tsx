import { type ReactNode, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore, type Profile } from '../../store/useAuthStore';

const ROLE_HOME: Record<Profile['role'], string> = {
  student: '/dashboard',
  coach: '/coach/dashboard',
  staff: '/login', // staff portal not built yet
};

export default function RequireAuth({
  children,
  role,
}: {
  children: ReactNode;
  /** If set, only a profile with this exact role may see the page. */
  role?: Profile['role'];
}) {
  const { user, profile, isInitialized, isProfileLoading, init } = useAuthStore();

  useEffect(() => {
    if (!isInitialized) {
      init();
    }
  }, [isInitialized, init]);

  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center text-neutral-400 text-sm">
        Loading…
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Wait for the profile to arrive before checking role, so we don't
  // bounce someone to the wrong page during the brief fetch window.
  if (role && (isProfileLoading || !profile)) {
    return (
      <div className="min-h-screen flex items-center justify-center text-neutral-400 text-sm">
        Loading…
      </div>
    );
  }

  if (role && profile && profile.role !== role) {
    return <Navigate to={ROLE_HOME[profile.role] ?? '/login'} replace />;
  }

  return <>{children}</>;
}