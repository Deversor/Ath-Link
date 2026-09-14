import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trophy } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/useAuthStore';

export default function CompleteFacilityRequesterSignUpPage() {
  const navigate = useNavigate();
  const { isInitialized, init } = useAuthStore();
  const [message, setMessage] = useState('Setting up your account…');

  useEffect(() => {
    async function run() {
      if (!isInitialized) await init();

      const { data } = await supabase.auth.getUser();
      const user = data.user;

      if (!user) {
        setMessage('Your confirmation link may have expired. Please try signing up again.');
        return;
      }

      const fullName = (user.user_metadata?.full_name as string) ?? '';

      await supabase.from('profiles').upsert({
        id: user.id,
        email: user.email,
        full_name: fullName,
        role: 'facility_requester',
      });

      const pending = sessionStorage.getItem('pendingReservationIntent');
      navigate(pending ? '/facility-reservation/reserve' : '/facility-reservation');
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
