import { useEffect, useState } from 'react';
import { UserCog, KeyRound, RotateCcw, Send, UserPlus } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { supabase } from '../../lib/supabase';
import { useSports } from '../../hooks/useSports';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import ConfirmDialog from '../../components/common/ConfirmDialog';

interface Coach {
  id: string;
  full_name: string;
  email: string;
  sport: string;
  created_at: string;
}

export function CoachManagementContent() {
  const sports = useSports();
  const { user } = useAuthStore();
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [inviteEmails, setInviteEmails] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<string | null>(null);

  const loadCoaches = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('id, full_name, email, sport, created_at')
      .eq('role', 'coach');
    setCoaches(data ?? []);
  };

  useEffect(() => {
    loadCoaches();
  }, []);

  const coachFor = (sport: string) => coaches.find((c) => c.sport === sport);

  const handleInvite = async (sport: string) => {
    const email = inviteEmails[sport]?.trim().toLowerCase();
    if (!email || !user) return;

    const { error } = await supabase
      .from('coach_whitelist')
      .insert({ email, sport, added_by: user.id });

    if (error) {
      setMessage(error.message);
      return;
    }

    setMessage(`Invited ${email} to register as the ${sport} coach.`);
    setInviteEmails((prev) => ({ ...prev, [sport]: '' }));
  };

  const handleResetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    setMessage(error ? error.message : `Password reset email sent to ${email}.`);
  };

  const [resetTarget, setResetTarget] = useState<Coach | null>(null);

  const handleResetProfile = async (coachId: string) => {
    await supabase
      .from('profiles')
      .update({ phone_number: null, specialization: null, years_experience: null })
      .eq('id', coachId);
    setResetTarget(null);
    setMessage('Coach profile details cleared — they can fill them in again from their settings.');
    loadCoaches();
  };

  const handleSendNotification = async (coachId: string) => {
    if (!user) return;
    await supabase.from('notifications').insert({
      user_id: coachId,
      message: 'Please check your Ath-Link account for an update from the Sports Office.',
      sent_by: user.id,
    });
    setMessage('Notification sent.');
  };

  return (
    <>
      <div>
        <h1 className="flex items-center gap-2 text-lg font-bold text-neutral-900">
          <UserCog className="w-5 h-5 text-orange-500" />
          Coach Account Management
        </h1>
        <p className="text-sm text-neutral-500">
          One coach account per sport program. Coaches self-register once you've assigned them below.
        </p>
      </div>

      {message && (
        <p className="text-sm text-green-700 bg-green-50 border border-green-100 rounded-lg px-3 py-2">
          {message}
        </p>
      )}

      <div className="space-y-4">
        {sports.map((sport) => {
          const coach = coachFor(sport);
          return (
            <div key={sport} className="bg-white border border-neutral-200 rounded-xl p-5">
              <h2 className="font-semibold text-neutral-900 mb-3">{sport}</h2>

              {coach ? (
                <>
                  <p className="text-sm text-neutral-600">
                    Email: <span className="text-neutral-800">{coach.email}</span>
                  </p>
                  <p className="text-xs text-neutral-400 mb-3">
                    Assigned to {coach.full_name} (since{' '}
                    {new Date(coach.created_at).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                    )
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      className="text-xs h-8"
                      onClick={() => handleResetPassword(coach.email)}
                    >
                      <KeyRound className="w-3.5 h-3.5 mr-1.5" />
                      Send Password Reset
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="text-xs h-8"
                      onClick={() => setResetTarget(coach)}
                    >
                      <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
                      Reset Profile
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="text-xs h-8"
                      onClick={() => handleSendNotification(coach.id)}
                    >
                      <Send className="w-3.5 h-3.5 mr-1.5" />
                      Send Notification
                    </Button>
                  </div>
                </>
              ) : (
                <div className="flex flex-col sm:flex-row gap-2">
                  <Input
                    placeholder="coach.email@psu.edu"
                    value={inviteEmails[sport] ?? ''}
                    onChange={(e) => setInviteEmails((prev) => ({ ...prev, [sport]: e.target.value }))}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    onClick={() => handleInvite(sport)}
                    className="bg-orange-500 hover:bg-orange-600 shrink-0"
                  >
                    <UserPlus className="w-4 h-4 mr-1.5" />
                    Invite Coach
                  </Button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {resetTarget && (
        <ConfirmDialog
          title="Clear this coach's profile details?"
          description={`${resetTarget.full_name}'s phone number, specialization, and years of experience will be cleared. They can fill them back in from their settings.`}
          confirmLabel="Clear Details"
          variant="danger"
          onConfirm={() => handleResetProfile(resetTarget.id)}
          onClose={() => setResetTarget(null)}
        />
      )}
    </>
  );
}