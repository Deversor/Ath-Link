import { CalendarCheck, LogIn, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ReadyToBookModalProps {
  facilityName: string;
  date: string;
  onSignIn: () => void;
  onCreateAccount: () => void;
  onClose: () => void;
}

export default function ReadyToBookModal({
  facilityName,
  date,
  onSignIn,
  onCreateAccount,
  onClose,
}: ReadyToBookModalProps) {
  const formattedDate = new Date(date).toLocaleDateString(undefined, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-sm rounded-xl bg-white shadow-xl p-6 text-center">
        <div className="w-14 h-14 rounded-full bg-orange-50 flex items-center justify-center mx-auto mb-4">
          <CalendarCheck className="w-6 h-6 text-orange-500" />
        </div>

        <h3 className="text-lg font-bold text-neutral-900 mb-1">Ready to book?</h3>
        <p className="text-sm text-neutral-500 mb-1">{facilityName}</p>
        <p className="text-sm text-neutral-500 mb-5">{formattedDate}</p>

        <p className="text-xs text-neutral-400 mb-5">
          You'll need to sign in or create a free account to submit a reservation request — it only takes a minute.
        </p>

        <div className="space-y-2">
          <Button type="button" className="w-full bg-orange-500 hover:bg-orange-600" onClick={onSignIn}>
            <LogIn className="w-4 h-4 mr-2" />
            Sign In
          </Button>
          <Button type="button" variant="outline" className="w-full" onClick={onCreateAccount}>
            <UserPlus className="w-4 h-4 mr-2" />
            Create an Account
          </Button>
          <button
            type="button"
            onClick={onClose}
            className="w-full text-xs text-neutral-400 hover:text-neutral-600 pt-1"
          >
            Not now, keep browsing
          </button>
        </div>
      </div>
    </div>
  );
}
