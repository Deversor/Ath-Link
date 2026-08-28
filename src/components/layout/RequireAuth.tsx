import { type ReactNode, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';

export default function RequireAuth({ children }: { children: ReactNode }) {
  const { user, isInitialized, init } = useAuthStore();

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

  return <>{children}</>;
}
