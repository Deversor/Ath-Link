import { useEffect, useState } from 'react';
import { Building2, Check, X, Plus, History } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { supabase } from '../../lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface Facility {
  id: string;
  name: string;
  hours_text: string | null;
  capacity: number | null;
  rate_text: string | null;
  active: boolean;
}

interface Reservation {
  id: string;
  facility_id: string;
  reservation_date: string;
  start_time: string;
  end_time: string;
  purpose: string;
  expected_attendees: number | null;
  status: string;
  is_manual: boolean;
  requester_name: string | null;
  requester_organization: string | null;
  requester_email: string | null;
  requester_phone: string | null;
  created_at: string;
  user_id: string | null;
  requesterProfile?: { full_name: string; email: string; role: string } | null;
}

export function FacilityRequestsContent() {
  const { user } = useAuthStore();
  const [tab, setTab] = useState<'requests' | 'history'>('requests');
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [showManualModal, setShowManualModal] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const load = async () => {
    const { data: fac } = await supabase
      .from('facilities')
      .select('id, name, hours_text, capacity, rate_text, active')
      .order('name');
    setFacilities(fac ?? []);

    const { data: res } = await supabase
      .from('facility_reservations')
      .select(
        'id, facility_id, reservation_date, start_time, end_time, purpose, expected_attendees, status, is_manual, requester_name, requester_organization, requester_email, requester_phone, created_at, user_id'
      )
      .order('created_at', { ascending: false });

    const userIds = Array.from(new Set((res ?? []).map((r) => r.user_id).filter(Boolean))) as string[];
    let profileMap: Record<string, { full_name: string; email: string; role: string }> = {};
    if (userIds.length > 0) {
      const { data: profs } = await supabase
        .from('profiles')
        .select('id, full_name, email, role')
        .in('id', userIds);
      profileMap = Object.fromEntries((profs ?? []).map((p) => [p.id, p]));
    }

    setReservations(
      (res ?? []).map((r) => ({
        ...r,
        requesterProfile: r.user_id ? profileMap[r.user_id] ?? null : null,
      }))
    );
  };

  useEffect(() => {
    load();
  }, []);

  const facilityName = (id: string) => facilities.find((f) => f.id === id)?.name ?? 'Facility';

  const pending = reservations.filter((r) => r.status === 'pending');
  const history = reservations.filter((r) => r.status !== 'pending');

  const handleDecision = async (id: string, status: 'approved' | 'rejected') => {
    await supabase.from('facility_reservations').update({ status }).eq('id', id);
    setMessage(`Request ${status}.`);
    load();
  };

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-neutral-900">Facility Reservation Management</h1>
          <p className="text-sm text-neutral-500">Manage facility reservations and calendar</p>
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={() => setTab('history')}>
            <History className="w-4 h-4 mr-1.5" />
            Reservation History
          </Button>
          <Button
            type="button"
            className="bg-orange-500 hover:bg-orange-600"
            onClick={() => setShowManualModal(true)}
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Manual Reservation
          </Button>
        </div>
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setTab('requests')}
          className={`px-4 py-2 rounded-lg text-sm font-medium ${
            tab === 'requests' ? 'bg-orange-500 text-white' : 'bg-white border border-neutral-200 text-neutral-600'
          }`}
        >
          Requests
        </button>
        <button
          type="button"
          onClick={() => setTab('history')}
          className={`px-4 py-2 rounded-lg text-sm font-medium ${
            tab === 'history' ? 'bg-orange-500 text-white' : 'bg-white border border-neutral-200 text-neutral-600'
          }`}
        >
          History
        </button>
      </div>

      {message && (
        <p className="text-sm text-green-700 bg-green-50 border border-green-100 rounded-lg px-3 py-2">
          {message}
        </p>
      )}

      {tab === 'requests' && (
        <div>
          <h2 className="flex items-center gap-2 font-semibold text-neutral-900 mb-1">
            Pending Reservation Requests
          </h2>
          <p className="text-sm text-neutral-500 mb-4">Review and approve facility reservation requests from all users</p>

          {pending.length === 0 ? (
            <p className="text-sm text-neutral-400 text-center py-8 bg-white border border-neutral-200 rounded-xl">
              No pending requests.
            </p>
          ) : (
            <div className="space-y-3">
              {pending.map((r) => {
                const name = r.is_manual ? r.requester_name : r.requesterProfile?.full_name;
                const email = r.is_manual ? r.requester_email : r.requesterProfile?.email;
                const roleTag = r.is_manual ? r.requester_organization : r.requesterProfile?.role;
                return (
                  <div key={r.id} className="bg-white border-l-4 border-orange-400 border-t border-r border-b border-neutral-200 rounded-xl p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-semibold text-neutral-900">{facilityName(r.facility_id)}</p>
                        <div className="flex items-center gap-2 text-xs text-neutral-500 mt-1">
                          <span>{name ?? 'Unknown'}</span>
                          {roleTag && (
                            <span className="bg-blue-100 text-blue-700 rounded-full px-2 py-0.5 capitalize">
                              {roleTag}
                            </span>
                          )}
                          {r.is_manual && (
                            <span className="bg-neutral-200 text-neutral-600 rounded-full px-2 py-0.5">
                              Admin-created
                            </span>
                          )}
                        </div>
                      </div>
                      <span className="text-xs font-medium bg-amber-100 text-amber-700 rounded-full px-2 py-0.5">
                        Pending
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-neutral-500 mb-3">
                      {email && <p>Email: {email}</p>}
                      {r.is_manual && r.requester_phone && <p>Phone: {r.requester_phone}</p>}
                      <p>Date: {r.reservation_date}</p>
                      <p>Time: {r.start_time} - {r.end_time}</p>
                      {r.expected_attendees && <p>Expected attendees: {r.expected_attendees}</p>}
                    </div>

                    <div className="rounded-lg bg-neutral-50 border border-neutral-100 px-3 py-2 text-sm text-neutral-700 mb-3">
                      Purpose: {r.purpose}
                    </div>

                    <p className="text-xs text-neutral-400 mb-3">
                      Requested {new Date(r.created_at).toLocaleString()}
                    </p>

                    <div className="flex gap-2">
                      <Button
                        type="button"
                        className="flex-1 bg-green-600 hover:bg-green-700"
                        onClick={() => handleDecision(r.id, 'approved')}
                      >
                        <Check className="w-4 h-4 mr-1.5" />
                        Approve
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        className="flex-1 border-red-200 text-red-600 hover:bg-red-50"
                        onClick={() => handleDecision(r.id, 'rejected')}
                      >
                        <X className="w-4 h-4 mr-1.5" />
                        Reject
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {tab === 'history' && (
        <div className="bg-white border border-neutral-200 rounded-xl p-6">
          <h2 className="font-semibold text-neutral-900 mb-4">Reservation History</h2>
          {history.length === 0 ? (
            <p className="text-sm text-neutral-400 text-center py-8">No reviewed reservations yet.</p>
          ) : (
            <div className="space-y-2">
              {history.map((r) => (
                <div
                  key={r.id}
                  className="flex items-center justify-between rounded-lg border border-neutral-100 bg-neutral-50 px-4 py-3 text-sm"
                >
                  <div>
                    <p className="font-medium text-neutral-800">{facilityName(r.facility_id)}</p>
                    <p className="text-xs text-neutral-500">
                      {r.reservation_date} · {r.start_time}–{r.end_time} · {r.purpose}
                    </p>
                  </div>
                  <span
                    className={`text-xs font-medium px-2 py-1 rounded-full capitalize ${
                      r.status === 'approved' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}
                  >
                    {r.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Available facilities reference */}
      <div>
        <h2 className="font-semibold text-neutral-900 mb-1">Available Facilities</h2>
        <p className="text-sm text-neutral-500 mb-3">Sports facilities available for reservation</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {facilities.map((f) => (
            <div key={f.id} className="bg-white border border-neutral-200 rounded-xl p-4">
              <div className="flex items-start justify-between mb-2">
                <p className="font-semibold text-neutral-900">{f.name}</p>
                <Building2 className="w-4 h-4 text-neutral-300" />
              </div>
              <span
                className={`inline-block text-xs font-medium rounded-full px-2 py-0.5 mb-2 ${
                  f.active ? 'bg-green-100 text-green-700' : 'bg-neutral-200 text-neutral-500'
                }`}
              >
                {f.active ? 'Active' : 'Inactive'}
              </span>
              <p className="text-xs text-neutral-500">{f.hours_text}</p>
              <p className="text-xs text-neutral-500">Capacity: {f.capacity} people</p>
              <p className="text-xs text-neutral-500">Rate: {f.rate_text}</p>
            </div>
          ))}
        </div>
      </div>

      {showManualModal && (
        <ManualReservationModal
          facilities={facilities}
          adminId={user?.id}
          onClose={() => setShowManualModal(false)}
          onCreated={() => {
            setShowManualModal(false);
            setMessage('Manual reservation created.');
            load();
          }}
        />
      )}
    </>
  );
}

function ManualReservationModal({
  facilities,
  adminId,
  onClose,
  onCreated,
}: {
  facilities: Facility[];
  adminId: string | undefined;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [facilityId, setFacilityId] = useState(facilities[0]?.id ?? '');
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [purpose, setPurpose] = useState('');
  const [requesterName, setRequesterName] = useState('');
  const [requesterOrg, setRequesterOrg] = useState('');
  const [requesterEmail, setRequesterEmail] = useState('');
  const [requesterPhone, setRequesterPhone] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!facilityId || !date || !startTime || !endTime || !purpose || !requesterName) {
      setError('Please fill in facility, date, time, purpose, and requester name.');
      return;
    }
    setIsSubmitting(true);
    const { error: insertError } = await supabase.from('facility_reservations').insert({
      facility_id: facilityId,
      user_id: null,
      is_manual: true,
      created_by_admin: adminId,
      reservation_date: date,
      start_time: startTime,
      end_time: endTime,
      purpose,
      requester_name: requesterName,
      requester_organization: requesterOrg || null,
      requester_email: requesterEmail || null,
      requester_phone: requesterPhone || null,
      status: 'approved',
    });
    setIsSubmitting(false);

    if (insertError) {
      setError(insertError.message);
      return;
    }
    onCreated();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-xl bg-white shadow-xl p-6 max-h-[90vh] overflow-y-auto">
        <h3 className="font-semibold text-neutral-900 mb-4">Manual Reservation</h3>

        <div className="space-y-3">
          <select
            value={facilityId}
            onChange={(e) => setFacilityId(e.target.value)}
            className="w-full px-3 py-2.5 rounded-lg bg-neutral-100 border border-transparent focus:border-orange-500 outline-none text-sm"
          >
            {facilities.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
          </select>
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          <div className="grid grid-cols-2 gap-3">
            <Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
            <Input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
          </div>
          <textarea
            rows={2}
            placeholder="Purpose"
            value={purpose}
            onChange={(e) => setPurpose(e.target.value)}
            className="w-full px-3 py-2.5 rounded-lg bg-neutral-100 border border-transparent focus:border-orange-500 outline-none text-sm resize-none"
          />
          <Input placeholder="Requester name" value={requesterName} onChange={(e) => setRequesterName(e.target.value)} />
          <Input placeholder="Organization (optional)" value={requesterOrg} onChange={(e) => setRequesterOrg(e.target.value)} />
          <Input placeholder="Email (optional)" value={requesterEmail} onChange={(e) => setRequesterEmail(e.target.value)} />
          <Input placeholder="Phone (optional)" value={requesterPhone} onChange={(e) => setRequesterPhone(e.target.value)} />
        </div>

        {error && <p className="text-sm text-red-600 mt-3">{error}</p>}

        <div className="flex gap-3 mt-4">
          <Button type="button" className="flex-1 bg-orange-500 hover:bg-orange-600" onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'Creating…' : 'Create Reservation'}
          </Button>
          <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}
