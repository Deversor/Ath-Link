import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trophy } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/useAuthStore';
import { ROLE_HOME, isPrivilegedRole } from '../lib/roleHome';

const INSTITUTIONAL_DOMAIN = '@psu.palawan.edu.ph';

export default function AuthCallbackPage() {
  const navigate = useNavigate();
  const { isInitialized, init, fetchProfile } = useAuthStore();
  const [message, setMessage] = useState('Signing you in…');

  useEffect(() => {
    async function run() {
      if (!isInitialized) await init();

      const { data } = await supabase.auth.getUser();
      const user = data.user;

      if (!user) {
        setMessage('Something went wrong. Please try signing in again.');
        setTimeout(() => navigate('/login'), 2000);
        return;
      }

      const email = user.email ?? '';
      if (!email.toLowerCase().endsWith(INSTITUTIONAL_DOMAIN)) {
        await supabase.auth.signOut();
        navigate('/login', {
          state: { error: `Please use your ${INSTITUTIONAL_DOMAIN} account to sign in.` },
        });
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle();

      if (profile) {
        await fetchProfile();
        navigate(isPrivilegedRole(profile.role) ? '/admin-verify' : ROLE_HOME[profile.role as keyof typeof ROLE_HOME]);
        return;
      }

      // First time signing in with this Google account — no profile yet.
      navigate('/complete-google-signup');
    }

    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isInitialized]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 px-4">
      <div className="w-full max-w-sm bg-white border border-neutral-200 rounded-xl shadow-sm p-8 text-center">
        <div className="w-14 h-14 rounded-full bg-orange-500 flex items-center justify-center mx-auto mb-4">
          <Trophy className="w-6 h-6 text-white" />
        </div>
        <p className="text-neutral-600">{message}</p>
      </div>
    </div>
  );
}
