import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Building2, Users, FileCheck, AlertCircle, Clock } from 'lucide-react';
import StaffAdminPortalLayout from '../../components/layout/StaffAdminPortalLayout';
import { supabase } from '../../lib/supabase';

interface PendingReservation {
  id: string;
  purpose: string;
  reservation_date: string;
  user_id: string;
}

interface PendingAthlete {
  id: string;
  full_name: string;
  sport: string | null;
}

export default function StaffAdminDashboardPage() {
  const [pendingReservations, setPendingReservations] = useState<PendingReservation[]>([]);
  const [pendingAthletes, setPendingAthletes] = useState<PendingAthlete[]>([]);
  const [sportsPendingCount, setSportsPendingCount] = useState(0);

  useEffect(() => {
    async function load() {
      const { data: reservations } = await supabase
        .from('facility_reservations')
        .select('id, purpose, reservation_date, user_id')
        .eq('status', 'pending')
        .order('reservation_date', { ascending: true })
        .limit(5);
      setPendingReservations(reservations ?? []);

      const { data: athletes } = await supabase
        .from('profiles')
        .select('id, full_name, sport')
        .eq('document_compile_status', 'submitted_to_admin')
        .order('full_name');
      setPendingAthletes(athletes ?? []);

      const distinctSports = new Set((athletes ?? []).map((a) => a.sport).filter(Boolean));
      setSportsPendingCount(distinctSports.size);
    }
    load();
  }, []);

  return (
    <StaffAdminPortalLayout>
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Staff Admin Dashboard</h1>
        <p className="text-sm text-neutral-500">Overview of operations and pending tasks</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-neutral-200 rounded-xl p-4">
          <p className="flex items-center gap-1.5 text-sm text-neutral-500">
            <Building2 className="w-4 h-4" /> Pending Facility Requests
          </p>
          <p className="text-3xl font-bold text-orange-600 mt-2">{pendingReservations.length}</p>
          <p className="text-xs text-neutral-400 mt-1">Awaiting approval</p>
        </div>

        <div className="bg-white border border-neutral-200 rounded-xl p-4">
          <p className="flex items-center gap-1.5 text-sm text-neutral-500">
            <Users className="w-4 h-4" /> Pending Gallery Submissions
          </p>
          <p className="text-3xl font-bold text-blue-600 mt-2">{sportsPendingCount}</p>
          <p className="text-xs text-neutral-400 mt-1">Sports with coach submissions awaiting review</p>
        </div>

        <div className="bg-white border border-neutral-200 rounded-xl p-4">
          <p className="flex items-center gap-1.5 text-sm text-neutral-500">
            <FileCheck className="w-4 h-4" /> Document Submissions
          </p>
          <p className="text-3xl font-bold text-green-600 mt-2">{pendingAthletes.length}</p>
          <p className="text-xs text-neutral-400 mt-1">Athletes pending review</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-neutral-200 rounded-xl p-6">
          <h2 className="flex items-center gap-2 font-semibold text-neutral-900 mb-1">
            <AlertCircle className="w-4 h-4 text-orange-500" />
            Pending Actions
          </h2>
          <p className="text-sm text-neutral-500 mb-4">Tasks requiring immediate attention</p>

          {pendingReservations.length === 0 && pendingAthletes.length === 0 ? (
            <p className="text-sm text-neutral-400 text-center py-8">Nothing needs your attention right now.</p>
          ) : (
            <ul className="space-y-2">
              {pendingReservations.map((r) => (
                <li key={r.id} className="flex items-center justify-between text-sm bg-neutral-50 rounded-lg px-3 py-2">
                  <span className="text-neutral-700">{r.purpose}</span>
                  <Link to="/staff-admin/facility-requests" className="text-orange-600 text-xs font-medium">
                    Review
                  </Link>
                </li>
              ))}
              {pendingAthletes.slice(0, 3).map((a) => (
                <li key={a.id} className="flex items-center justify-between text-sm bg-neutral-50 rounded-lg px-3 py-2">
                  <span className="text-neutral-700">{a.full_name} — {a.sport}</span>
                  <Link to="/staff-admin/athlete-gallery" className="text-orange-600 text-xs font-medium">
                    Review
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="bg-white border border-neutral-200 rounded-xl p-6">
          <h2 className="flex items-center gap-2 font-semibold text-neutral-900 mb-1">
            <Clock className="w-4 h-4 text-neutral-500" />
            Recent Activity
          </h2>
          <p className="text-sm text-neutral-500 mb-4">Latest system activities</p>

          {pendingReservations.length === 0 ? (
            <p className="text-sm text-neutral-400 text-center py-8">No recent activity.</p>
          ) : (
            <ul className="space-y-2">
              {pendingReservations.map((r) => (
                <li key={r.id} className="flex items-center justify-between text-sm bg-neutral-50 rounded-lg px-3 py-2">
                  <span className="text-neutral-700">Facility reservation requested — {r.reservation_date}</span>
                  <span className="text-xs bg-amber-100 text-amber-700 rounded-full px-2 py-0.5">pending</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </StaffAdminPortalLayout>
  );
}
