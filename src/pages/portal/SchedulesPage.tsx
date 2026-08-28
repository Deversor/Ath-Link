import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import PortalLayout from '../../components/layout/PortalLayout';
import PortalHero from '../../components/layout/PortalHero';
import { useAuthStore } from '../../store/useAuthStore';
import { supabase } from '../../lib/supabase';
import { getMonthGrid, toDateKey, isSameDay, WEEKDAY_LABELS, MONTH_LABELS } from '../../lib/calendarUtils';

interface Session {
  id: string;
  schedule_date: string;
  start_time: string;
  end_time: string | null;
  location: string;
  session_type: string | null;
}

export default function SchedulesPage() {
  const { profile } = useAuthStore();
  const [cursor, setCursor] = useState(new Date());
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const weeks = getMonthGrid(year, month);
  const today = new Date();

  useEffect(() => {
    async function load() {
      if (!profile?.sport) return;
      const start = toDateKey(new Date(year, month, 1));
      const end = toDateKey(new Date(year, month + 1, 0));

      const { data } = await supabase
        .from('practice_schedules')
        .select('id, schedule_date, start_time, end_time, location, session_type')
        .eq('sport', profile.sport)
        .gte('schedule_date', start)
        .lte('schedule_date', end);

      setSessions(data ?? []);
    }
    load();
  }, [year, month, profile?.sport]);

  const sessionsForDate = (date: Date) =>
    sessions.filter((s) => s.schedule_date === toDateKey(date));

  return (
    <PortalLayout>
      <PortalHero profile={profile} />

      <div className="bg-white border border-neutral-200 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-semibold text-neutral-900">
              Schedules Calendar - {profile?.sport ?? 'Your Sport'}
            </h2>
            <p className="text-sm text-neutral-500">View your practice and training schedules</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setCursor(new Date(year, month - 1, 1))}
              className="w-8 h-8 rounded-lg border border-neutral-200 flex items-center justify-center hover:bg-neutral-50"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm font-medium w-32 text-center">
              {MONTH_LABELS[month]} {year}
            </span>
            <button
              type="button"
              onClick={() => setCursor(new Date(year, month + 1, 1))}
              className="w-8 h-8 rounded-lg border border-neutral-200 flex items-center justify-center hover:bg-neutral-50"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 text-center text-xs font-medium text-neutral-400 mb-2">
          {WEEKDAY_LABELS.map((d) => (
            <div key={d}>{d}</div>
          ))}
        </div>

        <div className="space-y-1.5">
          {weeks.map((week, wi) => (
            <div key={wi} className="grid grid-cols-7 gap-1.5">
              {week.map((date, di) => {
                if (!date) return <div key={di} className="aspect-square" />;
                const daySessions = sessionsForDate(date);
                const isToday = isSameDay(date, today);
                return (
                  <button
                    type="button"
                    key={di}
                    onClick={() => setSelectedDate(date)}
                    className={`aspect-square rounded-lg border text-left p-1.5 text-xs transition-colors ${
                      isToday
                        ? 'border-orange-500 bg-orange-50'
                        : selectedDate && isSameDay(date, selectedDate)
                        ? 'border-orange-300 bg-orange-50/50'
                        : 'border-neutral-100 hover:bg-neutral-50'
                    }`}
                  >
                    <span className="font-medium text-neutral-700">{date.getDate()}</span>
                    {daySessions.length > 0 && (
                      <div className="mt-1 flex flex-wrap gap-0.5">
                        {daySessions.slice(0, 2).map((s) => (
                          <span key={s.id} className="w-1.5 h-1.5 rounded-full bg-orange-500 block" />
                        ))}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Selected day detail */}
      {selectedDate && (
        <div className="bg-white border border-neutral-200 rounded-xl p-6">
          <h3 className="flex items-center gap-2 font-semibold text-neutral-900 mb-3">
            <CalendarIcon className="w-4 h-4 text-orange-500" />
            {selectedDate.toLocaleDateString(undefined, {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
            })}
          </h3>

          {sessionsForDate(selectedDate).length === 0 ? (
            <p className="text-sm text-neutral-400">No practice scheduled for this day.</p>
          ) : (
            <ul className="space-y-2">
              {sessionsForDate(selectedDate).map((s) => (
                <li key={s.id} className="rounded-lg border border-neutral-100 bg-neutral-50 px-3 py-2.5 text-sm">
                  <p className="font-medium text-neutral-800">
                    {s.start_time}
                    {s.end_time ? ` – ${s.end_time}` : ''} {s.session_type ? `· ${s.session_type}` : ''}
                  </p>
                  <p className="text-neutral-500">{s.location}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </PortalLayout>
  );
}
