import { useEffect, useState } from 'react';
import { BarChart3, Building2, Users, ImageIcon, Download } from 'lucide-react';
import StaffAdminPortalLayout from '../../components/layout/StaffAdminPortalLayout';
import { supabase } from '../../lib/supabase';
import { SPORTS_LIST } from '../../lib/schemas/signupSchema';

function downloadCsv(filename: string, rows: (string | number)[][]) {
  const csv = rows.map((r) => r.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export default function StaffAdminReportsPage() {
  const [facilityRequestCount, setFacilityRequestCount] = useState(0);
  const [athleteCount, setAthleteCount] = useState(0);
  const [approvalRate, setApprovalRate] = useState(0);
  const [coachBySport, setCoachBySport] = useState<Record<string, string>>({});
  const [facilityCount, setFacilityCount] = useState(0);
  const [allReservations, setAllReservations] = useState<Record<string, unknown>[]>([]);

  useEffect(() => {
    async function load() {
      const { count: reqCount } = await supabase
        .from('facility_reservations')
        .select('id', { count: 'exact', head: true });
      setFacilityRequestCount(reqCount ?? 0);

      const { count: athCount } = await supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .eq('role', 'student');
      setAthleteCount(athCount ?? 0);

      const { data: statuses } = await supabase
        .from('profiles')
        .select('document_compile_status')
        .eq('role', 'student')
        .in('document_compile_status', ['submitted_to_admin', 'staff_approved', 'sent_to_registrar']);
      const total = statuses?.length ?? 0;
      const approved = (statuses ?? []).filter(
        (s) => s.document_compile_status === 'staff_approved' || s.document_compile_status === 'sent_to_registrar'
      ).length;
      setApprovalRate(total === 0 ? 0 : Math.round((approved / total) * 100));

      const { data: coaches } = await supabase.from('profiles').select('sport, full_name').eq('role', 'coach');
      setCoachBySport(Object.fromEntries((coaches ?? []).filter((c) => c.sport).map((c) => [c.sport as string, c.full_name])));

      const { count: facCount } = await supabase.from('facilities').select('id', { count: 'exact', head: true });
      setFacilityCount(facCount ?? 0);

      const { data: reservations } = await supabase
        .from('facility_reservations')
        .select('reservation_date, start_time, end_time, purpose, status, facility_id');
      setAllReservations(reservations ?? []);
    }
    load();
  }, []);

  const sportsWithCoach = Object.keys(coachBySport).length;

  const exportCoachAssignments = () => {
    downloadCsv('coach-assignments.csv', [
      ['Sport', 'Coach', 'Status'],
      ...SPORTS_LIST.map((s) => [s, coachBySport[s] ?? '', coachBySport[s] ? 'Active' : 'Vacant']),
    ]);
  };

  const exportFacilityReservations = () => {
    downloadCsv('facility-reservations.csv', [
      ['Date', 'Start', 'End', 'Purpose', 'Status'],
      ...allReservations.map((r) => [
        String(r.reservation_date),
        String(r.start_time),
        String(r.end_time),
        String(r.purpose),
        String(r.status),
      ]),
    ]);
  };

  return (
    <StaffAdminPortalLayout>
      <div>
        <h1 className="flex items-center gap-2 text-lg font-bold text-neutral-900">
          <BarChart3 className="w-5 h-5 text-orange-500" />
          Reports & Analytics
        </h1>
        <p className="text-sm text-neutral-500">Comprehensive reporting for sports office operations</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-neutral-200 rounded-xl p-4">
          <p className="flex items-center gap-1.5 text-sm text-neutral-500">
            <Building2 className="w-4 h-4" /> Total Facility Requests
          </p>
          <p className="text-3xl font-bold text-neutral-900 mt-1">{facilityRequestCount}</p>
        </div>
        <div className="bg-white border border-neutral-200 rounded-xl p-4">
          <p className="flex items-center gap-1.5 text-sm text-neutral-500">
            <Users className="w-4 h-4" /> Registered Athletes
          </p>
          <p className="text-3xl font-bold text-neutral-900 mt-1">{athleteCount}</p>
        </div>
        <div className="bg-white border border-neutral-200 rounded-xl p-4">
          <p className="flex items-center gap-1.5 text-sm text-neutral-500">
            <ImageIcon className="w-4 h-4" /> Gallery Approval Rate
          </p>
          <p className="text-3xl font-bold text-green-600 mt-1">{approvalRate}%</p>
        </div>
      </div>

      <div className="bg-white border border-neutral-200 rounded-xl p-6">
        <h2 className="font-semibold text-neutral-900 mb-1">Coach Assignments</h2>
        <p className="text-sm text-neutral-500 mb-4">Overview of coach assignments by sport</p>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {SPORTS_LIST.map((sport) => (
            <div key={sport} className="flex items-center justify-between rounded-lg border border-neutral-100 bg-neutral-50 px-3 py-2 text-sm">
              <div>
                <p className="text-neutral-800">{sport}</p>
                {coachBySport[sport] && <p className="text-xs text-neutral-500">Coach: {coachBySport[sport]}</p>}
              </div>
              <span
                className={`text-xs font-medium rounded-full px-2 py-0.5 ${
                  coachBySport[sport] ? 'bg-green-100 text-green-700' : 'bg-neutral-200 text-neutral-500'
                }`}
              >
                {coachBySport[sport] ? 'Active' : 'Vacant'}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white border border-neutral-200 rounded-xl p-6">
        <h2 className="font-semibold text-neutral-900 mb-4">System Activity Summary</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="rounded-lg bg-orange-50 px-3 py-3 text-center">
            <p className="text-xl font-bold text-orange-700">{sportsWithCoach}/{SPORTS_LIST.length}</p>
            <p className="text-xs text-orange-600">Sports with assigned coaches</p>
          </div>
          <div className="rounded-lg bg-green-50 px-3 py-3 text-center">
            <p className="text-xl font-bold text-green-700">{athleteCount}</p>
            <p className="text-xs text-green-600">Registered student athletes</p>
          </div>
          <div className="rounded-lg bg-blue-50 px-3 py-3 text-center">
            <p className="text-xl font-bold text-blue-700">{facilityCount}</p>
            <p className="text-xs text-blue-600">Facilities available</p>
          </div>
          <div className="rounded-lg bg-purple-50 px-3 py-3 text-center">
            <p className="text-xl font-bold text-purple-700">{facilityRequestCount}</p>
            <p className="text-xs text-purple-600">Total facility requests</p>
          </div>
        </div>
      </div>

      <div className="bg-white border border-neutral-200 rounded-xl p-6">
        <h2 className="font-semibold text-neutral-900 mb-1">Export Reports</h2>
        <p className="text-sm text-neutral-500 mb-4">Download detailed reports for record-keeping</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <button
            type="button"
            onClick={exportCoachAssignments}
            className="flex flex-col items-center gap-1.5 border border-neutral-200 rounded-lg py-4 hover:bg-neutral-50"
          >
            <Download className="w-4 h-4 text-neutral-500" />
            <span className="text-xs font-medium text-neutral-700">Coach Assignments</span>
            <span className="text-[10px] text-neutral-400">CSV</span>
          </button>
          <button
            type="button"
            onClick={exportFacilityReservations}
            className="flex flex-col items-center gap-1.5 border border-neutral-200 rounded-lg py-4 hover:bg-neutral-50"
          >
            <Download className="w-4 h-4 text-neutral-500" />
            <span className="text-xs font-medium text-neutral-700">Facility Reservations</span>
            <span className="text-[10px] text-neutral-400">CSV</span>
          </button>
        </div>
        <p className="text-xs text-neutral-400 mt-3">
          Additional report formats (PDF) aren't available yet.
        </p>
      </div>
    </StaffAdminPortalLayout>
  );
}
