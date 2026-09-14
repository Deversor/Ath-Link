import { useEffect, useState } from 'react';
import { Building2, Check, X, Plus, History, QrCode, Copy, FileText, Clock } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { supabase } from '../../lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface Facility {
  id: string;
  name: string;
  hours_text: string | null;
  capacity: number | null;
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
  reservation_type: string;
  event_title: string | null;
  organization_name: string | null;
  event_type: string | null;
  other_event_type: string | null;
  contact_full_name: string | null;
  contact_email: string | null;
  contact_number: string | null;
  palsu_id_no: string | null;
  other_reminders: string | null;
  prep_date: string | null;
  prep_time: string | null;
  event_duration: string | null;
  approval_letter_path: string | null;
  approval_letter_deadline: string | null;
  requesterProfile?: { full_name: string; email: string; role: string } | null;
}

const RESERVATION_COLUMNS =
  'id, facility_id, reservation_date, start_time, end_time, purpose, expected_attendees, status, is_manual, requester_name, requester_organization, requester_email, requester_phone, created_at, user_id, reservation_type, event_title, organization_name, event_type, other_event_type, contact_full_name, contact_email, contact_number, palsu_id_no, other_reminders, prep_date, prep_time, event_duration, approval_letter_path, approval_letter_deadline';

