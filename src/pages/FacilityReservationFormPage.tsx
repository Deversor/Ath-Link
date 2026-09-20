import { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { Building2, CheckCircle2, Trophy } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/useAuthStore';
import {
  facilityReservationFormSchema,
  type FacilityReservationFormValues,
  EVENT_TYPES,
} from '../lib/schemas/facilityReservationFormSchema';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';

interface Facility {
  id: string;
  name: string;
}

interface HandoffState {
  facilityId?: string;
  date?: string;
}

export default function FacilityReservationFormPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, profile, isInitialized, init } = useAuthStore();
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Pull the intended facility/date from wherever it came from — a direct
  // click on the calendar (router state) or a resumed flow after
  // signing in (sessionStorage, set on the guest browsing page).
  const handoff = (location.state ?? {}) as HandoffState;
  const storedIntent = sessionStorage.getItem('pendingReservationIntent');
  const parsedIntent = storedIntent ? (JSON.parse(storedIntent) as HandoffState) : null;
  const initialFacilityId = handoff.facilityId ?? parsedIntent?.facilityId ?? '';
  const initialDate = handoff.date ?? parsedIntent?.date ?? '';

  useEffect(() => {
    if (!isInitialized) init();
  }, [isInitialized, init]);

  useEffect(() => {
    async function loadFacilities() {
      const { data } = await supabase.from('facilities').select('id, name').order('name');
      setFacilities(data ?? []);
    }
    loadFacilities();
  }, []);

  const {
    register,
    handleSubmit,
    watch,
    control,
    formState: { errors, isSubmitting },
  } = useForm<FacilityReservationFormValues>({
    resolver: zodResolver(facilityReservationFormSchema),
    defaultValues: {
      facilityId: initialFacilityId,
      eventDate: initialDate,
      reservationType: 'event',
    },
  });

  const reservationType = watch('reservationType');
  const eventType = watch('eventType');
  const canChoosePracticeSession = profile?.role === 'student' || profile?.role === 'coach';

  if (isInitialized && !user) {
    navigate('/login', { state: { redirectTo: '/facility-reservation' } });
    return null;
  }

  const onSubmit = async (values: FacilityReservationFormValues) => {
    setSubmitError(null);

    const { data, error } = await supabase.rpc('create_reservation', {
      p_reservation: {
        facility_id: values.facilityId,
        reservation_date: values.eventDate,
        start_time: values.startTime,
        end_time: values.endTime,
        purpose: values.purpose,
        expected_attendees: String(values.expectedAttendees),
        reservation_type: values.reservationType,
        prep_date: values.prepDate ?? '',
        prep_time: values.prepTime ?? '',
        event_duration: values.eventDuration ?? '',
        event_title: values.eventTitle,
        organization_name: values.organizationName ?? '',
        event_type: values.eventType,
        other_event_type: values.otherEventType ?? '',
        contact_full_name: values.contactFullName,
        contact_email: values.contactEmail,
        contact_number: values.contactNumber,
        palsu_id_no: values.palsuIdNo ?? '',
        other_reminders: values.otherReminders ?? '',
      },
    });

    if (error) {
      setSubmitError(error.message);
      return;
    }

    if (!data?.success) {
      setSubmitError(data?.error ?? 'Could not submit your reservation. Please try a different time.');
      return;
    }

    sessionStorage.removeItem('pendingReservationIntent');
    setSuccess(true);
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50 px-4">
        <div className="w-full max-w-md bg-white border border-neutral-200 rounded-xl shadow-sm p-8 text-center">
          <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-6 h-6 text-green-600" />
          </div>
          <h1 className="text-xl font-bold text-neutral-900 mb-1">Request Submitted</h1>
          <p className="text-neutral-500 text-sm mb-6">
            Your reservation request is now <strong>Pending Review</strong>. You'll be notified once the Sports
            Office makes a decision. Track its status any time under My Requests.
          </p>
          <Link to="/facility-reservation">
            <Button className="w-full bg-orange-500 hover:bg-orange-600">Back to Facility Booking</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <header className="bg-neutral-950 text-white px-6 py-3 flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-orange-500 flex items-center justify-center">
          <Trophy className="w-4 h-4 text-white" />
        </div>
        <span className="font-semibold">
          PalawanSU <span className="text-orange-500">AthLink</span>
        </span>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-8">
        <Link to="/facility-reservation" className="text-sm text-neutral-500 hover:text-neutral-700">
          ← Back to Facility Booking
        </Link>

        <h1 className="flex items-center gap-2 text-xl font-bold text-neutral-900 mt-3 mb-1">
          <Building2 className="w-5 h-5 text-orange-500" />
          New Facility Reservation
        </h1>
        <p className="text-sm text-neutral-500 mb-6">Fill in the details below to submit your request.</p>

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-6">
          {/* Reservation type — only Students and Coaches get to choose Practice Session */}
          {canChoosePracticeSession && (
            <div className="bg-white border border-neutral-200 rounded-xl p-6">
              <h2 className="font-semibold text-neutral-900 mb-3">What is this reservation for?</h2>
              <div className="grid grid-cols-2 gap-3">
                {(['event', 'practice'] as const).map((t) => (
                  <label
                    key={t}
                    className={`flex items-center justify-center gap-2 rounded-lg border p-3 text-sm cursor-pointer ${
                      reservationType === t ? 'border-orange-500 bg-orange-50 text-orange-700' : 'border-neutral-200 text-neutral-600'
                    }`}
                  >
                    <input type="radio" value={t} {...register('reservationType')} className="hidden" />
                    {t === 'event' ? 'Event / Activity' : 'Practice Session'}
                  </label>
                ))}
              </div>
              {errors.reservationType && (
                <p className="mt-2 text-xs text-red-600">{errors.reservationType.message}</p>
              )}
            </div>
          )}

          {/* Hidden field so the form still submits 'event' for roles that don't get a choice */}
          {!canChoosePracticeSession && <input type="hidden" value="event" {...register('reservationType')} />}

          {/* Facility + schedule */}
          <div className="bg-white border border-neutral-200 rounded-xl p-6 space-y-4">
            <h2 className="font-semibold text-neutral-900">Facility & Schedule</h2>

            <div>
              <Label htmlFor="facilityId" className="mb-1.5 block">
                Facility
              </Label>
              <select
                id="facilityId"
                className="w-full px-3 py-2.5 rounded-lg bg-neutral-100 border border-transparent focus:border-orange-500 outline-none text-sm"
                {...register('facilityId')}
              >
                <option value="" disabled>
                  Select a facility
                </option>
                {facilities.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
              </select>
              {errors.facilityId && <p className="mt-1 text-xs text-red-600">{errors.facilityId.message}</p>}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="prepDate" className="mb-1.5 block">
                  Preparation Date
                </Label>
                <Input id="prepDate" type="date" {...register('prepDate')} />
              </div>
              <div>
                <Label htmlFor="prepTime" className="mb-1.5 block">
                  Preparation Time
                </Label>
                <Input id="prepTime" type="time" {...register('prepTime')} />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="eventDate" className="mb-1.5 block">
                  Event/Session Date *
                </Label>
                <Input id="eventDate" type="date" {...register('eventDate')} />
                {errors.eventDate && <p className="mt-1 text-xs text-red-600">{errors.eventDate.message}</p>}
              </div>
              <div>
                <Label htmlFor="eventDuration" className="mb-1.5 block">
                  Event Duration
                </Label>
                <Input id="eventDuration" placeholder="e.g., 2 hours, half-day" {...register('eventDuration')} />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="startTime" className="mb-1.5 block">
                  Start Time *
                </Label>
                <Input id="startTime" type="time" {...register('startTime')} />
                {errors.startTime && <p className="mt-1 text-xs text-red-600">{errors.startTime.message}</p>}
              </div>
              <div>
                <Label htmlFor="endTime" className="mb-1.5 block">
                  End Time *
                </Label>
                <Input id="endTime" type="time" {...register('endTime')} />
                {errors.endTime && <p className="mt-1 text-xs text-red-600">{errors.endTime.message}</p>}
              </div>
            </div>
          </div>

          {/* Event details */}
          <div className="bg-white border border-neutral-200 rounded-xl p-6 space-y-4">
            <h2 className="font-semibold text-neutral-900">
              {reservationType === 'practice' ? 'Session Details' : 'Event Details'}
            </h2>

            <div>
              <Label htmlFor="eventTitle" className="mb-1.5 block">
                {reservationType === 'practice' ? 'Session Title' : 'Event Title'} *
              </Label>
              <Input id="eventTitle" placeholder="e.g., Basketball Practice, Freshmen Orientation" {...register('eventTitle')} />
              {errors.eventTitle && <p className="mt-1 text-xs text-red-600">{errors.eventTitle.message}</p>}
            </div>

            {reservationType === 'event' && (
              <div>
                <Label htmlFor="organizationName" className="mb-1.5 block">
                  Name of Organization *
                </Label>
                <Input id="organizationName" placeholder="e.g., College of Engineering Student Council" {...register('organizationName')} />
                {errors.organizationName && (
                  <p className="mt-1 text-xs text-red-600">{errors.organizationName.message}</p>
                )}
              </div>
            )}

            <div>
              <Label htmlFor="eventType" className="mb-1.5 block">
                Event Type *
              </Label>
              <select
                id="eventType"
                defaultValue=""
                className="w-full px-3 py-2.5 rounded-lg bg-neutral-100 border border-transparent focus:border-orange-500 outline-none text-sm"
                {...register('eventType')}
              >
                <option value="" disabled>
                  Select event type
                </option>
                {EVENT_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
              {errors.eventType && <p className="mt-1 text-xs text-red-600">{errors.eventType.message}</p>}
            </div>

            {eventType === 'Other' && (
              <div>
                <Label htmlFor="otherEventType" className="mb-1.5 block">
                  Please specify
                </Label>
                <Input id="otherEventType" {...register('otherEventType')} />
                {errors.otherEventType && (
                  <p className="mt-1 text-xs text-red-600">{errors.otherEventType.message}</p>
                )}
              </div>
            )}

            <div>
              <Label htmlFor="purpose" className="mb-1.5 block">
                Purpose *
              </Label>
              <textarea
                id="purpose"
                rows={3}
                placeholder="Describe the purpose of your reservation"
                className="w-full px-3 py-2.5 rounded-lg bg-neutral-100 border border-transparent focus:border-orange-500 outline-none text-sm resize-none"
                {...register('purpose')}
              />
              {errors.purpose && <p className="mt-1 text-xs text-red-600">{errors.purpose.message}</p>}
            </div>

            <div>
              <Label htmlFor="expectedAttendees" className="mb-1.5 block">
                Estimated Number of Attendees *
              </Label>
              <Input
                id="expectedAttendees"
                type="number"
                {...register('expectedAttendees', { valueAsNumber: true })}
              />
              {errors.expectedAttendees && (
                <p className="mt-1 text-xs text-red-600">{errors.expectedAttendees.message}</p>
              )}
            </div>
          </div>

          {/* Contact person */}
          <div className="bg-white border border-neutral-200 rounded-xl p-6 space-y-4">
            <h2 className="font-semibold text-neutral-900">Contact Person</h2>

            <div>
              <Label htmlFor="contactFullName" className="mb-1.5 block">
                Full Name *
              </Label>
              <Input id="contactFullName" {...register('contactFullName')} />
              {errors.contactFullName && (
                <p className="mt-1 text-xs text-red-600">{errors.contactFullName.message}</p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="contactEmail" className="mb-1.5 block">
                  Email *
                </Label>
                <Input id="contactEmail" type="email" {...register('contactEmail')} />
                {errors.contactEmail && (
                  <p className="mt-1 text-xs text-red-600">{errors.contactEmail.message}</p>
                )}
              </div>
              <div>
                <Label htmlFor="contactNumber" className="mb-1.5 block">
                  Contact Number *
                </Label>
                <Input id="contactNumber" {...register('contactNumber')} />
                {errors.contactNumber && (
                  <p className="mt-1 text-xs text-red-600">{errors.contactNumber.message}</p>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="palsuIdNo" className="mb-1.5 block">
                PalSU ID No.
              </Label>
              <Input id="palsuIdNo" {...register('palsuIdNo')} />
            </div>

            <div>
              <Label htmlFor="otherReminders" className="mb-1.5 block">
                Other Reminders
              </Label>
              <textarea
                id="otherReminders"
                rows={2}
                placeholder="Anything else the Sports Office should know"
                className="w-full px-3 py-2.5 rounded-lg bg-neutral-100 border border-transparent focus:border-orange-500 outline-none text-sm resize-none"
                {...register('otherReminders')}
              />
            </div>
          </div>

          {/* Agreement */}
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-5 text-xs text-blue-700">
            By submitting this request, your personal information (name, email, affiliation) will be processed by
            the PalSU Sports Office in compliance with RA 10173 (Data Privacy Act of 2012) for the purpose of
            managing facility reservations. You agree to abide by PalSU's facility use policies and accept that
            cancellations must be made at least 24 hours in advance.
            <div className="flex items-start gap-2 mt-3">
              <Controller
                name="agree"
                control={control}
                defaultValue={false as any}
                render={({ field }) => (
                  <Checkbox
                    id="agree"
                    checked={field.value}
                    onCheckedChange={(checked: boolean | 'indeterminate') => field.onChange(checked === true)}
                  />
                )}
              />
              <Label htmlFor="agree" className="text-xs font-normal leading-snug">
                I agree to the{' '}
                <Link to="/terms" target="_blank" className="underline hover:text-blue-900">
                  Terms of Service
                </Link>{' '}
                and{' '}
                <Link to="/privacy-policy" target="_blank" className="underline hover:text-blue-900">
                  Privacy Policy
                </Link>
                , and consent to the processing of my data.
              </Label>
            </div>
            {errors.agree && <p className="mt-2 text-xs text-red-600">{errors.agree.message}</p>}
          </div>

          {submitError && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
              {submitError}
            </p>
          )}

          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300"
          >
            {isSubmitting ? 'Submitting…' : 'Submit Request'}
          </Button>
        </form>
      </main>
    </div>
  );
}