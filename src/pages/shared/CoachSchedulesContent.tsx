import { useEffect, useMemo, useState } from 'react';
import { Calendar, RefreshCw, Filter } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { toDateKey } from '../../lib/calendarUtils';

interface Session {
  id: string;
  sport: string;
  schedule_date: string;
  start_time: string;
  end_time: string | null;
  location: string;
  session_type: string | null;
}

interface CoachBySport {
  [sport: string]: string;
}

export function CoachSchedulesContent() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [coachBySport, setCoachBySport] = useState<CoachBySport>({});
  const [view, setView] = useState<'upcoming' | 'all'>('upcoming');
  const [sportFilter, setSportFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('');

  const load = async () => {
    const { data: schedules } = await supabase
      .from('practice_schedules')
      .select('id, sport, schedule_date, start_time, end_time, location, session_type')
      .order('schedule_date', { ascending: true });
    setSessions(schedules ?? []);

    const { data: coaches } = await supabase.from('profiles').select('sport, full_name').eq('role', 'coach');
    const map: CoachBySport = {};
    (coaches ?? []).forEach((c) => {
      if (c.sport) map[c.sport] = c.full_name;
    });
    setCoachBySport(map);
  };

  useEffect(() => {
    load();
  }, []);

  const todayKey = toDateKey(new Date());

  const sportOptions = useMemo(
    () => Array.from(new Set(sessions.map((s) => s.sport))).sort(),
    [sessions]
  );
  const typeOptions = useMemo(
    () => Array.from(new Set(sessions.map((s) => s.session_type).filter(Boolean))) as string[],
    [sessions]
  );

  const filtered = sessions.filter((s) => {
    if (view === 'upcoming' && s.schedule_date < todayKey) return false;
    if (sportFilter !== 'all' && s.sport !== sportFilter) return false;
    if (typeFilter !== 'all' && s.session_type !== typeFilter) return false;
    if (dateFilter && s.schedule_date !== dateFilter) return false;
    return true;
  });

  const upcomingCount = sessions.filter((s) => s.schedule_date >= todayKey).length;
  const todayCount = sessions.filter((s) => s.schedule_date === todayKey).length;
  const activeSportsCount = new Set(
    sessions.filter((s) => s.schedule_date >= todayKey).map((s) => s.sport)
  ).size;

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-neutral-900">Coach Schedules</h1>
          <p className="text-sm text-neutral-500">
            Monitor all coach-posted training sessions and team meetings for accountability
          </p>
        </div>
        <button
          type="button"
          onClick={load}
          className="flex items-center gap-1.5 text-sm border border-neutral-200 rounded-lg px-3 py-2 hover:bg-neutral-50"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-neutral-200 rounded-xl p-4">
          <p className="text-sm text-neutral-500">Upcoming Sessions</p>
          <p className="text-3xl font-bold text-orange-600 mt-1">{upcomingCount}</p>
          <p className="text-xs text-neutral-400 mt-1">Across all sports programs</p>
        </div>
        <div className="bg-white border border-neutral-200 rounded-xl p-4">
          <p className="text-sm text-neutral-500">Today's Sessions</p>
          <p className="text-3xl font-bold text-blue-600 mt-1">{todayCount}</p>
          <p className="text-xs text-neutral-400 mt-1">
            {new Date().toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
        </div>
        <div className="bg-white border border-neutral-200 rounded-xl p-4">
          <p className="text-sm text-neutral-500">Active Sports</p>
          <p className="text-3xl font-bold text-green-600 mt-1">{activeSportsCount}</p>
          <p className="text-xs text-neutral-400 mt-1">With upcoming schedules posted</p>
        </div>
      </div>

      <div className="bg-white border border-neutral-200 rounded-xl p-4">
        <p className="flex items-center gap-1.5 text-sm font-medium text-neutral-700 mb-3">
          <Filter className="w-4 h-4" />
          Filters
        </p>
        <div className="flex flex-wrap gap-2">
          <div className="flex rounded-lg overflow-hidden border border-neutral-200">
            <button
              type="button"
              onClick={() => setView('upcoming')}
              className={`px-3 py-2 text-sm ${view === 'upcoming' ? 'bg-orange-500 text-white' : 'bg-white text-neutral-600'}`}
            >
              Upcoming
            </button>
            <button
              type="button"
              onClick={() => setView('all')}
              className={`px-3 py-2 text-sm ${view === 'all' ? 'bg-orange-500 text-white' : 'bg-white text-neutral-600'}`}
            >
              All
            </button>
          </div>

          <select
            value={sportFilter}
            onChange={(e) => setSportFilter(e.target.value)}
            className="px-3 py-2 rounded-lg border border-neutral-200 text-sm text-neutral-600"
          >
            <option value="all">All Sports</option>
            {sportOptions.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 rounded-lg border border-neutral-200 text-sm text-neutral-600"
          >
            <option value="all">All Session Types</option>
            {typeOptions.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>

          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="px-3 py-2 rounded-lg border border-neutral-200 text-sm text-neutral-600"
          />
        </div>
      </div>

      <div className="bg-white border border-neutral-200 rounded-xl p-6">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-neutral-400">
            <Calendar className="w-10 h-10 mb-3" />
            <p>No schedules found</p>
            <p className="text-xs">No schedules match your current filters.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((s) => (
              <div
                key={s.id}
                className="flex items-center justify-between rounded-lg border border-neutral-100 bg-neutral-50 px-4 py-3 text-sm"
              >
                <div>
                  <p className="font-medium text-neutral-800">
                    {s.sport} {s.session_type ? `· ${s.session_type}` : ''}
                  </p>
                  <p className="text-xs text-neutral-500">
                    {s.schedule_date} · {s.start_time}
                    {s.end_time ? `–${s.end_time}` : ''} · {s.location}
                  </p>
                </div>
                <span className="text-xs text-neutral-500">
                  Coach: {coachBySport[s.sport] ?? '—'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
