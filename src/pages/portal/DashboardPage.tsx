import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FileText, Calendar } from 'lucide-react';
import PortalLayout from '../../components/layout/PortalLayout';
import PortalHero from '../../components/layout/PortalHero';
import { useAuthStore } from '../../store/useAuthStore';
import { supabase } from '../../lib/supabase';
import { getCurrentAcademicTerm } from '../../lib/academicTerm';
import { useSportDocumentRequirements } from '../../hooks/useSportDocumentRequirements';

interface DocStatus {
  doc_type: string;
  status: string;
}

interface UpcomingSession {
  id: string;
  schedule_date: string;
  start_time: string;
  location: string;
}

export default function DashboardPage() {
  const { profile } = useAuthStore();
  const { requirements } = useSportDocumentRequirements(profile?.sport);
  const [docStatuses, setDocStatuses] = useState<DocStatus[]>([]);
  const [upcoming, setUpcoming] = useState<UpcomingSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData.session?.user.id;
      if (!userId) return;

      const term = await getCurrentAcademicTerm();

      const [{ data: docs }, { data: schedules }] = await Promise.all([
        supabase.from('document_submissions').select('doc_type, status').eq('user_id', userId).eq('academic_term', term),
        supabase
          .from('practice_schedules')
          .select('id, schedule_date, start_time, location')
          .eq('sport', profile?.sport ?? '')
          .gte('schedule_date', new Date().toISOString().slice(0, 10))
          .order('schedule_date', { ascending: true })
          .limit(3),
      ]);

      setDocStatuses(docs ?? []);
      setUpcoming(schedules ?? []);
      setIsLoading(false);
    }

    load();
  }, [profile?.sport]);

  const totalRequired = requirements.length;
  const uploadedCount = requirements.filter((r) =>
    docStatuses.some((d) => d.doc_type === r.doc_type && d.status !== 'missing')
  ).length;

  return (
    <PortalLayout>
      <PortalHero profile={profile} />

      {/* Document submission tracker */}
      <div className="bg-white border border-neutral-200 rounded-xl p-6">
        <div className="flex items-center gap-2 mb-1">
          <FileText className="w-4 h-4 text-orange-500" />
          <h2 className="font-semibold text-neutral-900">Document Submission Tracker</h2>
        </div>
        <p className="text-sm text-neutral-500 mb-4">
          Track the status of your required eligibility documents. All {totalRequired} must be uploaded before submission.
        </p>

        <div className="flex items-center justify-between text-sm mb-1.5">
          <span className="text-neutral-600">Overall Progress</span>
          <span className="text-orange-600 font-medium">{uploadedCount} / {totalRequired} uploaded</span>
        </div>
        <div className="h-2 rounded-full bg-neutral-100 overflow-hidden mb-4">
          <div
            className="h-full bg-orange-500 transition-all"
            style={{ width: totalRequired > 0 ? `${(uploadedCount / totalRequired) * 100}%` : '0%' }}
          />
        </div>

        <div className="space-y-2">
          {requirements.map((r) => {
            const doc = docStatuses.find((d) => d.doc_type === r.doc_type);
            const isUploaded = doc && doc.status !== 'missing';
            return (
              <div
                key={r.doc_type}
                className="flex items-center justify-between px-3 py-2.5 rounded-lg border border-neutral-100 bg-neutral-50"
              >
                <span className="flex items-center gap-2 text-sm text-neutral-700">
                  <FileText className="w-4 h-4 text-neutral-400" />
                  {r.label}
                </span>
                <span
                  className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    isUploaded ? 'bg-green-100 text-green-700' : 'bg-neutral-200 text-neutral-500'
                  }`}
                >
                  {isUploaded ? 'Uploaded' : 'Missing'}
                </span>
              </div>
            );
          })}
        </div>

        {uploadedCount < totalRequired && (
          <div className="mt-4 flex items-center justify-between rounded-lg bg-amber-50 border border-amber-100 px-4 py-3">
            <div>
              <p className="text-sm font-medium text-amber-800">{totalRequired - uploadedCount} documents still needed</p>
              <p className="text-xs text-amber-700">Upload all required documents to submit to your coach.</p>
            </div>
            <Link
              to="/documents"
              className="text-sm bg-orange-500 hover:bg-orange-600 text-white font-medium px-4 py-2 rounded-lg"
            >
              Upload Now
            </Link>
          </div>
        )}
      </div>

      {/* Upcoming schedules */}
      <div className="bg-white border border-neutral-200 rounded-xl p-6">
        <div className="flex items-center gap-2 mb-1">
          <Calendar className="w-4 h-4 text-blue-600" />
          <h2 className="font-semibold text-neutral-900">Upcoming Schedules</h2>
        </div>
        <p className="text-sm text-neutral-500 mb-4">
          Your next practice sessions for {profile?.sport ?? 'your sport'}
        </p>

        {isLoading ? (
          <p className="text-sm text-neutral-400 text-center py-8">Loading…</p>
        ) : upcoming.length === 0 ? (
          <p className="text-sm text-neutral-400 text-center py-8">No upcoming schedules.</p>
        ) : (
          <ul className="space-y-2">
            {upcoming.map((s) => (
              <li
                key={s.id}
                className="flex items-center justify-between px-3 py-2.5 rounded-lg border border-neutral-100 bg-neutral-50 text-sm"
              >
                <span className="text-neutral-700">
                  {new Date(s.schedule_date).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                  })}{' '}
                  · {s.start_time}
                </span>
                <span className="text-neutral-500">{s.location}</span>
              </li>
            ))}
          </ul>
        )}

        <Link
          to="/schedules"
          className="block text-center text-sm text-orange-600 font-medium hover:text-orange-700 mt-4"
        >
          View Full Schedule →
        </Link>
      </div>
    </PortalLayout>
  );
}