import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/useAuthStore';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

export default function TermsAcceptanceGate() {
  const { user, fetchProfile } = useAuthStore();
  const [agreed, setAgreed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAccept = async () => {
    if (!user) return;
    setIsSubmitting(true);
    await supabase.from('profiles').update({ terms_accepted_at: new Date().toISOString() }).eq('id', user.id);
    await fetchProfile();
    setIsSubmitting(false);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-md rounded-xl bg-white shadow-xl p-6">
        <div className="w-12 h-12 rounded-full bg-orange-50 flex items-center justify-center mb-4">
          <ShieldCheck className="w-6 h-6 text-orange-500" />
        </div>

        <h2 className="text-lg font-bold text-neutral-900 mb-1">Before you continue</h2>
        <p className="text-sm text-neutral-500 mb-5">
          Our Terms of Service and Privacy Policy have been updated since your account was created. Please review
          and accept them to keep using Ath-Link.
        </p>

        <div className="flex items-start gap-2 mb-5">
          <Checkbox id="gateAgree" checked={agreed} onCheckedChange={(c: boolean | 'indeterminate') => setAgreed(c === true)} />
          <Label htmlFor="gateAgree" className="text-sm font-normal leading-snug text-neutral-700">
            I have read and agree to the{' '}
            <Link to="/terms" target="_blank" className="text-orange-600 underline hover:text-orange-700">
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link to="/privacy-policy" target="_blank" className="text-orange-600 underline hover:text-orange-700">
              Privacy Policy
            </Link>
            .
          </Label>
        </div>

        <Button
          type="button"
          disabled={!agreed || isSubmitting}
          onClick={handleAccept}
          className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300"
        >
          {isSubmitting ? 'Saving…' : 'Accept & Continue'}
        </Button>
      </div>
    </div>
  );
}
