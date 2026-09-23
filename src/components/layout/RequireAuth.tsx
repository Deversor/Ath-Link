import { type ReactNode, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { ROLE_HOME, isPrivilegedRole, type AppRole } from '../../lib/roleHome';

export default function RequireAuth({
  children,
  role,
}: {
  children: ReactNode;
  /** If set, only a profile with this role (or one of these roles) may see the page. */
  role?: AppRole | AppRole[];
}) {
  const { user, profile, isInitialized, isProfileLoading, isAdminVerified, maintenanceMode, init } =
    useAuthStore();
  const location = useLocation();

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
    return <Navigate to="/login" state={{ from: location.pathname + location.search }} replace />;
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

  if (role && profile) {
    const allowed = Array.isArray(role) ? role : [role];
    if (!allowed.includes(profile.role)) {
      return <Navigate to={ROLE_HOME[profile.role] ?? '/login'} replace />;
    }
  }

  // A deactivated account (Super Admin → User Management) loses access
  // to every portal page immediately, even with a valid session.
  if (profile && profile.is_active === false) {
    return <Navigate to="/login?deactivated=1" replace />;
  }

  // Maintenance mode (Super Admin → System Settings) locks everyone except
  // the Super Admin out of the portals until it's turned back off.
  if (maintenanceMode && profile && profile.role !== 'superadmin') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center px-6">
        <p className="text-lg font-semibold text-neutral-800 mb-2">Ath-Link is under maintenance</p>
        <p className="text-sm text-neutral-500 max-w-sm">
          The Sports Office is performing scheduled maintenance. Please check back shortly.
        </p>
      </div>
    );
  }

  // Privileged roles must clear the admin login-key step before reaching
  // any of their pages, even if they're logged in with the right role.
  if (profile && isPrivilegedRole(profile.role) && !isAdminVerified) {
    return <Navigate to="/admin-verify" state={{ from: location.pathname + location.search }} replace />;
  }

  return <>{children}</>;
}