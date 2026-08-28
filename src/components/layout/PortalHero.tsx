import { Trophy, Clock } from 'lucide-react';
import type { Profile } from '../../store/useAuthStore';

export default function PortalHero({ profile }: { profile: Profile | null }) {
  const firstName = profile?.first_name ?? profile?.full_name?.split(' ')[0] ?? 'Athlete';
  const lastNamePart = profile?.last_name ? ` ${profile.last_name}` : '';
  const displayName = profile?.full_name ?? `${firstName}${lastNamePart}`;

  return (
    <>
      {/* Welcome banner */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-orange-500 to-orange-400 text-white px-6 py-6">
        <Trophy className="absolute right-6 top-1/2 -translate-y-1/2 w-16 h-16 opacity-20" />
        <h1 className="text-xl md:text-2xl font-bold">Welcome back, {displayName || 'Athlete'}!</h1>
        <p className="text-sm text-orange-50 flex items-center gap-1.5 mt-1">
          <Trophy className="w-3.5 h-3.5" />
          {profile?.sport ?? 'Sport'} <span className="opacity-70">•</span> Student Athlete Portal
        </p>
      </div>

      {/* Eligibility status */}
      <div className="bg-white border border-neutral-200 rounded-xl p-4">
        <p className="flex items-center gap-2 text-sm font-medium text-neutral-800 mb-1">
          <Clock className="w-4 h-4 text-orange-500" />
          Eligibility Status
        </p>
        <p className="flex items-center gap-1.5 text-sm text-orange-600">
          <Clock className="w-3.5 h-3.5" />
          Pending Review - Documents under verification
        </p>
      </div>
    </>
  );
}
