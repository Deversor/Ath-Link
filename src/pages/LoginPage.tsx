import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Mail, Lock, Trophy, ShieldCheck, HelpCircle, X } from 'lucide-react';
import { loginSchema, type LoginFormValues } from '../lib/schemas/loginSchema';
import { useAuthStore } from '../store/useAuthStore';
import { ROLE_HOME, isPrivilegedRole } from '../lib/roleHome';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';

export default function LoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const wasDeactivated = searchParams.get('deactivated') === '1';
  const { signIn, isLoading, error, lockedUntil } = useAuthStore();

  const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState(false);
  const [hasAgreed, setHasAgreed] = useState(false);
  const [pendingValues, setPendingValues] = useState<LoginFormValues | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const isLocked = !!lockedUntil && Date.now() < lockedUntil;

  // Step 1: email/password pass validation -> hold them and open the consent modal
  const onValidated = (values: LoginFormValues) => {
    setPendingValues(values);
    setHasAgreed(false);
    setIsPrivacyModalOpen(true);
  };

  // Step 2: user agrees inside the modal -> now actually sign in
  const confirmAndSignIn = async () => {
    if (!pendingValues) return;
    const { success } = await signIn(pendingValues.email, pendingValues.password);
    if (success) {
      setIsPrivacyModalOpen(false);

      const profile = useAuthStore.getState().profile;
      if (profile && isPrivilegedRole(profile.role)) {
        navigate('/admin-verify');
      } else if (profile) {
        navigate(ROLE_HOME[profile.role]);
      }
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-white">
      {/* Left panel — branding */}
      <div className="relative lg:w-1/2 flex flex-col justify-center px-10 py-16 lg:py-0 bg-gradient-to-br from-neutral-950 via-neutral-900 to-orange-950 text-white overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-orange-500" />

        <div className="flex items-center gap-2 mb-16">
          <div className="w-9 h-9 rounded-lg bg-orange-500 flex items-center justify-center">
            <Trophy className="w-5 h-5 text-white" />
          </div>
          <span className="font-semibold text-lg">
            PalawanSU <span className="text-orange-500">AthLink</span>
          </span>
        </div>

        <h1 className="text-4xl lg:text-5xl font-bold leading-tight mb-6 max-w-md">
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

        <p className="absolute bottom-6 left-10 text-xs text-neutral-500">
          © 2026 Palawan State University Sports Division
        </p>
      </div>

      {/* Right panel — form */}
      <div className="lg:w-1/2 flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-sm">
          <h2 className="text-2xl font-bold text-neutral-900 mb-1">Welcome back</h2>
          <p className="text-neutral-500 mb-8">Sign in to your portal account.</p>

          {wasDeactivated && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2 mb-6">
              Your account has been deactivated. Contact your Sports Office administrator.
            </p>
          )}

          <form onSubmit={handleSubmit(onValidated)} noValidate className="space-y-5">
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
                <a href="/forgot-password" className="text-xs font-medium text-orange-600 hover:text-orange-700">
                  Forgot password?
                </a>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                <Input
                  id="password"
                  type="password"
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

          <p className="text-center text-sm text-neutral-500 mt-6">
            Don&apos;t have an account?{' '}
            <Link to="/signup" className="text-orange-600 font-medium hover:text-orange-700">
              Sign up
            </Link>
          </p>
          <p className="text-center text-sm mt-2">
            <a href="/facility-booking" className="text-neutral-500 underline hover:text-neutral-700">
              Facility Booking Portal
            </a>
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

      {/* Privacy consent modal — shown after email/password pass validation, before sign-in actually fires */}
      {isPrivacyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setIsPrivacyModalOpen(false)}
          />
          <div className="relative w-full max-w-md rounded-xl bg-white shadow-xl p-6">
            <button
              type="button"
              aria-label="Close"
              onClick={() => setIsPrivacyModalOpen(false)}
              className="absolute top-4 right-4 text-neutral-400 hover:text-neutral-600"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="font-semibold text-neutral-900 mb-1">Privacy Notice (RA 10173)</h3>
            <p className="text-neutral-500 text-sm leading-relaxed mb-4">
              PalawanSU Sports Office collects your institutional login data
              to verify your affiliation and provide access to portal
              services. We process your data in compliance with the Data
              Privacy Act of 2012 (RA 10173). Your data is kept secure and
              will not be shared without your consent.{' '}
              <a href="/privacy-policy" className="text-orange-600 underline hover:text-orange-700">
                Read our full Privacy Policy.
              </a>
            </p>

            <div className="flex items-start gap-2 mb-5">
              <Checkbox
                id="modalAgree"
                className="mt-0.5"
                checked={hasAgreed}
                onCheckedChange={(checked: boolean | 'indeterminate') =>
                  setHasAgreed(checked === true)
                }
              />
              <Label htmlFor="modalAgree" className="text-sm font-normal text-neutral-700 leading-snug">
                I have read and agree to the Privacy Notice.
              </Label>
            </div>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2 mb-4">
                {error}
              </p>
            )}

            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => setIsPrivacyModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                disabled={!hasAgreed || isLoading}
                onClick={confirmAndSignIn}
                className="flex-1 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300"
              >
                {isLoading ? 'Signing in…' : 'Agree & Sign In'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}