export function FacilityRequestsContent() {
  const { user } = useAuthStore();
  const [tab, setTab] = useState<'requests' | 'history'>('requests');
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [showManualModal, setShowManualModal] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [rejectTarget, setRejectTarget] = useState<{ reservation: Reservation; stage: 1 | 2 } | null>(null);

  const load = async () => {
    const { data: fac } = await supabase
      .from('facilities')
      .select('id, name, hours_text, capacity, active')
      .order('name');
    setFacilities(fac ?? []);

    const { data: res } = await supabase
      .from('facility_reservations')
      .select(RESERVATION_COLUMNS)
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

  const stage1Pending = reservations.filter((r) => r.status === 'pending_review' || r.status === 'pending');
  const awaitingLetter = reservations.filter((r) => r.status === 'temporarily_reserved');
  const stage2Pending = reservations.filter((r) => r.status === 'pending_final_review');
  const history = reservations.filter((r) =>
    ['confirmed', 'approved', 'rejected_initial', 'rejected_final', 'rejected', 'cancelled'].includes(r.status)
  );

  const requesterInfo = (r: Reservation) => ({
    name: r.is_manual ? r.requester_name : r.contact_full_name ?? r.requesterProfile?.full_name,
    email: r.is_manual ? r.requester_email : r.contact_email ?? r.requesterProfile?.email,
    roleTag: r.is_manual ? r.requester_organization : r.requesterProfile?.role,
  });

  const logDecision = async (r: Reservation, actionType: string, label: string) => {
    const { name } = requesterInfo(r);
    await supabase.rpc('log_activity', {
      p_action_type: actionType,
      p_entity_type: 'facility',
      p_description: `${facilityName(r.facility_id)} · ${r.reservation_date} · ${r.start_time}–${r.end_time} · ${label} · Requested by ${name ?? 'Unknown'}`,
    });
  };

  const notifyRequester = async (r: Reservation, msg: string) => {
    if (!r.user_id) return; // manual/guest bookings have no account to notify
    await supabase.from('notifications').insert({
      user_id: r.user_id,
      message: msg,
      sent_by: user?.id,
    });
  };

  const handleStage1Decision = async (r: Reservation, decision: 'approve' | 'reject', reason?: string) => {
    const facility = facilityName(r.facility_id);
    if (decision === 'approve') {
      const deadline = new Date();
      deadline.setDate(deadline.getDate() + 3);
      await supabase
        .from('facility_reservations')
        .update({
          status: 'temporarily_reserved',
          stage1_reviewed_by: user?.id,
          stage1_reviewed_at: new Date().toISOString(),
          approval_letter_deadline: deadline.toISOString(),
        })
        .eq('id', r.id);
      await logDecision(r, 'reservation_stage1_approved', 'Initial approval — awaiting approval letter');
      await notifyRequester(
        r,
        `Your reservation for ${facility} on ${r.reservation_date} was approved! Please upload your approval letter within 3 days to confirm.`
      );
      setMessage('Approved. The requester now has 3 days to upload their approval letter.');
    } else {
      await supabase
        .from('facility_reservations')
        .update({
          status: 'rejected_initial',
          stage1_reviewed_by: user?.id,
          stage1_reviewed_at: new Date().toISOString(),
          rejection_reason: reason ?? null,
        })
        .eq('id', r.id);
      await logDecision(r, 'reservation_rejected', 'Rejected at initial review');
      await notifyRequester(
        r,
        `Your reservation for ${facility} on ${r.reservation_date} was rejected.${reason ? ` Reason: ${reason}` : ''}`
      );
      setMessage('Request rejected.');
    }
    load();
  };

  const handleStage2Decision = async (r: Reservation, decision: 'approve' | 'reject', reason?: string) => {
    const facility = facilityName(r.facility_id);
    if (decision === 'approve') {
      await supabase
        .from('facility_reservations')
        .update({ status: 'confirmed', stage2_reviewed_by: user?.id, stage2_reviewed_at: new Date().toISOString() })
        .eq('id', r.id);
      await logDecision(r, 'reservation_confirmed', 'Confirmed after approval letter review');
      await notifyRequester(r, `Your reservation for ${facility} on ${r.reservation_date} has been confirmed!`);
      setMessage('Reservation confirmed.');
    } else {
      await supabase
        .from('facility_reservations')
        .update({
          status: 'rejected_final',
          stage2_reviewed_by: user?.id,
          stage2_reviewed_at: new Date().toISOString(),
          rejection_reason: reason ?? null,
        })
        .eq('id', r.id);
      await logDecision(r, 'reservation_rejected', 'Rejected at final review');
      await notifyRequester(
        r,
        `Your reservation for ${facility} on ${r.reservation_date} was rejected at final review.${reason ? ` Reason: ${reason}` : ''}`
      );
      setMessage('Request rejected at final review.');
    }
    load();
  };

  const handleViewLetter = async (path: string) => {
    const { data, error } = await supabase.storage.from('approval-letters').createSignedUrl(path, 60);
    if (error || !data) {
      setMessage(error?.message ?? "Couldn't open that file.");
      return;
    }
    window.open(data.signedUrl, '_blank');
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

      <div className="bg-white border border-neutral-200 rounded-xl p-5 flex flex-col sm:flex-row items-center gap-4">
        <img
          src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(
            `${window.location.origin}/facility-reservation`
          )}`}
          alt="QR code for the public facility booking page"
          className="w-24 h-24 rounded-lg border border-neutral-200"
        />
        <div className="flex-1 text-center sm:text-left">
          <p className="flex items-center justify-center sm:justify-start gap-1.5 text-sm font-medium text-neutral-800">
            <QrCode className="w-4 h-4 text-orange-500" />
            Public Booking Link
          </p>
          <p className="text-xs text-neutral-500 mb-2">
            Share this link or QR code with the university community — anyone can browse facilities and availability
            without an account, and reserve once they sign in.
          </p>
          <div className="flex items-center gap-2 justify-center sm:justify-start">
            <code className="text-xs bg-neutral-100 rounded px-2 py-1">{window.location.origin}/facility-reservation</code>
            <button
              type="button"
              onClick={() => navigator.clipboard.writeText(`${window.location.origin}/facility-reservation`)}
              className="text-neutral-400 hover:text-neutral-600"
              aria-label="Copy link"
            >
              <Copy className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-neutral-200 rounded-xl p-4">
          <p className="text-sm text-neutral-500">Pending Initial Review</p>
          <p className="text-2xl font-bold text-amber-600 mt-1">{stage1Pending.length}</p>
        </div>
        <div className="bg-white border border-neutral-200 rounded-xl p-4">
          <p className="text-sm text-neutral-500">Awaiting Approval Letter</p>
          <p className="text-2xl font-bold text-yellow-600 mt-1">{awaitingLetter.length}</p>
        </div>
        <div className="bg-white border border-neutral-200 rounded-xl p-4">
          <p className="text-sm text-neutral-500">Pending Final Review</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">{stage2Pending.length}</p>
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
        <div className="space-y-6">
          {/* Stage 1: initial review */}
          <div>
            <h2 className="font-semibold text-neutral-900 mb-1">Pending Initial Review</h2>
            <p className="text-sm text-neutral-500 mb-4">New requests awaiting your first decision</p>

            {stage1Pending.length === 0 ? (
              <p className="text-sm text-neutral-400 text-center py-8 bg-white border border-neutral-200 rounded-xl">
                No pending requests.
              </p>
            ) : (
              <div className="space-y-3">
                {stage1Pending.map((r) => {
                  const { name, email, roleTag } = requesterInfo(r);
                  return (
                    <div key={r.id} className="bg-white border-l-4 border-orange-400 border-t border-r border-b border-neutral-200 rounded-xl p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-semibold text-neutral-900">
                            {r.event_title ?? facilityName(r.facility_id)}
                          </p>
                          <div className="flex flex-wrap items-center gap-2 text-xs text-neutral-500 mt-1">
                            <span>{facilityName(r.facility_id)}</span>
                            <span>·</span>
                            <span>{name ?? 'Unknown'}</span>
                            {roleTag && (
                              <span className="bg-blue-100 text-blue-700 rounded-full px-2 py-0.5 capitalize">
                                {roleTag}
                              </span>
                            )}
                            <span className="bg-purple-100 text-purple-700 rounded-full px-2 py-0.5 capitalize">
                              {r.reservation_type === 'practice' ? 'Practice Session' : 'Event'}
                            </span>
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
                        {r.contact_number && <p>Contact: {r.contact_number}</p>}
                        <p>Date: {r.reservation_date}</p>
                        <p>Time: {r.start_time} - {r.end_time}</p>
                        {r.event_type && <p>Event Type: {r.event_type === 'Other' ? r.other_event_type : r.event_type}</p>}
                        {r.organization_name && <p>Organization: {r.organization_name}</p>}
                        {r.expected_attendees && <p>Expected attendees: {r.expected_attendees}</p>}
                        {r.palsu_id_no && <p>PalSU ID: {r.palsu_id_no}</p>}
                      </div>

                      <div className="rounded-lg bg-neutral-50 border border-neutral-100 px-3 py-2 text-sm text-neutral-700 mb-3">
                        Purpose: {r.purpose}
                      </div>

                      {r.other_reminders && (
                        <div className="rounded-lg bg-blue-50 border border-blue-100 px-3 py-2 text-xs text-blue-700 mb-3">
                          Reminders: {r.other_reminders}
                        </div>
                      )}

                      <p className="text-xs text-neutral-400 mb-3">
                        Requested {new Date(r.created_at).toLocaleString()}
                      </p>

                      <div className="flex gap-2">
                        <Button
                          type="button"
                          className="flex-1 bg-green-600 hover:bg-green-700"
                          onClick={() => handleStage1Decision(r, 'approve')}
                        >
                          <Check className="w-4 h-4 mr-1.5" />
                          Approve
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          className="flex-1 border-red-200 text-red-600 hover:bg-red-50"
                          onClick={() => setRejectTarget({ reservation: r, stage: 1 })}
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

          {/* Awaiting approval letter (informational, action is on the requester's side) */}
          {awaitingLetter.length > 0 && (
            <div>
              <h2 className="font-semibold text-neutral-900 mb-1">Awaiting Approval Letter</h2>
              <p className="text-sm text-neutral-500 mb-4">
                Approved — waiting for the requester to upload their approval letter
              </p>
              <div className="space-y-2">
                {awaitingLetter.map((r) => {
                  const { name } = requesterInfo(r);
                  const overdue = r.approval_letter_deadline && new Date(r.approval_letter_deadline) < new Date();
                  return (
                    <div key={r.id} className="flex items-center justify-between rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-3">
                      <div>
                        <p className="text-sm font-medium text-neutral-800">
                          {r.event_title ?? facilityName(r.facility_id)} · {facilityName(r.facility_id)}
                        </p>
                        <p className="text-xs text-neutral-500">
                          {name} · {r.reservation_date} · {r.start_time}–{r.end_time}
                        </p>
                      </div>
                      <span className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${overdue ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                        <Clock className="w-3 h-3" />
                        {overdue ? 'Overdue' : `Due ${r.approval_letter_deadline ? new Date(r.approval_letter_deadline).toLocaleDateString() : ''}`}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Stage 2: final review */}
          {stage2Pending.length > 0 && (
            <div>
              <h2 className="font-semibold text-neutral-900 mb-1">Pending Final Review</h2>
              <p className="text-sm text-neutral-500 mb-4">Approval letter uploaded — final decision needed</p>
              <div className="space-y-3">
                {stage2Pending.map((r) => {
                  const { name, email } = requesterInfo(r);
                  return (
                    <div key={r.id} className="bg-white border-l-4 border-blue-400 border-t border-r border-b border-neutral-200 rounded-xl p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-semibold text-neutral-900">{r.event_title ?? facilityName(r.facility_id)}</p>
                          <p className="text-xs text-neutral-500 mt-1">
                            {facilityName(r.facility_id)} · {name} {email ? `· ${email}` : ''}
                          </p>
                        </div>
                        <span className="text-xs font-medium bg-blue-100 text-blue-700 rounded-full px-2 py-0.5">
                          Final Review
                        </span>
                      </div>
                      <p className="text-xs text-neutral-500 mb-3">
                        {r.reservation_date} · {r.start_time}–{r.end_time}
                      </p>

                      {r.approval_letter_path && (
                        <Button
                          type="button"
                          variant="outline"
                          className="mb-3 text-xs h-8"
                          onClick={() => handleViewLetter(r.approval_letter_path!)}
                        >
                          <FileText className="w-3.5 h-3.5 mr-1.5" />
                          View Approval Letter
                        </Button>
                      )}

                      <div className="flex gap-2">
                        <Button
                          type="button"
                          className="flex-1 bg-green-600 hover:bg-green-700"
                          onClick={() => handleStage2Decision(r, 'approve')}
                        >
                          <Check className="w-4 h-4 mr-1.5" />
                          Confirm Reservation
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          className="flex-1 border-red-200 text-red-600 hover:bg-red-50"
                          onClick={() => setRejectTarget({ reservation: r, stage: 2 })}
                        >
                          <X className="w-4 h-4 mr-1.5" />
                          Reject
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
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
              {history.map((r) => {
                const badgeClass =
                  r.status === 'confirmed' || r.status === 'approved'
                    ? 'bg-green-100 text-green-700'
                    : r.status === 'cancelled'
                    ? 'bg-neutral-200 text-neutral-500'
                    : 'bg-red-100 text-red-700';
                return (
                  <div
                    key={r.id}
                    className="flex items-center justify-between rounded-lg border border-neutral-100 bg-neutral-50 px-4 py-3 text-sm"
                  >
                    <div>
                      <p className="font-medium text-neutral-800">{r.event_title ?? facilityName(r.facility_id)}</p>
                      <p className="text-xs text-neutral-500">
                        {facilityName(r.facility_id)} · {r.reservation_date} · {r.start_time}–{r.end_time}
                      </p>
                    </div>
                    <span className={`text-xs font-medium px-2 py-1 rounded-full capitalize ${badgeClass}`}>
                      {r.status.replace(/_/g, ' ')}
                    </span>
                  </div>
                );
              })}
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
            setMessage('Manual reservation created and confirmed.');
            load();
          }}
        />
      )}

      {rejectTarget && (
        <RejectReasonModal
          onClose={() => setRejectTarget(null)}
          onSubmit={(reason) => {
            const { reservation, stage } = rejectTarget;
            setRejectTarget(null);
            if (stage === 1) handleStage1Decision(reservation, 'reject', reason);
            else handleStage2Decision(reservation, 'reject', reason);
          }}
        />
      )}
    </>
  );
}

function RejectReasonModal({
  onClose,
  onSubmit,
}: {
  onClose: () => void;
  onSubmit: (reason: string) => void;
}) {
  const [reason, setReason] = useState('');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-sm rounded-xl bg-white shadow-xl p-6">
        <h3 className="font-semibold text-neutral-900 mb-1">Reject Request</h3>
        <p className="text-xs text-neutral-500 mb-4">
          Let the requester know why — this will be shown to them and included in their notification.
        </p>
        <textarea
          rows={3}
          placeholder="Reason for rejection"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className="w-full px-3 py-2.5 rounded-lg bg-neutral-100 border border-transparent focus:border-orange-500 outline-none text-sm resize-none mb-4"
        />
        <div className="flex gap-3">
          <Button
            type="button"
            className="flex-1 bg-red-600 hover:bg-red-700"
            disabled={!reason.trim()}
            onClick={() => onSubmit(reason)}
          >
            Reject
          </Button>
          <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </div>
    </div>
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
  const [eventTitle, setEventTitle] = useState('');
  const [eventType, setEventType] = useState('');
  const [purpose, setPurpose] = useState('');
  const [expectedAttendees, setExpectedAttendees] = useState('');
  const [requesterName, setRequesterName] = useState('');
  const [requesterOrg, setRequesterOrg] = useState('');
  const [requesterEmail, setRequesterEmail] = useState('');
  const [requesterPhone, setRequesterPhone] = useState('');
  const [palsuIdNo, setPalsuIdNo] = useState('');
  const [otherReminders, setOtherReminders] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!facilityId || !date || !startTime || !endTime || !purpose || !requesterName) {
      setError('Please fill in facility, date, time, purpose, and requester name.');
      return;
    }
    setIsSubmitting(true);

    // Admin-created bookings skip the review pipeline and go straight to
    // confirmed — but still need starts_at/ends_at set, or the
    // double-booking constraint can't see them at all.
    const { error: insertError } = await supabase.from('facility_reservations').insert({
      facility_id: facilityId,
      user_id: null,
      is_manual: true,
      created_by_admin: adminId,
      reservation_date: date,
      start_time: startTime,
      end_time: endTime,
      starts_at: new Date(`${date}T${startTime}`).toISOString(),
      ends_at: new Date(`${date}T${endTime}`).toISOString(),
      event_title: eventTitle || null,
      event_type: eventType || null,
      purpose,
      expected_attendees: expectedAttendees ? parseInt(expectedAttendees, 10) : null,
      requester_name: requesterName,
      requester_organization: requesterOrg || null,
      requester_email: requesterEmail || null,
      requester_phone: requesterPhone || null,
      palsu_id_no: palsuIdNo || null,
      other_reminders: otherReminders || null,
      status: 'confirmed',
    });
    setIsSubmitting(false);

    if (insertError) {
      setError(
        insertError.message.includes('no_double_booking')
          ? 'That time slot is already booked for this facility.'
          : insertError.message
      );
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
          <Input placeholder="Event/session title (optional)" value={eventTitle} onChange={(e) => setEventTitle(e.target.value)} />
          <Input placeholder="Event type (optional)" value={eventType} onChange={(e) => setEventType(e.target.value)} />
          <textarea
            rows={2}
            placeholder="Purpose"
            value={purpose}
            onChange={(e) => setPurpose(e.target.value)}
            className="w-full px-3 py-2.5 rounded-lg bg-neutral-100 border border-transparent focus:border-orange-500 outline-none text-sm resize-none"
          />
          <Input
            type="number"
            placeholder="Expected attendees (optional)"
            value={expectedAttendees}
            onChange={(e) => setExpectedAttendees(e.target.value)}
          />
          <Input placeholder="Requester name" value={requesterName} onChange={(e) => setRequesterName(e.target.value)} />
          <Input placeholder="Organization (optional)" value={requesterOrg} onChange={(e) => setRequesterOrg(e.target.value)} />
          <Input placeholder="Email (optional)" value={requesterEmail} onChange={(e) => setRequesterEmail(e.target.value)} />
          <Input placeholder="Phone (optional)" value={requesterPhone} onChange={(e) => setRequesterPhone(e.target.value)} />
          <Input placeholder="PalSU ID No. (optional)" value={palsuIdNo} onChange={(e) => setPalsuIdNo(e.target.value)} />
          <textarea
            rows={2}
            placeholder="Other reminders (optional)"
            value={otherReminders}
            onChange={(e) => setOtherReminders(e.target.value)}
            className="w-full px-3 py-2.5 rounded-lg bg-neutral-100 border border-transparent focus:border-orange-500 outline-none text-sm resize-none"
          />
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