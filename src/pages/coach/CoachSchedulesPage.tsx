import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import CoachPortalLayout from '../../components/layout/CoachPortalLayout';
import { useAuthStore } from '../../store/useAuthStore';
import { supabase } from '../../lib/supabase';
import { postScheduleSchema, type PostScheduleValues } from '../../lib/schemas/postScheduleSchema';
import { getMonthGrid, toDateKey, WEEKDAY_LABELS, MONTH_LABELS } from '../../lib/calendarUtils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface Session {
  id: string;
  schedule_date: string;
  start_time: string;
}

export default function CoachSchedulesPage() {
  const { profile } = useAuthStore();
  const sport = profile?.sport ?? '';

  const [cursor, setCursor] = useState(new Date());
  const [sessions, setSessions] = useState<Session[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [upcomingCount, setUpcomingCount] = useState(0);
  const [postError, setPostError] = useState<string | null>(null);
  const [postSuccess, setPostSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<PostScheduleValues>({ resolver: zodResolver(postScheduleSchema) });

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const weeks = getMonthGrid(year, month);

  const loadCalendar = async () => {
    if (!sport) return;
    const start = toDateKey(new Date(year, month, 1));
    const end = toDateKey(new Date(year, month + 1, 0));

    const { data } = await supabase
      .from('practice_schedules')
      .select('id, schedule_date, start_time')
      .eq('sport', sport)
      .gte('schedule_date', start)
      .lte('schedule_date', end);
    setSessions(data ?? []);

    const { count: total } = await supabase
      .from('practice_schedules')
      .select('id', { count: 'exact', head: true })
      .eq('sport', sport);
    setTotalCount(total ?? 0);

    const { count: upcoming } = await supabase
      .from('practice_schedules')
      .select('id', { count: 'exact', head: true })
      .eq('sport', sport)
      .gte('schedule_date', toDateKey(new Date()));
    setUpcomingCount(upcoming ?? 0);
  };

  useEffect(() => {
    loadCalendar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sport, year, month]);

  const onSubmit = async (values: PostScheduleValues) => {
    setPostError(null);
    setPostSuccess(false);

    const { error } = await supabase.from('practice_schedules').insert({
      sport,
      schedule_date: values.date,
      start_time: values.time,
      duration: values.duration,
      location: values.location,
      session_type: values.sessionType,
      description: values.description || null,
      notes_for_athletes: values.notesForAthletes || null,
    });

    if (error) {
      setPostError(error.message);
      return;
    }

    setPostSuccess(true);
    reset();
    loadCalendar();
  };

  return (
    <CoachPortalLayout>
      <div>
        <h1 className="text-xl font-bold text-neutral-900">Practice Schedules</h1>
        <p className="text-sm text-neutral-500">Manage training schedules for your team</p>
      </div>

      {/* Post new schedule */}
      <div className="bg-white border-l-4 border-orange-500 border-t border-r border-b border-neutral-200 rounded-xl p-6">
        <h2 className="flex items-center gap-2 font-semibold text-neutral-900 mb-1">
          <Plus className="w-4 h-4 text-orange-500" />
          Post New Schedule
        </h2>
        <p className="text-sm text-neutral-500 mb-4">Your athletes will see this schedule in their portal immediately</p>

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="date" className="mb-1.5 block">
                Date *
              </Label>
              <Input id="date" type="date" {...register('date')} />
              {errors.date && <p className="mt-1 text-xs text-red-600">{errors.date.message}</p>}
            </div>
            <div>
              <Label htmlFor="time" className="mb-1.5 block">
                Time *
              </Label>
              <Input id="time" type="time" {...register('time')} />
              {errors.time && <p className="mt-1 text-xs text-red-600">{errors.time.message}</p>}
            </div>
            <div>
              <Label htmlFor="location" className="mb-1.5 block">
                Location *
              </Label>
              <Input id="location" placeholder="e.g., Main Gym, Field 1" {...register('location')} />
              {errors.location && (
                <p className="mt-1 text-xs text-red-600">{errors.location.message}</p>
              )}
            </div>
            <div>
              <Label htmlFor="duration" className="mb-1.5 block">
                Duration *
              </Label>
              <Input id="duration" placeholder="e.g., 2 hours" {...register('duration')} />
              {errors.duration && (
                <p className="mt-1 text-xs text-red-600">{errors.duration.message}</p>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="sessionType" className="mb-1.5 block">
              Type *
            </Label>
            <Input
              id="sessionType"
              placeholder="e.g., Regular Practice, Conditioning"
              {...register('sessionType')}
            />
            {errors.sessionType && (
              <p className="mt-1 text-xs text-red-600">{errors.sessionType.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="description" className="mb-1.5 block">
              Description
            </Label>
            <textarea
              id="description"
              rows={2}
              placeholder="Describe what will be covered in this session..."
              className="w-full px-3 py-2.5 rounded-lg bg-neutral-100 border border-transparent focus:border-orange-500 focus:bg-white outline-none text-sm transition-colors resize-none"
              {...register('description')}
            />
          </div>

          <div>
            <Label htmlFor="notesForAthletes" className="mb-1.5 block">
              Notes for Athletes
            </Label>
            <textarea
              id="notesForAthletes"
              rows={2}
              placeholder="Any special instructions or items to bring..."
              className="w-full px-3 py-2.5 rounded-lg bg-neutral-100 border border-transparent focus:border-orange-500 focus:bg-white outline-none text-sm transition-colors resize-none"
              {...register('notesForAthletes')}
            />
          </div>

          {postError && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
              {postError}
            </p>
          )}
          {postSuccess && (
            <p className="text-sm text-green-700 bg-green-50 border border-green-100 rounded-lg px-3 py-2">
              Schedule posted — your athletes can now see it.
            </p>
          )}

          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300"
          >
            <Plus className="w-4 h-4 mr-2" />
            {isSubmitting ? 'Posting…' : 'Post Schedule to Athletes'}
          </Button>
        </form>
      </div>

      {/* Posted schedules calendar */}
      <div className="bg-white border border-neutral-200 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-semibold text-neutral-900">Posted Schedules</h2>
            <p className="text-sm text-neutral-500">
              {totalCount} total schedules • Athletes can view these in real-time
            </p>
          </div>
          <span className="text-xs font-semibold bg-orange-100 text-orange-700 rounded-full px-2.5 py-1">
            {upcomingCount} Upcoming
          </span>
        </div>

        <div className="flex items-center justify-center gap-4 mb-3">
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
                const hasSession = sessions.some((s) => s.schedule_date === toDateKey(date));
                return (
                  <div
                    key={di}
                    className={`aspect-square rounded-lg border text-xs p-1.5 ${
                      hasSession ? 'border-orange-300 bg-orange-50' : 'border-neutral-100'
                    }`}
                  >
                    <span className="font-medium text-neutral-700">{date.getDate()}</span>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </CoachPortalLayout>
  );
}
