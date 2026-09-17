import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trophy, User as UserIcon } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/useAuthStore';
import { useSports } from '../hooks/useSports';
import { Button } from '@/components/ui/button';

type Role = 'student' | 'coach' | 'facility_requester';

const ROLE_OPTIONS: { value: Role; label: string }[] = [
  { value: 'student', label: 'Student Athlete' },
  { value: 'coach', label: 'Coach' },
  { value: 'facility_requester', label: 'Facility Requester' },
];

export default function CompleteGoogleSignupPage() {
  const navigate = useNavigate();
  const { user, isInitialized, init } = useAuthStore();
  const sports = useSports();

  const [role, setRole] = useState<Role>('student');
  const [sport, setSport] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isInitialized) init();
  }, [isInitialized, init]);

  useEffect(() => {
    if (sports.length > 0 && !sport) setSport(sports[0]);
  }, [sports, sport]);

  if (isInitialized && !user) {
    navigate('/login');
    return null;
  }

  const fullName = (user?.user_metadata?.full_name as string) ?? (user?.user_metadata?.name as string) ?? '';
  const email = user?.email ?? '';

  const handleContinue = async () => {
    setError(null);

    if (role === 'student') {
      const { data: isWhitelisted } = await supabase.rpc('is_email_whitelisted', { p_email: email });
      if (!isWhitelisted) {
        setError("This email hasn't been authorized for athlete registration yet. Contact your Sports Office.");
        return;
      }
      navigate('/profile-setup', { state: { fullName, email, sport } });
      return;
    }

    if (role === 'coach') {
      const { data: isWhitelisted } = await supabase.rpc('is_coach_whitelisted', { p_email: email, p_sport: sport });
      if (!isWhitelisted) {
        setError("You haven't been assigned as coach for this sport yet. Contact your Sports Office.");
        return;
      }
      navigate('/coach-profile-setup', { state: { fullName, email, sport } });
      return;
    }

    // Facility Requester — no whitelist needed, create the minimal profile now
    setIsSubmitting(true);
    if (user) {
      await supabase.from('profiles').upsert({
        id: user.id,
        email,
        full_name: fullName,
        role: 'facility_requester',
      });
    }
    setIsSubmitting(false);
    const pending = sessionStorage.getItem('pendingReservationIntent');
    navigate(pending ? '/facility-reservation/reserve' : '/facility-reservation');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 px-4 py-12">
      <div className="w-full max-w-md bg-white border border-neutral-200 rounded-xl shadow-sm p-8">
        <div className="flex items-center justify-center gap-2 mb-6">
          <div className="w-8 h-8 rounded-lg bg-orange-500 flex items-center justify-center">
            <Trophy className="w-4 h-4 text-white" />
          </div>
          <span className="font-semibold">
            PalawanSU <span className="text-orange-500">AthLink</span>
          </span>
        </div>

        <div className="w-14 h-14 rounded-full bg-orange-50 flex items-center justify-center mx-auto mb-4">
          <UserIcon className="w-6 h-6 text-orange-500" />
        </div>

        <h1 className="text-xl font-bold text-neutral-900 text-center mb-1">Welcome, {fullName || 'there'}!</h1>
        <p className="text-sm text-neutral-500 text-center mb-6">
          Just one more step — tell us who you are so we can set up your account.
        </p>

        <div className="space-y-3 mb-5">
          {ROLE_OPTIONS.map((opt) => (
            <label
              key={opt.value}
              className={`flex items-center gap-3 rounded-lg border p-3 text-sm cursor-pointer ${
                role === opt.value ? 'border-orange-500 bg-orange-50 text-orange-700' : 'border-neutral-200 text-neutral-600'
              }`}
            >
              <input
                type="radio"
                name="role"
                value={opt.value}
                checked={role === opt.value}
                onChange={() => setRole(opt.value)}
              />
              {opt.label}
            </label>
          ))}
        </div>

        {(role === 'student' || role === 'coach') && (
          <div className="mb-5">
            <label className="text-sm text-neutral-700 mb-1.5 block">Sport</label>
            <select
              value={sport}
              onChange={(e) => setSport(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg bg-neutral-100 border border-transparent focus:border-orange-500 outline-none text-sm"
            >
              {sports.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        )}

        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2 mb-4">{error}</p>
        )}

        <Button
          type="button"
          onClick={handleContinue}
          disabled={isSubmitting}
          className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300"
        >
          {isSubmitting ? 'Setting up…' : 'Continue'}
        </Button>
      </div>
    </div>
  );
}
