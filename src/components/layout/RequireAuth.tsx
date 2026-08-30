import { type ReactNode, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { ROLE_HOME, isPrivilegedRole, type AppRole } from '../../lib/roleHome';

export default function RequireAuth({
  children,
  role,
}: {
  children: ReactNode;
  /** If set, only a profile with this exact role may see the page. */
  role?: AppRole;
}) {
  const { user, profile, isInitialized, isProfileLoading, isAdminVerified, init } = useAuthStore();

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

  // Privileged roles must clear the admin login-key step before reaching
  // any of their pages, even if they're logged in with the right role.
  if (profile && isPrivilegedRole(profile.role) && !isAdminVerified) {
    return <Navigate to="/admin-verify" replace />;
  }

  return <>{children}</>;
}