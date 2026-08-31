import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Users, Activity, AlertTriangle, Building2 } from 'lucide-react';
import SuperAdminPortalLayout from '../../components/layout/SuperAdminPortalLayout';
import { supabase } from '../../lib/supabase';

interface RoleCounts {
  student: number;
  coach: number;
  staff_admin: number;
  registrar: number;
  superadmin: number;
}

interface PendingReservation {
  id: string;
  purpose: string;
  reservation_date: string;
}

export default function SuperAdminDashboardPage() {
  const [counts, setCounts] = useState<RoleCounts>({
    student: 0,
    coach: 0,
    staff_admin: 0,
    registrar: 0,
    superadmin: 0,
  });
  const [pending, setPending] = useState<PendingReservation[]>([]);

  useEffect(() => {
    async function load() {
      const { data: profiles } = await supabase.from('profiles').select('role');
      const next: RoleCounts = { student: 0, coach: 0, staff_admin: 0, registrar: 0, superadmin: 0 };
      (profiles ?? []).forEach((p) => {
        if (p.role in next) next[p.role as keyof RoleCounts] += 1;
      });
      setCounts(next);

      const { data: reservations } = await supabase
        .from('facility_reservations')
        .select('id, purpose, reservation_date')
        .eq('status', 'pending')
        .order('reservation_date', { ascending: true })
        .limit(5);
      setPending(reservations ?? []);
    }
    load();
  }, []);

  const totalUsers = Object.values(counts).reduce((a, b) => a + b, 0);
  const totalAdmins = counts.staff_admin + counts.registrar + counts.superadmin;

  return (
    <SuperAdminPortalLayout>
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Super Admin Dashboard</h1>
        <p className="text-sm text-neutral-500">System-wide overview</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white border border-neutral-200 rounded-xl p-4">
          <p className="text-sm text-neutral-500">Total Users</p>
          <p className="text-3xl font-bold text-neutral-900 mt-1">{totalUsers}</p>
        </div>
        <div className="bg-white border border-neutral-200 rounded-xl p-4">
          <p className="text-sm text-neutral-500">Active Athletes</p>
          <p className="text-3xl font-bold text-orange-600 mt-1">{counts.student}</p>
        </div>
        <div className="bg-white border border-neutral-200 rounded-xl p-4">
          <p className="text-sm text-neutral-500">Pending Requests</p>
          <p className="text-3xl font-bold text-amber-600 mt-1">{pending.length}</p>
          <p className="text-xs text-neutral-400 mt-1">Facility reservations</p>
        </div>
        <div className="bg-white border border-neutral-200 rounded-xl p-4">
          <p className="text-sm text-neutral-500">System Health</p>
          <p className="text-lg font-bold text-green-600 mt-1">Operational</p>
          <p className="text-xs text-neutral-400 mt-1">No live monitoring configured</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-neutral-200 rounded-xl p-6">
          <h2 className="flex items-center gap-2 font-semibold text-neutral-900 mb-4">
            <Users className="w-4 h-4 text-orange-500" />
            User Distribution
          </h2>
          <div className="space-y-3">
            {[
              { label: 'Student Athletes', value: counts.student, color: 'bg-orange-500' },
              { label: 'Coaches', value: counts.coach, color: 'bg-blue-500' },
              { label: 'Staff Admin', value: counts.staff_admin, color: 'bg-purple-500' },
              { label: 'Registrar', value: counts.registrar, color: 'bg-green-500' },
              { label: 'Super Admin', value: counts.superadmin, color: 'bg-red-500' },
            ].map((row) => (
              <div key={row.label} className="flex items-center gap-3 text-sm">
                <span className="w-32 text-neutral-600">{row.label}</span>
                <div className="flex-1 h-2 rounded-full bg-neutral-100 overflow-hidden">
                  <div
                    className={`h-full ${row.color}`}
                    style={{ width: totalUsers ? `${(row.value / totalUsers) * 100}%` : '0%' }}
                  />
                </div>
                <span className="w-6 text-right text-neutral-700 font-medium">{row.value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white border border-neutral-200 rounded-xl p-6">
          <h2 className="flex items-center gap-2 font-semibold text-neutral-900 mb-4">
            <Activity className="w-4 h-4 text-neutral-500" />
            Recent Activity
          </h2>
          {pending.length === 0 ? (
            <p className="text-sm text-neutral-400 text-center py-8">No recent activity.</p>
          ) : (
            <ul className="space-y-2">
              {pending.map((r) => (
                <li key={r.id} className="flex items-center justify-between text-sm bg-neutral-50 rounded-lg px-3 py-2">
                  <span className="text-neutral-700">Facility reservation — {r.purpose}</span>
                  <span className="text-xs bg-amber-100 text-amber-700 rounded-full px-2 py-0.5">pending</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="bg-white border border-neutral-200 rounded-xl p-6">
        <h2 className="flex items-center gap-2 font-semibold text-neutral-900 mb-4">
          <AlertTriangle className="w-4 h-4 text-amber-500" />
          Attention Required
        </h2>
        {pending.length === 0 ? (
          <p className="text-sm text-neutral-400">Nothing needs your attention right now.</p>
        ) : (
          <div className="flex items-center justify-between rounded-lg bg-amber-50 border border-amber-100 px-4 py-3">
            <div>
              <p className="text-sm font-medium text-amber-800">
                {pending.length} Facility Reservation{pending.length === 1 ? '' : 's'} Pending
              </p>
              <p className="text-xs text-amber-700">Awaiting approval</p>
            </div>
            <Link
              to="/superadmin/facility-requests"
              className="flex items-center gap-1.5 text-sm bg-orange-500 hover:bg-orange-600 text-white font-medium px-4 py-2 rounded-lg"
            >
              <Building2 className="w-4 h-4" />
              Review
            </Link>
          </div>
        )}
        <p className="text-xs text-neutral-400 mt-4">
          {totalAdmins} admin account{totalAdmins === 1 ? '' : 's'} currently active across Staff Admin, Registrar, and Super Admin roles.
        </p>
      </div>
    </SuperAdminPortalLayout>
  );
}
