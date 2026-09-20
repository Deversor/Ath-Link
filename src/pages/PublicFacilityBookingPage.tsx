import { useEffect, useMemo, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Building2, Trophy, Search, ChevronLeft, ChevronRight, LogIn, LogOut } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/useAuthStore';
import NotificationsBell from '../components/layout/NotificationsBell';
import ReadyToBookModal from '../components/common/ReadyToBookModal';
import ConfirmDialog from '../components/common/ConfirmDialog';
import { getMonthGrid, toDateKey, WEEKDAY_LABELS, MONTH_LABELS } from '../lib/calendarUtils';

interface Facility {
  id: string;
  name: string;
  description: string | null;
  rules: string | null;
  hours_text: string | null;
  capacity: number | null;
  active: boolean;
}

interface PublicReservation {
  facility_id: string;
  starts_at: string;
  ends_at: string;
  status: string;
}

interface MyReservation {
  id: string;
  facility_id: string;
  reservation_date: string;
  start_time: string;
  end_time: string;
  event_title: string | null;
  reservation_type: string;
  status: string;
  approval_letter_deadline: string | null;
  approval_letter_path: string | null;
  rejection_reason: string | null;
}

const STATUS_LABELS: Record<string, { label: string; className: string }> = {
  pending_review: { label: 'Pending Review', className: 'bg-amber-100 text-amber-700' },
  rejected_initial: { label: 'Rejected', className: 'bg-red-100 text-red-700' },
  temporarily_reserved: { label: 'Temporarily Reserved', className: 'bg-yellow-100 text-yellow-700' },
  pending_final_review: { label: 'Pending Final Review', className: 'bg-blue-100 text-blue-700' },
  rejected_final: { label: 'Rejected', className: 'bg-red-100 text-red-700' },
  confirmed: { label: 'Confirmed', className: 'bg-green-100 text-green-700' },
  cancelled: { label: 'Cancelled', className: 'bg-neutral-200 text-neutral-500' },
  pending: { label: 'Pending Review', className: 'bg-amber-100 text-amber-700' },
  approved: { label: 'Confirmed', className: 'bg-green-100 text-green-700' },
  rejected: { label: 'Rejected', className: 'bg-red-100 text-red-700' },
};

type Availability = 'available' | 'partial' | 'full' | 'past';

