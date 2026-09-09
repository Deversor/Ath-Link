import { useEffect, useState } from 'react';
import { Clock } from 'lucide-react';
import RegistrarPortalLayout from '../../components/layout/RegistrarPortalLayout';
import { supabase } from '../../lib/supabase';

interface Profile {
  id: string;
  full_name: string;
  student_id: string | null;
  sport: string | null;
  year_level: string | null;
  document_compile_status: string;
}

interface GwaRecord {
  profile_id: string | null;
  student_id_text: string | null;
  gwa: number;
  total_units: number;
  pass_rate: number;
  eligibility_met: boolean;
  created_at: string;
}

const STATUS_BADGE: Record<string, { label: string; className: string }> = {
  sent_to_registrar: { label: 'Pending', className: 'bg-neutral-800 text-white' },
  registrar_approved: { label: 'Approved', className: 'bg-green-600 text-white' },
  revision_requested: { label: 'Revision Requested', className: 'bg-red-600 text-white' },
};

export default function RegistrarVerificationHistoryPage() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [gwaByProfile, setGwaByProfile] = useState<Record<string, GwaRecord>>({});

  useEffect(() => {
    async function load() {
      const { data: profs } = await supabase
        .from('profiles')
        .select('id, full_name, student_id, sport, year_level, document_compile_status')
        .eq('role', 'student')
        .in('document_compile_status', ['sent_to_registrar', 'registrar_approved']);
      setProfiles(profs ?? []);

      const { data: records } = await supabase
        .from('gwa_records')
        .select('profile_id, student_id_text, gwa, total_units, pass_rate, eligibility_met, created_at')
        .order('created_at', { ascending: false });

      const map: Record<string, GwaRecord> = {};
      (profs ?? []).forEach((p) => {
        const match = (records ?? []).find(
          (r) => r.profile_id === p.id || (p.student_id && r.student_id_text === p.student_id)
        );
        if (match) map[p.id] = match;
      });
      setGwaByProfile(map);
    }
    load();
  }, []);

  return (
    <RegistrarPortalLayout>
      <div className="bg-white border border-neutral-200 rounded-xl p-6">
        <h1 className="flex items-center gap-2 text-lg font-bold text-neutral-900 mb-1">
          <Clock className="w-5 h-5 text-orange-500" />
          Verification History
        </h1>
        <p className="text-sm text-neutral-500 mb-5">Complete log of all athlete verifications</p>

        {profiles.length === 0 ? (
          <p className="text-sm text-neutral-400 text-center py-12">No verification activity yet.</p>
        ) : (
          <div className="space-y-3">
            {profiles.map((p) => {
              const gwa = gwaByProfile[p.id];
              const badge = STATUS_BADGE[p.document_compile_status] ?? {
                label: p.document_compile_status,
                className: 'bg-neutral-200 text-neutral-600',
              };
              return (
                <div key={p.id} className="rounded-lg border border-neutral-100 bg-neutral-50 p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-medium text-neutral-900">{p.full_name}</p>
                    <span className={`text-xs font-medium rounded-full px-2 py-0.5 ${badge.className}`}>
                      {badge.label}
                    </span>
                  </div>
                  <p className="text-xs text-neutral-500 mb-2">
                    {p.student_id ?? '—'} · {p.sport} · {p.year_level}
                  </p>
                  {gwa ? (
                    <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
                      <span>
                        <span className="text-neutral-500">GWA:</span>{' '}
                        <span className="font-medium text-neutral-800">{Number(gwa.gwa).toFixed(2)}</span>
                      </span>
                      <span>
                        <span className="text-neutral-500">Units:</span>{' '}
                        <span className="font-medium text-neutral-800">{gwa.total_units}</span>
                      </span>
                      <span>
                        <span className="text-neutral-500">Pass Rate:</span>{' '}
                        <span className="font-medium text-neutral-800">{Number(gwa.pass_rate).toFixed(1)}%</span>
                      </span>
                      <span>
                        <span className="text-neutral-500">Eligibility:</span>{' '}
                        <span className={`font-medium ${gwa.eligibility_met ? 'text-green-600' : 'text-red-600'}`}>
                          {gwa.eligibility_met ? 'Met' : 'Not Met'}
                        </span>
                      </span>
                    </div>
                  ) : (
                    <p className="text-xs text-neutral-400">No GWA calculated yet — use the GWA Calculator.</p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </RegistrarPortalLayout>
  );
}