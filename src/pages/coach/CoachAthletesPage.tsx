import { useEffect, useState } from 'react';
import { FileText, Users, CheckCircle2, Send, Edit3 } from 'lucide-react';
import CoachPortalLayout from '../../components/layout/CoachPortalLayout';
import { useAuthStore } from '../../store/useAuthStore';
import { supabase } from '../../lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const REQUIRED_DOCS = [
  'Medical Clearance Certificate',
  'Latest Academic Record / Grade Sheet',
  'Parental Consent Form (for minors)',
  'Sports Eligibility Form',
  'ID Photo (2x2)',
];

interface Athlete {
  id: string;
  full_name: string;
  email: string;
  position: string | null;
  document_compile_status: string;
  revision_note: string | null;
  uploadedCount: number;
}

export default function CoachAthletesPage() {
  const { profile } = useAuthStore();
  const sport = profile?.sport ?? '';

  const [view, setView] = useState<'documents' | 'roster'>('documents');
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [deadline, setDeadline] = useState('2026-05-15');
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const loadAthletes = async () => {
    if (!sport) return;

    const { data: roster } = await supabase
      .from('profiles')
      .select('id, full_name, email, position, document_compile_status, revision_note')
      .eq('role', 'student')
      .eq('sport', sport);

    if (!roster) {
      setAthletes([]);
      return;
    }

    const ids = roster.map((r) => r.id);
    const { data: docs } = await supabase
      .from('document_submissions')
      .select('user_id, status')
      .in('user_id', ids.length > 0 ? ids : ['00000000-0000-0000-0000-000000000000'])
      .neq('status', 'missing');

    const counts: Record<string, number> = {};
    (docs ?? []).forEach((d) => {
      counts[d.user_id] = (counts[d.user_id] ?? 0) + 1;
    });

    setAthletes(
      roster.map((r) => ({
        ...r,
        document_compile_status: r.document_compile_status ?? 'not_ready',
        uploadedCount: counts[r.id] ?? 0,
      }))
    );
  };

  useEffect(() => {
    loadAthletes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sport]);

  const totalSubmissions = athletes.filter((a) => a.uploadedCount > 0).length;
  const approvedCount = athletes.filter((a) => a.uploadedCount >= 5).length;
  const compiledAthletes = athletes.filter((a) => a.document_compile_status === 'compiled');

  const handleCompile = async (athleteId: string) => {
    await supabase
      .from('profiles')
      .update({ document_compile_status: 'compiled', revision_note: null })
      .eq('id', athleteId);
    loadAthletes();
  };

  const handleSubmitAllToAdmin = async () => {
    const ids = compiledAthletes.map((a) => a.id);
    if (ids.length === 0) return;

    await supabase
      .from('profiles')
      .update({ document_compile_status: 'submitted_to_admin' })
      .in('id', ids);

    setActionMessage(`Submitted ${ids.length} athlete(s)' documents to Staff Admin and Super Admin for review.`);
    loadAthletes();
  };

  return (
    <CoachPortalLayout>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setView('documents')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium ${
            view === 'documents' ? 'bg-orange-500 text-white' : 'bg-white border border-neutral-200 text-neutral-600'
          }`}
        >
          <FileText className="w-4 h-4" />
          Documents
        </button>
        <button
          type="button"
          onClick={() => setView('roster')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium ${
            view === 'roster' ? 'bg-orange-500 text-white' : 'bg-white border border-neutral-200 text-neutral-600'
          }`}
        >
          <Users className="w-4 h-4" />
          Team Roster
        </button>
      </div>

      {view === 'documents' && (
        <>
          {/* Requirements */}
          <div className="bg-white border border-neutral-200 rounded-xl p-6">
            <h2 className="font-semibold text-neutral-900 mb-1">Document Submission Requirements</h2>
            <p className="text-sm text-neutral-500 mb-4">Define what documents your athletes must submit</p>

            <label className="block text-sm font-medium text-neutral-800 mb-1.5">Submission Deadline</label>
            <Input
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="mb-4 max-w-xs"
            />

            <div className="rounded-lg bg-neutral-50 border border-neutral-100 p-4 mb-4">
              <p className="text-sm font-medium text-neutral-800 mb-1.5">Current Requirements:</p>
              <ul className="list-disc list-inside text-sm text-neutral-600 space-y-0.5">
                {REQUIRED_DOCS.map((d) => (
                  <li key={d}>{d}</li>
                ))}
              </ul>
            </div>

            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setActionMessage('Requirement editing is coming in a future update.')}
              >
                <Edit3 className="w-4 h-4 mr-2" />
                Edit Requirements
              </Button>
              <Button
                type="button"
                className="flex-1 bg-orange-500 hover:bg-orange-600"
                onClick={() => setActionMessage('Requirements published and team notified.')}
              >
                <Send className="w-4 h-4 mr-2" />
                Publish & Notify Team
              </Button>
            </div>
          </div>

          {/* Athlete submissions */}
          <div className="bg-white border border-neutral-200 rounded-xl p-6">
            <div className="flex items-center justify-between mb-1">
              <h2 className="font-semibold text-neutral-900">Athlete Submissions</h2>
              <div className="text-right text-sm">
                <p className="font-semibold text-neutral-800">{totalSubmissions} Total Submissions</p>
                <p className="text-green-600">{approvedCount} Approved</p>
              </div>
            </div>
            <p className="text-sm text-neutral-500 mb-4">Review and compile athlete documents for {sport}</p>

            {athletes.length === 0 ? (
              <p className="text-sm text-neutral-400 text-center py-8">
                No document submissions yet for {sport}.
              </p>
            ) : (
              <div className="space-y-2">
                {athletes.map((a) => (
                  <div
                    key={a.id}
                    className={`rounded-lg border px-4 py-3 ${
                      a.revision_note ? 'border-red-200 bg-red-50' : 'border-neutral-100 bg-neutral-50'
                    }`}
                  >
                    {a.revision_note && (
                      <p className="text-xs font-medium text-red-700 mb-2">
                        ⚠ Sent back for revision by the Registrar: "{a.revision_note}"
                      </p>
                    )}
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-neutral-800">{a.full_name}</p>
                        <p className="text-xs text-neutral-500">{a.email}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-neutral-500">{a.uploadedCount}/5 uploaded</span>
                        <Button
                          type="button"
                          disabled={a.uploadedCount < 5 || a.document_compile_status !== 'not_ready'}
                          onClick={() => handleCompile(a.id)}
                          className="bg-green-600 hover:bg-green-700 disabled:bg-neutral-200 text-xs h-8"
                        >
                          {a.document_compile_status === 'not_ready'
                            ? a.revision_note
                              ? 'Re-compile'
                              : 'Compile'
                            : 'Compiled'}
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Compiled documents */}
          <div className="bg-white border border-purple-200 rounded-xl p-6">
            <div className="flex items-center justify-between mb-1">
              <h2 className="flex items-center gap-2 font-semibold text-purple-900">
                <CheckCircle2 className="w-4 h-4" />
                Compiled Documents
              </h2>
              <span className="text-xs font-semibold bg-purple-100 text-purple-700 rounded-full px-2.5 py-1">
                {compiledAthletes.length} Athletes Compiled
              </span>
            </div>
            <p className="text-sm text-neutral-500 mb-4">Documents ready to be submitted to Staff Admin and Super Admin</p>

            {compiledAthletes.length > 0 && (
              <div className="space-y-2 mb-4">
                {compiledAthletes.map((a) => (
                  <div
                    key={a.id}
                    className="flex items-center justify-between rounded-lg bg-white border border-neutral-100 px-4 py-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-purple-600 text-white flex items-center justify-center text-xs font-semibold">
                        {a.full_name.split(' ').map((n) => n[0]).slice(0, 2).join('')}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-neutral-800">{a.full_name}</p>
                        <p className="text-xs text-neutral-500">{a.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium bg-green-100 text-green-700 rounded-full px-2 py-0.5">
                        Compiled
                      </span>
                      {a.position && (
                        <span className="text-xs font-medium border border-neutral-200 text-neutral-600 rounded-full px-2 py-0.5">
                          {a.position}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {compiledAthletes.length > 0 && (
              <div className="rounded-lg bg-purple-50 border border-purple-100 px-4 py-3">
                <p className="flex items-center gap-1.5 text-sm font-medium text-purple-800 mb-1">
                  <CheckCircle2 className="w-4 h-4" />
                  Ready for Admin Review
                </p>
                <p className="text-xs text-purple-700 mb-3">
                  You have {compiledAthletes.length} athlete(s) with compiled documents ready to submit to Staff Admin and Super Admin for final verification and approval.
                </p>
                <Button
                  type="button"
                  onClick={handleSubmitAllToAdmin}
                  className="w-full bg-purple-600 hover:bg-purple-700"
                >
                  <Send className="w-4 h-4 mr-2" />
                  Submit All Compiled Documents to Admin ({compiledAthletes.length})
                </Button>
                <p className="text-xs text-purple-600 text-center mt-2">
                  Staff Admin and Super Admin will review and verify these documents before final approval
                </p>
              </div>
            )}

            {actionMessage && (
              <p className="text-sm text-green-700 bg-green-50 border border-green-100 rounded-lg px-3 py-2 mt-4">
                {actionMessage}
              </p>
            )}
          </div>
        </>
      )}

      {view === 'roster' && (
        <div className="bg-white border border-neutral-200 rounded-xl p-6">
          <h2 className="font-semibold text-neutral-900 mb-4">Team Roster — {sport}</h2>
          {athletes.length === 0 ? (
            <p className="text-sm text-neutral-400 text-center py-8">No athletes registered for {sport} yet.</p>
          ) : (
            <div className="space-y-2">
              {athletes.map((a) => (
                <div
                  key={a.id}
                  className="flex items-center justify-between rounded-lg border border-neutral-100 bg-neutral-50 px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-medium text-neutral-800">{a.full_name}</p>
                    <p className="text-xs text-neutral-500">{a.email}</p>
                  </div>
                  {a.position && <span className="text-xs text-neutral-500">{a.position}</span>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </CoachPortalLayout>
  );
}