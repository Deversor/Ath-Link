import { useEffect, useState } from 'react';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import RegistrarPortalLayout from '../../components/layout/RegistrarPortalLayout';
import { supabase } from '../../lib/supabase';
import { useSports } from '../../hooks/useSports';

interface Athlete {
  id: string;
  full_name: string;
  student_id: string | null;
  sport: string | null;
  year_level: string | null;
}

export default function RegistrarApprovedAthletesPage() {
  const sports = useSports();
  const [athletes, setAthletes] = useState<Athlete[]>([]);

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('profiles')
        .select('id, full_name, student_id, sport, year_level')
        .eq('role', 'student')
        .eq('document_compile_status', 'registrar_approved');
      setAthletes(data ?? []);
    }
    load();
  }, []);

  const countFor = (sport: string) => athletes.filter((a) => a.sport === sport).length;

  return (
    <RegistrarPortalLayout>
      <div className="bg-white border border-neutral-200 rounded-xl p-6">
        <h1 className="flex items-center gap-2 text-lg font-bold text-neutral-900 mb-1">
          <CheckCircle2 className="w-5 h-5 text-green-600" />
          Approved Athletes
        </h1>
        <p className="text-sm text-neutral-500 mb-5">Athletes who have passed academic verification</p>

        {athletes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-neutral-400">
            <AlertCircle className="w-8 h-8 mb-2" />
            <p>No approved athletes yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {athletes.map((a) => (
              <div key={a.id} className="flex items-center justify-between rounded-lg border border-neutral-100 bg-neutral-50 px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-neutral-800">{a.full_name}</p>
                  <p className="text-xs text-neutral-500">{a.student_id} · {a.sport} · {a.year_level}</p>
                </div>
                <span className="text-xs font-medium bg-green-100 text-green-700 rounded-full px-2 py-0.5">Approved</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white border border-neutral-200 rounded-xl p-6">
        <h2 className="font-semibold text-neutral-900 mb-1">Summary by Sport</h2>
        <p className="text-sm text-neutral-500 mb-4">Approved athletes breakdown</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {sports.slice(0, 8).map((sport) => (
            <div key={sport} className="rounded-lg border border-neutral-100 bg-neutral-50 p-4 text-center">
              <p className="text-2xl font-bold text-green-600">{countFor(sport)}</p>
              <p className="text-xs text-neutral-500">{sport}</p>
            </div>
          ))}
        </div>
      </div>
    </RegistrarPortalLayout>
  );
}
