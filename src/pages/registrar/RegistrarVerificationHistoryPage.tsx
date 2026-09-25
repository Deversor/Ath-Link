import { useEffect, useState } from 'react';
import { Clock, Archive } from 'lucide-react';
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

interface EligibilityRecord {
  id: string;
  full_name: string;
  student_id: string | null;
  sport: string | null;
  academic_term: string;
  gwa: number | null;
  pass_rate: number | null;
  eligibility_met: boolean | null;
  approved_at: string;
}

const STATUS_BADGE: Record<string, { label: string; className: string }> = {
  sent_to_registrar: { label: 'Pending', className: 'bg-neutral-800 text-white' },
  registrar_approved: { label: 'Approved', className: 'bg-green-600 text-white' },
  revision_requested: { label: 'Revision Requested', className: 'bg-red-600 text-white' },
};

export default function RegistrarVerificationHistoryPage() {
  const [tab, setTab] = useState<'current' | 'permanent'>('current');
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [gwaByProfile, setGwaByProfile] = useState<Record<string, GwaRecord>>({});
  const [eligibilityRecords, setEligibilityRecords] = useState<EligibilityRecord[]>([]);

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

      const { data: eligibility } = await supabase
        .from('eligibility_history')
        .select('id, full_name, student_id, sport, academic_term, gwa, pass_rate, eligibility_met, approved_at')
        .order('approved_at', { ascending: false });
      setEligibilityRecords(eligibility ?? []);
    }
    load();
  }, []);

  const termGroups = Array.from(new Set(eligibilityRecords.map((r) => r.academic_term)));

  return (
    <RegistrarPortalLayout>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setTab('current')}
          className={`px-4 py-2 rounded-lg text-sm font-medium ${
            tab === 'current' ? 'bg-orange-500 text-white' : 'bg-white border border-neutral-200 text-neutral-600'
          }`}
        >
          Current Cycle
        </button>
        <button
          type="button"
          onClick={() => setTab('permanent')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium ${
            tab === 'permanent' ? 'bg-orange-500 text-white' : 'bg-white border border-neutral-200 text-neutral-600'
          }`}
        >
          <Archive className="w-3.5 h-3.5" />
          Eligibility History (All Semesters)
        </button>
      </div>

      {tab === 'current' && (
        <div className="bg-white border border-neutral-200 rounded-xl p-6">
          <h1 className="flex items-center gap-2 text-lg font-bold text-neutral-900 mb-1">
            <Clock className="w-5 h-5 text-orange-500" />
            Verification History
          </h1>
          <p className="text-sm text-neutral-500 mb-5">
            Live status for the current cycle — this resets each new semester
          </p>

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
      )}

      {tab === 'permanent' && (
        <div className="bg-white border border-neutral-200 rounded-xl p-6">
          <h1 className="flex items-center gap-2 text-lg font-bold text-neutral-900 mb-1">
            <Archive className="w-5 h-5 text-orange-500" />
            Eligibility History
          </h1>
          <p className="text-sm text-neutral-500 mb-5">
            A permanent record of every approval, across every semester — this never gets overwritten or reset
          </p>

          {eligibilityRecords.length === 0 ? (
            <p className="text-sm text-neutral-400 text-center py-12">No approvals recorded yet.</p>
          ) : (
            <div className="space-y-6">
              {termGroups.map((term) => (
                <div key={term}>
                  <h2 className="text-sm font-semibold text-neutral-700 mb-2">{term}</h2>
                  <div className="space-y-2">
                    {eligibilityRecords
                      .filter((r) => r.academic_term === term)
                      .map((r) => (
                        <div
                          key={r.id}
                          className="flex items-center justify-between rounded-lg border border-neutral-100 bg-neutral-50 px-4 py-3"
                        >
                          <div>
                            <p className="text-sm font-medium text-neutral-800">{r.full_name}</p>
                            <p className="text-xs text-neutral-500">
                              {r.student_id ?? '—'} · {r.sport} · Approved {new Date(r.approved_at).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="text-right text-xs">
                            {r.gwa !== null ? (
                              <>
                                <p className="text-neutral-700">GWA: {Number(r.gwa).toFixed(2)}</p>
                                <p className={r.eligibility_met ? 'text-green-600' : 'text-red-600'}>
                                  {r.eligibility_met ? 'Eligible' : 'Not Eligible'}
                                </p>
                              </>
                            ) : (
                              <p className="text-neutral-400">No GWA on file</p>
                            )}
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </RegistrarPortalLayout>
  );
}