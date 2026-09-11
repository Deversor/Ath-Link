import { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ChevronLeft, ChevronRight, Building2, X } from 'lucide-react';
import CoachPortalLayout from '../../components/layout/CoachPortalLayout';
import { useAuthStore } from '../../store/useAuthStore';
import { supabase } from '../../lib/supabase';
import { getMonthGrid, toDateKey, WEEKDAY_LABELS, MONTH_LABELS } from '../../lib/calendarUtils';
import {
  facilityReservationSchema,
  type FacilityReservationValues,
} from '../../lib/schemas/facilityReservationSchema';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

interface Facility {
  id: string;
  name: string;
}

interface Reservation {
  id: string;
  facility_id: string;
  reservation_date: string;
  start_time: string;
  end_time: string;
  purpose: string;
  status: string;
}

type DayAvailability = 'available' | 'partial' | 'full' | 'past';

export default function CoachFacilityReservationPage() {
  const { user } = useAuthStore();
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [activeFacility, setActiveFacility] = useState<Facility | null>(null);
  const [view, setView] = useState<'calendar' | 'requests'>('calendar');
  const [cursor, setCursor] = useState(new Date());
  const [monthReservations, setMonthReservations] = useState<Reservation[]>([]);
  const [myRequests, setMyRequests] = useState<Reservation[]>([]);
  const [modalDate, setModalDate] = useState<Date | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const weeks = getMonthGrid(year, month);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Load facility list once
  useEffect(() => {
    async function loadFacilities() {
      const { data } = await supabase.from('facilities').select('id, name').order('name');
      setFacilities(data ?? []);
      if (data && data.length > 0) setActiveFacility(data[0]);
    }
    loadFacilities();
  }, []);

  // Load reservations for the active facility + visible month (for coloring the calendar)
  useEffect(() => {
    async function loadMonthReservations() {
      if (!activeFacility) return;
      const start = toDateKey(new Date(year, month, 1));
      const end = toDateKey(new Date(year, month + 1, 0));

      const { data } = await supabase
        .from('facility_reservations')
        .select('id, facility_id, reservation_date, start_time, end_time, purpose, status')
        .eq('facility_id', activeFacility.id)
        .gte('reservation_date', start)
        .lte('reservation_date', end)
        .neq('status', 'rejected');

      setMonthReservations(data ?? []);
    }
    loadMonthReservations();
  }, [activeFacility, year, month]);

  // Load "My Requests" across all facilities
  const loadMyRequests = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('facility_reservations')
      .select('id, facility_id, reservation_date, start_time, end_time, purpose, status')
      .eq('user_id', user.id)
      .order('reservation_date', { ascending: false });
    setMyRequests(data ?? []);
  };

  useEffect(() => {
    if (view === 'requests') loadMyRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view]);

  const getAvailability = (date: Date): DayAvailability => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    if (d < today) return 'past';

    const count = monthReservations.filter((r) => r.reservation_date === toDateKey(date)).length;
    if (count === 0) return 'available';
    if (count === 1) return 'partial';
    return 'full';
  };

  const AVAILABILITY_STYLES: Record<DayAvailability, string> = {
    available: 'bg-green-100 hover:bg-green-200 text-green-800 cursor-pointer',
    partial: 'bg-amber-100 hover:bg-amber-200 text-amber-800 cursor-pointer',
    full: 'bg-red-100 text-red-700 cursor-not-allowed',
    past: 'bg-neutral-100 text-neutral-400 cursor-not-allowed',
  };

  const facilityName = (id: string) => facilities.find((f) => f.id === id)?.name ?? 'Facility';

  return (
    <CoachPortalLayout>
      <div>
        <h1 className="text-xl font-bold text-neutral-900">Facility Reservations</h1>
        <p className="text-sm text-neutral-500">Reserve sports facilities for your team activities</p>
      </div>

      <div className="bg-white border border-neutral-200 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-neutral-900">Facility Reservations</h2>
            <p className="text-sm text-neutral-500">Reserve sports facilities for your activities</p>
          </div>
          <Building2 className="w-8 h-8 text-orange-200" />
        </div>

        {/* Calendar / My Requests toggle */}
        <div className="flex gap-2 mb-4">
          <button
            type="button"
            onClick={() => setView('calendar')}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              view === 'calendar' ? 'bg-orange-500 text-white' : 'bg-neutral-100 text-neutral-600'
            }`}
          >
            Calendar
          </button>
          <button
            type="button"
            onClick={() => setView('requests')}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              view === 'requests' ? 'bg-orange-500 text-white' : 'bg-neutral-100 text-neutral-600'
            }`}
          >
            My Requests
          </button>
        </div>

        {view === 'calendar' && (
          <>
            {/* Facility tabs */}
            <div className="flex flex-wrap gap-1 border-b border-neutral-100 mb-4">
              {facilities.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setActiveFacility(f)}
                  className={`px-3 py-2 text-xs sm:text-sm font-medium rounded-t-lg ${
                    activeFacility?.id === f.id
                      ? 'bg-orange-500 text-white'
                      : 'text-neutral-500 hover:bg-neutral-50'
                  }`}
                >
                  {f.name}
                </button>
              ))}
            </div>

            <div className="flex items-center justify-between mb-1">
              <div>
                <h3 className="font-semibold text-neutral-900">{activeFacility?.name}</h3>
                <p className="text-xs text-neutral-500">Select an available date to make a reservation</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCursor(new Date(year, month - 1, 1))}
                  className="w-8 h-8 rounded-lg border border-neutral-200 flex items-center justify-center hover:bg-neutral-50"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-sm font-medium w-28 text-center">
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

            <div className="grid grid-cols-7 text-center text-xs font-medium text-neutral-400 mt-4 mb-2">
              {WEEKDAY_LABELS.map((d) => (
                <div key={d}>{d}</div>
              ))}
            </div>

            <div className="space-y-1.5 mb-4">
              {weeks.map((week, wi) => (
                <div key={wi} className="grid grid-cols-7 gap-1.5">
                  {week.map((date, di) => {
                    if (!date) return <div key={di} className="aspect-square" />;
                    const status = getAvailability(date);
                    return (
                      <button
                        type="button"
                        key={di}
                        disabled={status === 'full' || status === 'past'}
                        onClick={() => setModalDate(date)}
                        className={`aspect-square rounded-lg text-sm font-medium transition-colors ${AVAILABILITY_STYLES[status]}`}
                      >
                        {date.getDate()}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>

            {/* Legend */}
            <div className="flex flex-wrap items-center gap-4 text-xs text-neutral-500 border-t border-neutral-100 pt-3">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-green-100 inline-block" /> Available
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-amber-100 inline-block" /> Partially Reserved
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-red-100 inline-block" /> Fully Reserved
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-neutral-100 inline-block" /> Past Date
              </span>
            </div>
          </>
        )}

        {view === 'requests' && (
          <div className="space-y-2">
            {myRequests.length === 0 ? (
              <p className="text-sm text-neutral-400 text-center py-8">No reservation requests yet.</p>
            ) : (
              myRequests.map((r) => (
                <div
                  key={r.id}
                  className="flex items-center justify-between rounded-lg border border-neutral-100 bg-neutral-50 px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-medium text-neutral-800">{facilityName(r.facility_id)}</p>
                    <p className="text-xs text-neutral-500">
                      {r.reservation_date} · {r.start_time}–{r.end_time}
                    </p>
                    <p className="text-xs text-neutral-500">{r.purpose}</p>
                  </div>
                  <span
                    className={`text-xs font-medium px-2 py-1 rounded-full capitalize ${
                      r.status === 'approved'
                        ? 'bg-green-100 text-green-700'
                        : r.status === 'rejected'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-amber-100 text-amber-700'
                    }`}
                  >
                    {r.status}
                  </span>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {modalDate && activeFacility && (
        <ReservationModal
          date={modalDate}
          facility={activeFacility}
          userId={user?.id}
          onClose={() => setModalDate(null)}
          onSubmitted={() => {
            setModalDate(null);
            setSubmitError(null);
            // refresh calendar coloring
            setCursor(new Date(cursor));
          }}
          onError={setSubmitError}
        />
      )}

      {submitError && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
          {submitError}
        </p>
      )}
    </CoachPortalLayout>
  );
}

function ReservationModal({
  date,
  facility,
  userId,
  onClose,
  onSubmitted,
  onError,
}: {
  date: Date;
  facility: Facility;
  userId: string | undefined;
  onClose: () => void;
  onSubmitted: () => void;
  onError: (msg: string) => void;
}) {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<FacilityReservationValues>({
    resolver: zodResolver(facilityReservationSchema),
  });

  const onSubmit = async (values: FacilityReservationValues) => {
    if (!userId) {
      onError('You must be logged in to make a reservation.');
      return;
    }

    const { error } = await supabase.from('facility_reservations').insert({
      facility_id: facility.id,
      user_id: userId,
      reservation_date: toDateKey(date),
      start_time: values.startTime,
      end_time: values.endTime,
      purpose: values.purpose,
      expected_attendees: values.expectedAttendees ?? null,
      status: 'pending',
    });

    if (error) {
      onError(error.message);
      return;
    }

    onSubmitted();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-xl bg-white shadow-xl p-6">
        <button
          type="button"
          aria-label="Close"
          onClick={onClose}
          className="absolute top-4 right-4 text-neutral-400 hover:text-neutral-600"
        >
          <X className="w-4 h-4" />
        </button>

        <h3 className="font-semibold text-neutral-900 mb-1">Reserve {facility.name}</h3>
        <p className="text-xs text-neutral-500 mb-4">
          Selected Date:{' '}
          {date.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
        </p>

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
          <div>
            <Label htmlFor="purpose" className="mb-1.5 block">
              Purpose *
            </Label>
            <textarea
              id="purpose"
              rows={2}
              placeholder="Describe the purpose of your reservation"
              className="w-full px-3 py-2.5 rounded-lg bg-neutral-100 border border-transparent focus:border-orange-500 focus:bg-white outline-none text-sm transition-colors resize-none"
              {...register('purpose')}
            />
            {errors.purpose && <p className="mt-1 text-xs text-red-600">{errors.purpose.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="startTime" className="mb-1.5 block">
                Start Time *
              </Label>
              <Input id="startTime" type="time" {...register('startTime')} />
              {errors.startTime && (
                <p className="mt-1 text-xs text-red-600">{errors.startTime.message}</p>
              )}
            </div>
            <div>
              <Label htmlFor="endTime" className="mb-1.5 block">
                End Time *
              </Label>
              <Input id="endTime" type="time" {...register('endTime')} />
              {errors.endTime && <p className="mt-1 text-xs text-red-600">{errors.endTime.message}</p>}
            </div>
          </div>

          <div>
            <Label htmlFor="expectedAttendees" className="mb-1.5 block">
              Expected Attendees
            </Label>
            <Input
              id="expectedAttendees"
              type="number"
              placeholder="Number of people"
              {...register('expectedAttendees', { valueAsNumber: true })}
            />
          </div>

          <div className="rounded-lg bg-blue-50 border border-blue-100 px-3 py-2.5 text-xs text-blue-700">
            By submitting this request, your personal information will be processed by PalSU Sports Office
            in compliance with RA 10173 for facility reservation management. You agree to abide by PalSU's
            facility use policies.
            <div className="flex items-start gap-2 mt-2">
              <Controller
                name="agree"
                control={control}
                defaultValue={false as any}
                render={({ field }) => (
                  <Checkbox
                    id="agree"
                    checked={field.value}
                    onCheckedChange={(checked: boolean | 'indeterminate') =>
                      field.onChange(checked === true)
                    }
                  />
                )}
              />
              <Label htmlFor="agree" className="text-xs font-normal leading-snug">
                I agree to the facility use policies and consent to data processing.
              </Label>
            </div>
          </div>
          {errors.agree && <p className="text-xs text-red-600">{errors.agree.message}</p>}

          <div className="flex gap-3">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300"
            >
              {isSubmitting ? 'Submitting…' : 'Submit Request'}
            </Button>
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}