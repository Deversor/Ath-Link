import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Trophy, KeyRound, ShieldCheck } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [isReady, setIsReady] = useState(false);
  const [linkInvalid, setLinkInvalid] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    // Supabase reads the recovery token out of the URL automatically and
    // fires this event once a temporary recovery session is established.
    const { data: subscription } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setIsReady(true);
      }
    });

    // If the tab was already open when the link was clicked, the session
    // may already be set by the time this component mounts.
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setIsReady(true);
    });

    const timeout = setTimeout(() => {
      setIsReady((ready) => {
        if (!ready) setLinkInvalid(true);
        return ready;
      });
    }, 4000);

    return () => {
      subscription.subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords don't match.");
      return;
    }

    setIsSubmitting(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setIsSubmitting(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }
    setSuccess(true);
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
        <div className="inline-flex items-center gap-2 w-fit px-3 py-2 rounded-lg border border-neutral-700 text-sm text-neutral-300">
          <ShieldCheck className="w-4 h-4 text-orange-500" />
          Protected · 5-attempt lockout · 15-min cooldown
        </div>
      </div>

      <div className="lg:w-1/2 flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-sm">
          <div className="w-12 h-12 rounded-lg bg-orange-50 flex items-center justify-center mb-5">
            <KeyRound className="w-6 h-6 text-orange-500" />
          </div>

          {linkInvalid ? (
            <>
              <h2 className="text-2xl font-bold text-neutral-900 mb-1">Link expired or invalid</h2>
              <p className="text-neutral-500 mb-6">
                This reset link no longer works — it may have already been used or timed out. Request a new one.
              </p>
              <Link to="/forgot-password">
                <Button className="w-full bg-orange-500 hover:bg-orange-600">Request a new link</Button>
              </Link>
            </>
          ) : success ? (
            <>
              <h2 className="text-2xl font-bold text-neutral-900 mb-1">Password updated</h2>
              <p className="text-neutral-500 mb-6">You can now sign in with your new password.</p>
              <Button className="w-full bg-orange-500 hover:bg-orange-600" onClick={() => navigate('/login')}>
                Go to Login
              </Button>
            </>
          ) : !isReady ? (
            <p className="text-neutral-500">Verifying your reset link…</p>
          ) : (
            <>
              <h2 className="text-2xl font-bold text-neutral-900 mb-1">Set a new password</h2>
              <p className="text-neutral-500 mb-6">Choose a new password for your account.</p>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <Label htmlFor="password" className="mb-1.5 block">
                    New Password
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoFocus
                  />
                </div>
                <div>
                  <Label htmlFor="confirmPassword" className="mb-1.5 block">
                    Confirm New Password
                  </Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
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
                  {isSubmitting ? 'Updating…' : 'Update Password'}
                </Button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
