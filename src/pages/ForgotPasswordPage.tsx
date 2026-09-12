import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Trophy, Mail, ShieldCheck } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    setIsSubmitting(false);

    // Always show the same success message, whether or not the email
    // exists — this avoids leaking which emails have accounts.
    if (resetError && resetError.status !== 400) {
      setError(resetError.message);
      return;
    }
    setSent(true);
  };

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-white">
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
          Access your personalized portal to manage training schedules, equipment, wellness programs, and more.
        </p>
        <div className="inline-flex items-center gap-2 w-fit px-3 py-2 rounded-lg border border-neutral-700 text-sm text-neutral-300">
          <ShieldCheck className="w-4 h-4 text-orange-500" />
          Protected · 5-attempt lockout · 15-min cooldown
        </div>
      </div>

      <div className="lg:w-1/2 flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-sm">
          <div className="w-12 h-12 rounded-lg bg-orange-50 flex items-center justify-center mb-5">
            <Mail className="w-6 h-6 text-orange-500" />
          </div>

          {sent ? (
            <>
              <h2 className="text-2xl font-bold text-neutral-900 mb-1">Check your email</h2>
              <p className="text-neutral-500 mb-6">
                If an account exists for <span className="font-medium text-neutral-700">{email}</span>, we've sent a
                link to reset your password. It may take a minute to arrive — check spam too.
              </p>
            </>
          ) : (
            <>
              <h2 className="text-2xl font-bold text-neutral-900 mb-1">Forgot your password?</h2>
              <p className="text-neutral-500 mb-6">
                Enter your account email and we'll send you a link to reset it.
              </p>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <Label htmlFor="email" className="mb-1.5 block">
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@psu.edu"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoFocus
                  />
                </div>

                {error && (
                  <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                    {error}
                  </p>
                )}

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300"
                >
                  {isSubmitting ? 'Sending…' : 'Send Reset Link'}
                </Button>
              </form>
            </>
          )}

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
