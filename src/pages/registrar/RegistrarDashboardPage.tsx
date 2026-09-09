import { useEffect, useState } from 'react';
import { Users, FileText, GraduationCap, ChevronDown, ChevronRight, Eye, Check, RotateCcw } from 'lucide-react';
import RegistrarPortalLayout from '../../components/layout/RegistrarPortalLayout';
import { supabase } from '../../lib/supabase';
import { Button } from '@/components/ui/button';

const REQUIRED_DOCS = [
  { type: 'medical_clearance', label: 'Medical Clearance' },
  { type: 'academic_record', label: 'Grade Sheet' },
  { type: 'parental_consent', label: 'Parental Consent' },
  { type: 'eligibility_form', label: 'Eligibility Form' },
  { type: 'id_photo', label: 'ID Photo' },
];

interface Athlete {
  id: string;
  full_name: string;
  student_id: string | null;
  sport: string | null;
  position: string | null;
  year_level: string | null;
  document_compile_status: string;
  uploadedDocTypes: string[];
}

interface SportGroup {
  sport: string;
  athletes: Athlete[];
}

export default function RegistrarDashboardPage() {
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [expandedSport, setExpandedSport] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const load = async () => {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name, student_id, sport, position, year_level, document_compile_status')
      .eq('role', 'student')
      .in('document_compile_status', ['sent_to_registrar', 'revision_requested']);

    const ids = (profiles ?? []).map((p) => p.id);
    let docsByAthlete: Record<string, string[]> = {};
    if (ids.length > 0) {
      const { data: docs } = await supabase
        .from('document_submissions')
        .select('user_id, doc_type')
        .in('user_id', ids)
        .neq('status', 'missing');
      docsByAthlete = {};
      (docs ?? []).forEach((d) => {
        docsByAthlete[d.user_id] = [...(docsByAthlete[d.user_id] ?? []), d.doc_type];
      });
    }

    setAthletes(
      (profiles ?? []).map((p) => ({ ...p, uploadedDocTypes: docsByAthlete[p.id] ?? [] }))
    );
  };

  useEffect(() => {
    load();
  }, []);

  const groups: SportGroup[] = Array.from(new Set(athletes.map((a) => a.sport ?? 'Unassigned'))).map((sport) => ({
    sport,
    athletes: athletes.filter((a) => (a.sport ?? 'Unassigned') === sport),
  }));

  const totalPending = athletes.length;
  const totalDocuments = athletes.reduce((sum, a) => sum + a.uploadedDocTypes.length, 0);
  const graduatingCount = athletes.filter((a) => a.year_level?.toLowerCase().includes('4th')).length;

  const handleApprove = async (athleteId: string) => {
    await supabase.from('profiles').update({ document_compile_status: 'registrar_approved' }).eq('id', athleteId);
    setMessage('Athlete approved.');
    load();
  };

  const handleRequestRevision = async (athleteId: string) => {
    await supabase.from('profiles').update({ document_compile_status: 'revision_requested' }).eq('id', athleteId);
    setMessage('Revision requested — the coach will need to resubmit.');
    load();
  };

  const handleApproveAll = async (group: SportGroup) => {
    const ids = group.athletes.map((a) => a.id);
    await supabase.from('profiles').update({ document_compile_status: 'registrar_approved' }).in('id', ids);
    setMessage(`Approved all ${group.athletes.length} ${group.sport} athletes.`);
    load();
  };

  return (
    <RegistrarPortalLayout>
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Registrar Portal</h1>
        <p className="text-sm text-neutral-500">Final review and verification of athlete documents</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-neutral-200 rounded-xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
            <Users className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-neutral-900">{totalPending}</p>
            <p className="text-xs text-neutral-500">Total Pending Review</p>
          </div>
        </div>
        <div className="bg-white border border-neutral-200 rounded-xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
            <FileText className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-neutral-900">{totalDocuments}</p>
            <p className="text-xs text-neutral-500">Total Documents</p>
          </div>
        </div>
        <div className="bg-white border border-neutral-200 rounded-xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
            <GraduationCap className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-neutral-900">{graduatingCount}</p>
            <p className="text-xs text-neutral-500">Graduating Students</p>
          </div>
        </div>
      </div>

      {message && (
        <p className="text-sm text-green-700 bg-green-50 border border-green-100 rounded-lg px-3 py-2">
          {message}
        </p>
      )}

      <div>
        <h2 className="font-semibold text-neutral-900 mb-1">Athletes Gallery — Document Verification</h2>
        <p className="text-sm text-neutral-500 mb-4">
          Review and verify documents submitted by the sports office, organized by sport
        </p>

        {groups.length === 0 ? (
          <p className="text-sm text-neutral-400 text-center py-12 bg-white border border-neutral-200 rounded-xl">
            No athletes sent for final review yet.
          </p>
        ) : (
          <div className="space-y-3">
            {groups.map((group) => {
              const isOpen = expandedSport === group.sport;
              return (
                <div key={group.sport} className="bg-white border border-orange-100 rounded-xl overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setExpandedSport(isOpen ? null : group.sport)}
                    className="w-full flex items-center justify-between px-4 py-3 bg-orange-50 hover:bg-orange-100 transition-colors"
                  >
                    <span className="flex items-center gap-2 font-semibold text-neutral-900">
                      {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                      {group.sport}
                      <span className="text-xs font-normal text-neutral-500">
                        {group.athletes.length} athlete{group.athletes.length === 1 ? '' : 's'} · {group.athletes.reduce((s, a) => s + a.uploadedDocTypes.length, 0)} documents to review
                      </span>
                    </span>
                    <span className="text-xs font-medium bg-amber-100 text-amber-700 rounded-full px-2 py-0.5">
                      Pending Review
                    </span>
                  </button>

                  {isOpen && (
                    <div className="p-4 space-y-3">
                      {group.athletes.map((a) => (
                        <div key={a.id} className="border border-neutral-100 rounded-lg p-4">
                          <p className="font-medium text-neutral-900">{a.full_name}</p>
                          <p className="text-xs text-neutral-500 mb-2">
                            {a.student_id ?? '—'} · {a.sport} · {a.position ?? '—'} · {a.year_level ?? '—'}
                            {a.document_compile_status === 'revision_requested' && (
                              <span className="ml-2 text-red-600 font-medium">(Revision Requested)</span>
                            )}
                          </p>
                          <p className="text-xs text-neutral-500 mb-3">
                            Submitted Documents:{' '}
                            {REQUIRED_DOCS.map((d) => (
                              <span
                                key={d.type}
                                className={`inline-block mr-2 ${
                                  a.uploadedDocTypes.includes(d.type) ? 'text-green-600' : 'text-neutral-300'
                                }`}
                              >
                                ✓ {d.label}
                              </span>
                            ))}
                          </p>
                          <div className="flex gap-2">
                            <Button type="button" variant="outline" className="text-xs h-8">
                              <Eye className="w-3.5 h-3.5 mr-1.5" />
                              View Details & Documents
                            </Button>
                            <Button
                              type="button"
                              className="text-xs h-8 bg-green-600 hover:bg-green-700"
                              onClick={() => handleApprove(a.id)}
                            >
                              <Check className="w-3.5 h-3.5 mr-1.5" />
                              Approve Documents
                            </Button>
                            <Button
                              type="button"
                              className="text-xs h-8 bg-red-600 hover:bg-red-700"
                              onClick={() => handleRequestRevision(a.id)}
                            >
                              <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
                              Request Revision
                            </Button>
                          </div>
                        </div>
                      ))}
                      <Button
                        type="button"
                        className="w-full bg-green-600 hover:bg-green-700"
                        onClick={() => handleApproveAll(group)}
                      >
                        <Check className="w-4 h-4 mr-1.5" />
                        Approve All {group.sport} Documents ({group.athletes.length} athletes)
                      </Button>
                    </div>
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
