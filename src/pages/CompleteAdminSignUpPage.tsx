import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/useAuthStore';

export default function CompleteAdminSignUpPage() {
  const navigate = useNavigate();
  const { isInitialized, init, fetchProfile } = useAuthStore();
  const [status, setStatus] = useState<'working' | 'error'>('working');
  const [message, setMessage] = useState('Setting up your account…');

  useEffect(() => {
    async function run() {
      if (!isInitialized) {
        await init();
      }

      const { data } = await supabase.auth.getUser();
      const user = data.user;

      if (!user) {
        setStatus('error');
        setMessage('Your confirmation link may have expired. Please try signing up again.');
        return;
      }

      const role = user.user_metadata?.role as string | undefined;
      const fullName = (user.user_metadata?.full_name as string) ?? '';

      if (!role) {
        setStatus('error');
        setMessage("We couldn't determine your role. Please contact your Super Admin.");
        return;
      }

      const { data: claimed, error: claimError } = await supabase.rpc('claim_admin_whitelist', {
        p_role: role,
        p_full_name: fullName,
      });

      if (claimError || !claimed) {
        setStatus('error');
        setMessage("This email isn't whitelisted for that role. Ask your Super Admin to add you first.");
        await supabase.auth.signOut();
        return;
      }

      await fetchProfile();
      navigate('/admin-verify');
    }

    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isInitialized]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 px-4">
      <div className="w-full max-w-sm bg-white border border-neutral-200 rounded-xl shadow-sm p-8 text-center">
        <div className="w-14 h-14 rounded-full bg-neutral-900 flex items-center justify-center mx-auto mb-4">
          <ShieldCheck className="w-6 h-6 text-orange-500" />
        </div>
        <p className="text-neutral-600 mb-4">{message}</p>
        {status === 'error' && (
          <Link to="/admin-signup" className="text-sm text-orange-600 font-medium hover:text-orange-700">
            Back to Admin Sign Up
          </Link>
        )}
      </div>
    </div>
  );
}
