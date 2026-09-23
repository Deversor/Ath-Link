import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { ShieldCheck, Trophy } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { ROLE_HOME } from '../lib/roleHome';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const MAX_ATTEMPTS = 5;

export default function AdminVerifyPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { profile, user, verifyAdminKey, isLoading, adminKeyError, adminKeyAttempts, adminKeyLockedUntil } =
    useAuthStore();

  const [key, setKey] = useState('');

  if (!user) {
    navigate('/login', { replace: true });
    return null;
  }

  const isLocked = !!adminKeyLockedUntil && Date.now() < adminKeyLockedUntil;
  const attemptsLeft = Math.max(0, MAX_ATTEMPTS - adminKeyAttempts);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { success } = await verifyAdminKey(key);
    if (success && profile) {
      const intendedFrom = (location.state as { from?: string } | null)?.from;
      navigate(intendedFrom ?? ROLE_HOME[profile.role], { replace: true });
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col md:flex-row bg-white">
      {/* Left panel — same branding as the login screen */}
      <div className="relative md:w-1/2 flex flex-col justify-center px-6 sm:px-10 py-10 md:py-16 lg:py-0 bg-gradient-to-br from-neutral-950 via-neutral-900 to-orange-950 text-white overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-orange-500" />

        <div className="flex items-center gap-2 mb-8 md:mb-16">
          <div className="w-9 h-9 rounded-lg bg-orange-500 flex items-center justify-center">
            <Trophy className="w-5 h-5 text-white" />
          </div>
          <span className="font-semibold text-lg">
            PalawanSU <span className="text-orange-500">AthLink</span>
          </span>
        </div>

        <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold leading-tight mb-6 max-w-md">
          Your Gateway to <span className="text-orange-500">Athletic Excellence</span>
        </h1>

        <p className="text-neutral-400 max-w-sm mb-10">
          Access your personalized portal to manage training schedules,
          equipment, wellness programs, and more.
        </p>

        <div className="inline-flex items-center gap-2 w-fit px-3 py-2 rounded-lg border border-neutral-700 text-sm text-neutral-300">
          <ShieldCheck className="w-4 h-4 text-orange-500" />
          Protected · 5-attempt lockout · 15-min cooldown
        </div>
      </div>

      {/* Right panel — the key prompt */}
      <div className="md:w-1/2 flex items-center justify-center px-6 py-10 md:py-16">
        <div className="w-full max-w-sm">
          <div className="w-12 h-12 rounded-lg bg-orange-50 flex items-center justify-center mb-5">
            <ShieldCheck className="w-6 h-6 text-orange-500" />
          </div>
          <h2 className="text-2xl font-bold text-neutral-900 mb-1">Admin Verification</h2>
          <p className="text-neutral-500 mb-6">Enter your administrative login key to continue.</p>

          <div className="rounded-lg bg-orange-50 border border-orange-100 px-4 py-3 mb-5">
            <p className="text-sm text-orange-700">
              Administrative access requires a secure login key.{' '}
              {isLocked ? 'Try again later.' : `${attemptsLeft} attempts remaining.`}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <Label htmlFor="loginKey" className="mb-1.5 block">
                Login Key
              </Label>
              <Input
                id="loginKey"
                type="password"
                placeholder="Enter your login key"
                value={key}
                onChange={(e) => setKey(e.target.value)}
                className="border-orange-300 focus-visible:ring-orange-400"
                autoFocus
              />
            </div>

            {adminKeyError && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                {adminKeyError}
              </p>
            )}

            <Button
              type="submit"
              disabled={isLoading || isLocked || !key}
              className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300"
            >
              {isLoading ? 'Verifying…' : 'Verify & Continue'}
            </Button>
          </form>

          <div className="text-center mt-6">
            <Link to="/login" className="text-sm text-neutral-500 hover:text-neutral-700">
              ← Back to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}