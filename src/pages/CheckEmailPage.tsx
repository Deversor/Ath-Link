import { useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { Trophy, MailCheck } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Button } from '@/components/ui/button';

interface HandoffState {
  email?: string;
}

export default function CheckEmailPage() {
  const location = useLocation();
  const email = (location.state as HandoffState | null)?.email;
  const [resent, setResent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);

  const handleResend = async () => {
    if (!email) return;
    setIsSending(true);
    setError(null);
    const { error: resendError } = await supabase.auth.resend({ type: 'signup', email });
    setIsSending(false);
    if (resendError) {
      setError(resendError.message);
      return;
    }
    setResent(true);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 px-4 py-16">
      <div className="w-full max-w-md bg-white border border-neutral-200 rounded-xl shadow-sm p-8 text-center">
        <div className="flex items-center justify-center gap-2 mb-6">
          <div className="w-8 h-8 rounded-lg bg-orange-500 flex items-center justify-center">
            <Trophy className="w-4 h-4 text-white" />
          </div>
          <span className="font-semibold">
            PalawanSU <span className="text-orange-500">AthLink</span>
          </span>
        </div>

        <div className="w-14 h-14 rounded-full bg-orange-50 flex items-center justify-center mx-auto mb-4">
          <MailCheck className="w-6 h-6 text-orange-500" />
        </div>

        <h1 className="text-xl font-bold text-neutral-900 mb-1">Check your email</h1>
        <p className="text-neutral-500 text-sm mb-1">
          We've sent a confirmation link{email ? ` to ${email}` : ''}.
        </p>
        <p className="text-neutral-500 text-sm mb-6">
          Click the link to activate your account and finish setting up your profile.
        </p>

        {resent && (
          <p className="text-sm text-green-700 bg-green-50 border border-green-100 rounded-lg px-3 py-2 mb-4">
            Confirmation email resent.
          </p>
        )}
        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2 mb-4">
            {error}
          </p>
        )}

        {email && (
          <Button
            type="button"
            variant="outline"
            className="w-full mb-4"
            onClick={handleResend}
            disabled={isSending}
          >
            {isSending ? 'Sending…' : 'Resend confirmation email'}
          </Button>
        )}

        <Link to="/login" className="text-sm text-orange-600 font-medium hover:text-orange-700">
          Back to Login
        </Link>
      </div>
    </div>
  );
}