export default function PublicFacilityBookingPage() {
  const navigate = useNavigate();
  const { user, profile } = useAuthStore();
  const [view, setView] = useState<'calendar' | 'my-requests'>('calendar');
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [activeFacility, setActiveFacility] = useState<Facility | null>(null);
  const [search, setSearch] = useState('');
  const [cursor, setCursor] = useState(new Date());
  const [reservations, setReservations] = useState<PublicReservation[]>([]);
  const [myRequests, setMyRequests] = useState<MyReservation[]>([]);
  const [myRequestsMessage, setMyRequestsMessage] = useState<string | null>(null);

  const facilityName = (id: string) => facilities.find((f) => f.id === id)?.name ?? 'Facility';

  const loadMyRequests = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('facility_reservations')
      .select('id, facility_id, reservation_date, start_time, end_time, event_title, reservation_type, status, approval_letter_deadline, approval_letter_path, rejection_reason')
      .eq('user_id', user.id)
      .order('reservation_date', { ascending: false });
    setMyRequests(data ?? []);
  };

  useEffect(() => {
    if (view === 'my-requests') loadMyRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, user]);

  const [cancelTarget, setCancelTarget] = useState<MyReservation | null>(null);

  const handleCancel = async (id: string) => {
    await supabase.from('facility_reservations').update({ status: 'cancelled' }).eq('id', id);
    setCancelTarget(null);
    setMyRequestsMessage('Reservation cancelled.');
    loadMyRequests();
  };

  const handleUploadLetter = async (reservation: MyReservation, file: File | undefined) => {
    if (!file || !user) return;
    const path = `${user.id}/${reservation.id}-${file.name}`;
    const { error: uploadErr } = await supabase.storage.from('approval-letters').upload(path, file, { upsert: true });
    if (uploadErr) {
      setMyRequestsMessage(uploadErr.message);
      return;
    }
    await supabase
      .from('facility_reservations')
      .update({ approval_letter_path: path, status: 'pending_final_review' })
      .eq('id', reservation.id);
    setMyRequestsMessage('Approval letter uploaded — awaiting final review.');
    loadMyRequests();
  };

  useEffect(() => {
    async function loadFacilities() {
      const { data } = await supabase
        .from('facilities')
        .select('id, name, description, rules, hours_text, capacity, active')
        .order('name');
      setFacilities(data ?? []);
      if (data && data.length > 0) setActiveFacility(data[0]);
    }
    loadFacilities();
  }, []);

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const weeks = getMonthGrid(year, month);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  useEffect(() => {
    async function loadReservations() {
      if (!activeFacility) return;
      const monthStart = new Date(year, month, 1);
      const monthEnd = new Date(year, month + 1, 1);
      const { data } = await supabase.rpc('get_public_facility_calendar', {
        p_facility_id: activeFacility.id,
        p_range_start: monthStart.toISOString(),
        p_range_end: monthEnd.toISOString(),
      });
      setReservations(data ?? []);
    }
    loadReservations();
  }, [activeFacility, year, month]);

  const getAvailability = (date: Date): Availability => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    if (d < today) return 'past';

    const count = reservations.filter((r) => toDateKey(new Date(r.starts_at)) === toDateKey(date)).length;
    if (count === 0) return 'available';
    if (count === 1) return 'partial';
    return 'full';
  };

  const AVAILABILITY_STYLES: Record<Availability, string> = {
    available: 'bg-green-100 text-green-800',
    partial: 'bg-amber-100 text-amber-800',
    full: 'bg-red-100 text-red-700',
    past: 'bg-neutral-100 text-neutral-400',
  };

  const filteredFacilities = useMemo(
    () => facilities.filter((f) => f.name.toLowerCase().includes(search.toLowerCase())),
    [facilities, search]
  );

  const [readyToBookTarget, setReadyToBookTarget] = useState<{ facilityName: string; date: string } | null>(null);

  const handleReserveClick = (date: Date, status: Availability) => {
    if (status === 'full' || status === 'past') return;

    const dateKey = toDateKey(date);

    if (!user) {
      // Guests must sign in (or register) before they can reserve — show a
      // clear choice instead of yanking them straight to login. Remember
      // what they were trying to book so the flow can resume afterward.
      sessionStorage.setItem(
        'pendingReservationIntent',
        JSON.stringify({ facilityId: activeFacility?.id, date: dateKey })
      );
      setReadyToBookTarget({ facilityName: activeFacility?.name ?? 'this facility', date: dateKey });
      return;
    }

    navigate('/facility-reservation/reserve', { state: { facilityId: activeFacility?.id, date: dateKey } });
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      <header className="bg-neutral-950 text-white">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-orange-500 flex items-center justify-center">
              <Trophy className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold">
              PalawanSU <span className="text-orange-500">AthLink</span>
            </span>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 text-sm">
            {user && profile ? (
              <>
                <span className="hidden sm:inline text-neutral-300 truncate max-w-[160px]">
                  {profile.full_name} {profile.department ? `· ${profile.department}` : ''}
                </span>
                <NotificationsBell />
                <button
                  type="button"
                  onClick={async () => {
                    await useAuthStore.getState().signOut();
                  }}
                  className="flex items-center gap-1 text-neutral-300 hover:text-white"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => navigate('/login', { state: { redirectTo: '/facility-reservation' } })}
                className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg"
              >
                <LogIn className="w-3.5 h-3.5" />
                Sign In
              </button>
            )}
          </div>
        </div>
      </header>

      <div className="bg-gradient-to-r from-orange-500 to-orange-400 text-white">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-6">
          <h1 className="flex items-center gap-2 text-xl md:text-2xl font-bold">
            <Building2 className="w-6 h-6" />
            PalSU Facility Booking Portal
          </h1>
          <p className="text-sm text-orange-50 mt-1">
            {user
              ? `Welcome, ${profile?.full_name ?? ''}! Select a facility and an available date to submit a reservation request.`
              : "Browse facilities and availability freely. Sign in when you're ready to reserve."}
          </p>
        </div>
      </div>

      <main className="max-w-[1600px] mx-auto px-4 sm:px-6 py-6 space-y-4">
        {user && (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setView('calendar')}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                view === 'calendar' ? 'bg-orange-500 text-white' : 'bg-white border border-neutral-200 text-neutral-600'
              }`}
            >
              Calendar
            </button>
            <button
              type="button"
              onClick={() => setView('my-requests')}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                view === 'my-requests' ? 'bg-orange-500 text-white' : 'bg-white border border-neutral-200 text-neutral-600'
              }`}
            >
              My Requests
            </button>
          </div>
        )}

        {view === 'my-requests' && user ? (
          <div className="bg-white border border-neutral-200 rounded-xl p-6">
            <h2 className="font-semibold text-neutral-900 mb-1">My Reservation Requests</h2>
            <p className="text-sm text-neutral-500 mb-4">Track the status of your facility requests</p>

            {myRequestsMessage && (
              <p className="text-sm text-green-700 bg-green-50 border border-green-100 rounded-lg px-3 py-2 mb-4">
                {myRequestsMessage}
              </p>
            )}

            {myRequests.length === 0 ? (
              <p className="text-sm text-neutral-400 text-center py-8">No reservation requests yet.</p>
            ) : (
              <div className="space-y-3">
                {myRequests.map((r) => {
                  const badge = STATUS_LABELS[r.status] ?? { label: r.status, className: 'bg-neutral-100 text-neutral-500' };
                  const canCancel = r.status === 'pending_review' || r.status === 'temporarily_reserved';
                  return (
                    <div key={r.id} className="rounded-lg border border-neutral-100 bg-neutral-50 p-4">
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-medium text-neutral-800">{r.event_title ?? facilityName(r.facility_id)}</p>
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${badge.className}`}>
                          {badge.label}
                        </span>
                      </div>
                      <p className="text-xs text-neutral-500 mb-2">
                        {facilityName(r.facility_id)} · {r.reservation_date} · {r.start_time}–{r.end_time} ·{' '}
                        {r.reservation_type === 'practice' ? 'Practice Session' : 'Event'}
                      </p>

                      {(r.status === 'rejected_initial' || r.status === 'rejected_final' || r.status === 'rejected') && r.rejection_reason && (
                        <div className="rounded-lg bg-red-50 border border-red-100 px-3 py-2 mb-2">
                          <p className="text-xs text-red-700">
                            <span className="font-medium">Reason:</span> {r.rejection_reason}
                          </p>
                        </div>
                      )}

                      {r.status === 'temporarily_reserved' && !r.approval_letter_path && (
                        <div className="rounded-lg bg-yellow-50 border border-yellow-100 px-3 py-2 mb-2">
                          <p className="text-xs text-yellow-800 font-medium mb-1">
                            Approved! Upload your approval letter to confirm
                            {r.approval_letter_deadline
                              ? ` (by ${new Date(r.approval_letter_deadline).toLocaleDateString()})`
                              : ' within 3 days'}
                            .
                          </p>
                          <input
                            type="file"
                            accept="application/pdf,image/*"
                            onChange={(e) => handleUploadLetter(r, e.target.files?.[0])}
                            className="text-xs"
                          />
                        </div>
                      )}

                      {canCancel && (
                        <button
                          type="button"
                          onClick={() => setCancelTarget(r)}
                          className="text-xs font-medium text-red-600 hover:text-red-700"
                        >
                          Cancel Request
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          <>
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <input
            placeholder="Search facilities..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-3 py-2.5 rounded-lg border border-neutral-200 bg-white text-sm outline-none focus:border-orange-400"
          />
        </div>

        <div className="flex gap-1 overflow-x-auto border-b border-neutral-200 [-webkit-overflow-scrolling:touch] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {filteredFacilities.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setActiveFacility(f)}
              className={`shrink-0 whitespace-nowrap px-3 py-2 text-sm font-medium rounded-t-lg ${
                activeFacility?.id === f.id ? 'bg-orange-500 text-white' : 'text-neutral-500 hover:bg-neutral-100'
              }`}
            >
              {f.name}
            </button>
          ))}
        </div>

        {activeFacility && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 bg-white border border-neutral-200 rounded-xl p-6">
              <div className="flex items-center justify-between mb-1">
                <div>
                  <h2 className="font-semibold text-neutral-900">{activeFacility.name}</h2>
                  <p className="text-xs text-neutral-500">
                    Select an available date to {user ? 'request a reservation' : 'preview availability'}
                  </p>
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
                          onClick={() => handleReserveClick(date, status)}
                          className={`aspect-square rounded-lg text-sm font-medium transition-colors ${AVAILABILITY_STYLES[status]} ${
                            status === 'available' || status === 'partial' ? 'hover:opacity-80 cursor-pointer' : 'cursor-not-allowed'
                          }`}
                        >
                          {date.getDate()}
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>

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
            </div>

            <div className="space-y-4">
              <div className="bg-white border border-neutral-200 rounded-xl p-5">
                <h3 className="font-semibold text-neutral-900 mb-2">About this facility</h3>
                <p className="text-sm text-neutral-600 mb-3">{activeFacility.description ?? 'No description yet.'}</p>
                <p className="text-xs text-neutral-500">Hours: {activeFacility.hours_text ?? '—'}</p>
                <p className="text-xs text-neutral-500">Capacity: {activeFacility.capacity ?? '—'} people</p>
              </div>

              <div className="bg-white border border-neutral-200 rounded-xl p-5">
                <h3 className="font-semibold text-neutral-900 mb-2">Reservation Rules</h3>
                <p className="text-sm text-neutral-600">{activeFacility.rules ?? 'No specific rules listed.'}</p>
              </div>

              {!user && (
                <div className="bg-orange-50 border border-orange-100 rounded-xl p-5 text-center">
                  <p className="text-sm text-orange-800 font-medium mb-1">Ready to book?</p>
                  <p className="text-xs text-orange-700 mb-3">
                    Sign in or create an account to submit a reservation request. If you're signing up just to
                    reserve a facility, choose <strong>Facility Requester</strong> as your role.
                  </p>
                  <button
                    type="button"
                    onClick={() => navigate('/login', { state: { redirectTo: '/facility-reservation' } })}
                    className="w-full bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium py-2 rounded-lg"
                  >
                    Sign In / Register
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
          </>
        )}
      </main>

      <footer className="border-t border-neutral-200 mt-6">
        <p className="text-center text-xs text-neutral-400 py-4">
          © {new Date().getFullYear()} Palawan State University · Sports Office ·{' '}
          <Link to="/privacy-policy" className="underline hover:text-neutral-600">
            Privacy Policy
          </Link>{' '}
          ·{' '}
          <Link to="/terms" className="underline hover:text-neutral-600">
            Terms of Service
          </Link>
        </p>
      </footer>

      {readyToBookTarget && (
        <ReadyToBookModal
          facilityName={readyToBookTarget.facilityName}
          date={readyToBookTarget.date}
          onSignIn={() => navigate('/login', { state: { redirectTo: '/facility-reservation' } })}
          onCreateAccount={() => navigate('/signup')}
          onClose={() => setReadyToBookTarget(null)}
        />
      )}

      {cancelTarget && (
        <ConfirmDialog
          title="Cancel this reservation?"
          description={`This will cancel your request for ${facilityName(cancelTarget.facility_id)} on ${cancelTarget.reservation_date}. This can't be undone — you'd need to submit a new request to rebook.`}
          confirmLabel="Cancel Reservation"
          cancelLabel="Keep It"
          variant="danger"
          onConfirm={() => handleCancel(cancelTarget.id)}
          onClose={() => setCancelTarget(null)}
        />
      )}
    </div>
  );
}