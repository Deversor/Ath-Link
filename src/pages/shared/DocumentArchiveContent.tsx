import { useEffect, useState } from 'react';
import { Archive, Search, FileText } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { slugifyTerm } from '../../lib/academicTerm';
import { Input } from '@/components/ui/input';

const DOC_TYPES = [
  { type: 'medical_clearance', label: 'Medical Clearance Certificate' },
  { type: 'academic_record', label: 'Academic Record / Grade Sheet' },
  { type: 'parental_consent', label: 'Parental Consent Form' },
  { type: 'eligibility_form', label: 'Sports Eligibility Form' },
  { type: 'id_photo', label: 'ID Photo (2x2)' },
];

interface Athlete {
  id: string;
  full_name: string;
  student_id: string | null;
  sport: string | null;
}

export function DocumentArchiveContent() {
  const [terms, setTerms] = useState<string[]>([]);
  const [selectedTerm, setSelectedTerm] = useState('');
  const [search, setSearch] = useState('');
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [selectedAthlete, setSelectedAthlete] = useState<Athlete | null>(null);
  const [uploadedTypes, setUploadedTypes] = useState<string[]>([]);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    async function loadTerms() {
      const { data } = await supabase.from('document_submissions').select('academic_term');
      const unique = Array.from(new Set((data ?? []).map((d) => d.academic_term))).sort().reverse();
      setTerms(unique);
      if (unique.length > 0) setSelectedTerm(unique[0]);
    }
    loadTerms();
  }, []);

  useEffect(() => {
    async function searchAthletes() {
      if (!search.trim()) {
        setAthletes([]);
        return;
      }
      const { data } = await supabase
        .from('profiles')
        .select('id, full_name, student_id, sport')
        .eq('role', 'student')
        .or(`full_name.ilike.%${search}%,student_id.ilike.%${search}%`)
        .limit(10);
      setAthletes(data ?? []);
    }
    const timeout = setTimeout(searchAthletes, 300);
    return () => clearTimeout(timeout);
  }, [search]);

  useEffect(() => {
    async function loadAthleteDocs() {
      if (!selectedAthlete || !selectedTerm) {
        setUploadedTypes([]);
        return;
      }
      const { data } = await supabase
        .from('document_submissions')
        .select('doc_type')
        .eq('user_id', selectedAthlete.id)
        .eq('academic_term', selectedTerm)
        .neq('status', 'missing');
      setUploadedTypes((data ?? []).map((d) => d.doc_type));
    }
    loadAthleteDocs();
  }, [selectedAthlete, selectedTerm]);

  const handleViewDocument = async (docType: string) => {
    if (!selectedAthlete) return;
    const { data, error } = await supabase.storage
      .from('documents')
      .createSignedUrl(`${selectedAthlete.id}/${slugifyTerm(selectedTerm)}/${docType}.pdf`, 60);
    if (error || !data) {
      setMessage(error?.message ?? "Couldn't open that document.");
      return;
    }
    window.open(data.signedUrl, '_blank');
  };

  return (
    <>
      <div>
        <h1 className="flex items-center gap-2 text-lg font-bold text-neutral-900">
          <Archive className="w-5 h-5 text-orange-500" />
          Document Archive
        </h1>
        <p className="text-sm text-neutral-500">
          Browse any athlete's submitted documents from any past semester — nothing is ever deleted on rollover
        </p>
      </div>

      <div className="bg-white border border-neutral-200 rounded-xl p-6 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-neutral-700 mb-1.5 block">Semester</label>
            <select
              value={selectedTerm}
              onChange={(e) => setSelectedTerm(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg bg-neutral-100 border border-transparent focus:border-orange-500 outline-none text-sm"
            >
              {terms.length === 0 && <option value="">No records yet</option>}
              {terms.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm text-neutral-700 mb-1.5 block">Find Athlete</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <Input
                placeholder="Search by name or student ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </div>

        {athletes.length > 0 && !selectedAthlete && (
          <div className="border border-neutral-100 rounded-lg divide-y divide-neutral-100">
            {athletes.map((a) => (
              <button
                key={a.id}
                type="button"
                onClick={() => {
                  setSelectedAthlete(a);
                  setSearch(a.full_name);
                  setAthletes([]);
                }}
                className="w-full text-left px-4 py-2.5 text-sm hover:bg-neutral-50"
              >
                <span className="font-medium text-neutral-800">{a.full_name}</span>{' '}
                <span className="text-neutral-400">
                  {a.student_id ?? '—'} · {a.sport ?? '—'}
                </span>
              </button>
            ))}
          </div>
        )}

        {message && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{message}</p>
        )}

        {selectedAthlete && selectedTerm && (
          <div className="rounded-lg border border-neutral-200 p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="font-semibold text-neutral-900">{selectedAthlete.full_name}</p>
                <p className="text-xs text-neutral-500">
                  {selectedAthlete.student_id ?? '—'} · {selectedAthlete.sport ?? '—'} · {selectedTerm}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedAthlete(null);
                  setSearch('');
                }}
                className="text-xs text-neutral-400 hover:text-neutral-600"
              >
                Clear
              </button>
            </div>

            <div className="space-y-1.5">
              {DOC_TYPES.map((d) => {
                const uploaded = uploadedTypes.includes(d.type);
                return (
                  <div key={d.type} className="flex items-center justify-between text-sm py-1">
                    <span className={`flex items-center gap-1.5 ${uploaded ? 'text-neutral-700' : 'text-neutral-400'}`}>
                      <FileText className="w-3.5 h-3.5" />
                      {d.label}
                    </span>
                    {uploaded ? (
                      <button
                        type="button"
                        onClick={() => handleViewDocument(d.type)}
                        className="text-orange-600 hover:text-orange-700 font-medium underline text-xs"
                      >
                        View
                      </button>
                    ) : (
                      <span className="text-xs text-neutral-300">Not on file for this term</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
