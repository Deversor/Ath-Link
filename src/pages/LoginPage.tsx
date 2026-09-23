import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { Mail, Lock, Trophy, HelpCircle } from 'lucide-react';
import { loginSchema, type LoginFormValues } from '../lib/schemas/loginSchema';
import { useAuthStore } from '../store/useAuthStore';
import { ROLE_HOME, isPrivilegedRole } from '../lib/roleHome';
import { supabase } from '../lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import PasswordInput from '../components/common/PasswordInput';
import { Label } from '@/components/ui/label';
import GoogleSignInButton from '../components/auth/GoogleSignInButton';

const MAX_ATTEMPTS = 5;

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const oauthError = (location.state as { error?: string } | null)?.error;
  const [searchParams] = useSearchParams();
  const wasDeactivated = searchParams.get('deactivated') === '1';
  const { signIn, isLoading, error, lockedUntil, failedAttempts } = useAuthStore();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const isLocked = !!lockedUntil && Date.now() < lockedUntil;
  const attemptsLeft = Math.max(0, MAX_ATTEMPTS - failedAttempts);

  // Credentials are checked immediately on submit — no gate in front of them.
  const onSubmit = async (values: LoginFormValues) => {
    const { success } = await signIn(values.email, values.password);
    if (!success) return;

    supabase.rpc('log_activity', {
      p_action_type: 'user_login',
      p_entity_type: 'auth',
      p_description: `Successful login`,
    });

    const profile = useAuthStore.getState().profile;
    const intendedFrom = (location.state as { from?: string } | null)?.from;

    if (profile && isPrivilegedRole(profile.role)) {
      navigate('/admin-verify', intendedFrom ? { state: { from: intendedFrom } } : undefined);
    } else if (profile) {
      const pendingReservation = sessionStorage.getItem('pendingReservationIntent');
      if (pendingReservation) {
        navigate('/facility-reservation/reserve');
      } else if (intendedFrom) {
        navigate(intendedFrom);
      } else {
        navigate(ROLE_HOME[profile.role]);
      }
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col md:flex-row bg-white">
      {/* Left panel — branding */}
      <div className="relative md:w-1/2 flex flex-col justify-center px-6 sm:px-10 py-6 md:py-16 lg:py-0 bg-gradient-to-br from-neutral-950 via-neutral-900 to-orange-950 text-white overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-orange-500" />

        <div className="flex items-center gap-2 mb-0 md:mb-16">
          <div className="w-9 h-9 rounded-lg bg-orange-500 flex items-center justify-center">
            <Trophy className="w-5 h-5 text-white" />
          </div>
          <span className="font-semibold text-lg">
            PalawanSU <span className="text-orange-500">AthLink</span>
          </span>
        </div>

        <h1 className="hidden md:block text-3xl md:text-4xl lg:text-5xl font-bold leading-tight mb-6 max-w-md">
          Your Gateway to <span className="text-orange-500">Athletic Excellence</span>
        </h1>

        <p className="hidden md:block text-neutral-400 max-w-sm mb-10">
          Access your personalized portal to manage schedules, requirements, and more.
        </p>

        <p className="hidden md:block absolute bottom-6 left-10 text-xs text-neutral-500">
          © 2026 Palawan State University Sports Division
        </p>
      </div>

      {/* Right panel — form */}
      <div className="md:w-1/2 flex items-center justify-center px-6 py-10 md:py-16">
        <div className="w-full max-w-sm">
          <h2 className="text-2xl font-bold text-neutral-900 mb-1">Welcome back</h2>
          <p className="text-neutral-500 mb-8">Sign in to your portal account.</p>

          {wasDeactivated && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2 mb-6">
              Your account has been deactivated. Contact your Sports Office administrator.
            </p>
          )}

          {oauthError && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2 mb-6">
              {oauthError}
            </p>
          )}

          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
            {/* Email */}
            <div>
              <Label htmlFor="email" className="mb-1.5 block">
                Email
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@psu.edu"
                  autoComplete="email"
                  className="pl-10"
                  {...register('email')}
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <Label htmlFor="password">Password</Label>
                <Link to="/forgot-password" className="text-xs font-medium text-orange-600 hover:text-orange-700">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 z-10" />
                <PasswordInput
                  id="password"
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="pl-10"
                  {...register('password')}
                />
              </div>
              {errors.password && (
                <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>
              )}
            </div>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                {error}
                {!isLocked && failedAttempts > 0 && (
                  <span className="block mt-0.5 text-xs text-red-500">
                    {attemptsLeft > 0
                      ? `${attemptsLeft} attempt${attemptsLeft === 1 ? '' : 's'} remaining before your account is temporarily locked.`
                      : 'This was your last attempt before a temporary lockout.'}
                  </span>
                )}
              </p>
            )}

            <Button
              type="submit"
              disabled={isLoading || isLocked}
              className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300"
            >
              {isLoading ? 'Signing in…' : isLocked ? 'Locked — try later' : 'Sign In'}
            </Button>
          </form>

          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-neutral-200" />
            <span className="text-xs text-neutral-400">or</span>
            <div className="flex-1 h-px bg-neutral-200" />
          </div>

          <GoogleSignInButton />

          <p className="text-center text-sm text-neutral-500 mt-6">
            Don&apos;t have an account?{' '}
            <Link to="/signup" className="text-orange-600 font-medium hover:text-orange-700">
              Sign up
            </Link>
          </p>
        </div>
      </div>

      <button
        type="button"
        aria-label="Help"
        className="fixed bottom-6 right-6 w-10 h-10 rounded-full bg-neutral-900 text-white flex items-center justify-center shadow-lg hover:bg-neutral-800"
      >
        <HelpCircle className="w-5 h-5" />
      </button>
    </div>
  );
}