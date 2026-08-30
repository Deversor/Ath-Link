import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Users, Calendar, CheckCircle2, ChevronRight } from 'lucide-react';
import CoachPortalLayout from '../../components/layout/CoachPortalLayout';
import { useAuthStore } from '../../store/useAuthStore';
import { supabase } from '../../lib/supabase';

interface UpcomingSession {
  id: string;
  schedule_date: string;
  start_time: string;
  location: string;
}

export default function CoachDashboardPage() {
  const { profile } = useAuthStore();
  const sport = profile?.sport ?? '';

  const [totalAthletes, setTotalAthletes] = useState(0);
  const [qualifiedCount, setQualifiedCount] = useState(0);
  const [upcomingCount, setUpcomingCount] = useState(0);
  const [totalScheduleCount, setTotalScheduleCount] = useState(0);
  const [totalSubmissions, setTotalSubmissions] = useState(0);
  const [upcoming, setUpcoming] = useState<UpcomingSession[]>([]);

  useEffect(() => {
    async function load() {
      if (!sport) return;
      const todayKey = new Date().toISOString().slice(0, 10);

      const { data: athletes } = await supabase
        .from('profiles')
        .select('id')
        .eq('role', 'student')
        .eq('sport', sport);

      const athleteIds = (athletes ?? []).map((a) => a.id);
      setTotalAthletes(athleteIds.length);

      if (athleteIds.length > 0) {
        const { data: docs } = await supabase
          .from('document_submissions')
          .select('user_id, status')
          .in('user_id', athleteIds)
          .neq('status', 'missing');

        setTotalSubmissions(docs?.length ?? 0);

        const byAthlete: Record<string, number> = {};
        (docs ?? []).forEach((d) => {
          byAthlete[d.user_id] = (byAthlete[d.user_id] ?? 0) + 1;
        });
        setQualifiedCount(Object.values(byAthlete).filter((count) => count >= 5).length);
      }

      const { count: total } = await supabase
        .from('practice_schedules')
        .select('id', { count: 'exact', head: true })
        .eq('sport', sport);
      setTotalScheduleCount(total ?? 0);

      const { data: sessions } = await supabase
        .from('practice_schedules')
        .select('id, schedule_date, start_time, location')
        .eq('sport', sport)
        .gte('schedule_date', todayKey)
        .order('schedule_date', { ascending: true })
        .limit(5);

      setUpcoming(sessions ?? []);
      setUpcomingCount(sessions?.length ?? 0);
    }
    load();
  }, [sport]);

  return (
    <CoachPortalLayout>
      {/* Welcome banner */}
      <div className="rounded-xl bg-gradient-to-r from-orange-500 to-orange-400 text-white px-6 py-6">
        <h1 className="text-xl md:text-2xl font-bold">
          Welcome, Coach {profile?.full_name ?? ''}!
        </h1>
        <p className="text-sm text-orange-50 mt-1">
          Managing {sport || 'your sport'} • {totalAthletes} Athletes
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border-l-4 border-orange-500 border-t border-r border-b border-neutral-200 rounded-xl p-4">
          <p className="text-sm text-neutral-500">Total Athletes</p>
          <p className="flex items-center gap-2 text-2xl font-bold text-neutral-900 mt-1">
            {totalAthletes} <Users className="w-5 h-5 text-orange-400" />
          </p>
          <p className="text-xs text-neutral-400 mt-1">{qualifiedCount} qualified</p>
        </div>

        <div className="bg-white border-l-4 border-blue-500 border-t border-r border-b border-neutral-200 rounded-xl p-4">
          <p className="text-sm text-neutral-500">Upcoming Schedules</p>
          <p className="flex items-center gap-2 text-2xl font-bold text-neutral-900 mt-1">
            {upcomingCount} <Calendar className="w-5 h-5 text-blue-400" />
          </p>
          <p className="text-xs text-neutral-400 mt-1">Total: {totalScheduleCount} schedules</p>
        </div>

        <div className="bg-white border-l-4 border-green-500 border-t border-r border-b border-neutral-200 rounded-xl p-4">
          <p className="text-sm text-neutral-500">Document Submissions</p>
          <p className="flex items-center gap-2 text-2xl font-bold text-neutral-900 mt-1">
            {totalSubmissions} <CheckCircle2 className="w-5 h-5 text-green-400" />
          </p>
          <p className="text-xs text-neutral-400 mt-1">{totalSubmissions} total submissions</p>
        </div>
      </div>

      {/* Quick actions */}
      <div>
        <h2 className="font-semibold text-neutral-900 mb-3">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link
            to="/coach/schedules"
            className="flex items-start justify-between bg-white border border-neutral-200 rounded-xl p-5 hover:border-orange-300 transition-colors"
          >
            <div>
              <Calendar className="w-6 h-6 text-orange-500 mb-2" />
              <p className="font-semibold text-neutral-900">Post Schedule</p>
              <p className="text-sm text-neutral-500">Create practice and training schedules</p>
            </div>
            <ChevronRight className="w-4 h-4 text-neutral-300 mt-1" />
          </Link>

          <Link
            to="/coach/athletes"
            className="flex items-start justify-between bg-white border border-neutral-200 rounded-xl p-5 hover:border-orange-300 transition-colors"
          >
            <div>
              <Users className="w-6 h-6 text-orange-500 mb-2" />
              <p className="font-semibold text-neutral-900">Manage Athletes</p>
              <p className="text-sm text-neutral-500">Review documents and manage roster</p>
            </div>
            <ChevronRight className="w-4 h-4 text-neutral-300 mt-1" />
          </Link>
        </div>
      </div>

      {/* Upcoming schedules */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-neutral-900">Upcoming Schedules</h2>
          <Link to="/coach/schedules" className="text-sm text-orange-600 font-medium hover:text-orange-700">
            View All
          </Link>
        </div>

        {upcoming.length === 0 ? (
          <p className="text-sm text-neutral-400 text-center py-8 bg-white border border-neutral-200 rounded-xl">
            No upcoming schedules.
          </p>
        ) : (
          <ul className="space-y-2">
            {upcoming.map((s) => (
              <li
                key={s.id}
                className="flex items-center justify-between bg-white border border-neutral-200 rounded-xl px-4 py-3 text-sm"
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
      </div>
    </CoachPortalLayout>
  );
}
