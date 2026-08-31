import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import SignUpPage from './pages/SignUpPage';
import ProfileSetupPage from './pages/ProfileSetupPage';
import CoachProfileSetupPage from './pages/CoachProfileSetupPage';
import AdminVerifyPage from './pages/AdminVerifyPage';
import AdminSignUpPage from './pages/AdminSignUpPage';

// Student portal
import DashboardPage from './pages/portal/DashboardPage';
import ProfileSettingsPage from './pages/portal/ProfileSettingsPage';
import DocumentsPage from './pages/portal/DocumentsPage';
import SchedulesPage from './pages/portal/SchedulesPage';
import FacilityReservationPage from './pages/portal/FacilityReservationPage';

// Coach portal
import CoachDashboardPage from './pages/coach/CoachDashboardPage';
import CoachProfileSettingsPage from './pages/coach/CoachProfileSettingsPage';
import CoachAthletesPage from './pages/coach/CoachAthletesPage';
import CoachSchedulesPage from './pages/coach/CoachSchedulesPage';
import CoachFacilityReservationPage from './pages/coach/CoachFacilityReservationPage';
import CoachReportsPage from './pages/coach/CoachReportsPage';

// Staff Admin portal
import StaffAdminDashboardPage from './pages/staff-admin/StaffAdminDashboardPage';
import StaffAdminWhitelistPage from './pages/staff-admin/StaffAdminWhitelistPage';
import StaffAdminCoachManagementPage from './pages/staff-admin/StaffAdminCoachManagementPage';
import StaffAdminCoachSchedulesPage from './pages/staff-admin/StaffAdminCoachSchedulesPage';
import StaffAdminFacilityRequestsPage from './pages/staff-admin/StaffAdminFacilityRequestsPage';
import StaffAdminAthleteGalleryPage from './pages/staff-admin/StaffAdminAthleteGalleryPage';
import StaffAdminReportsPage from './pages/staff-admin/StaffAdminReportsPage';

// Super Admin portal
import SuperAdminDashboardPage from './pages/super-admin/SuperAdminDashboardPage';
import SuperAdminProfileSettingsPage from './pages/super-admin/SuperAdminProfileSettingsPage';
import SuperAdminUserManagementPage from './pages/super-admin/SuperAdminUserManagementPage';
import SuperAdminSportProgramsPage from './pages/super-admin/SuperAdminSportProgramsPage';
import SuperAdminWhitelistPage from './pages/super-admin/SuperAdminWhitelistPage';
import SuperAdminFacilityRequestsPage from './pages/super-admin/SuperAdminFacilityRequestsPage';
import SuperAdminCoachSchedulesPage from './pages/super-admin/SuperAdminCoachSchedulesPage';
import SuperAdminAthleteGalleryPage from './pages/super-admin/SuperAdminAthleteGalleryPage';
import SuperAdminCoachManagementPage from './pages/super-admin/SuperAdminCoachManagementPage';

import RequireAuth from './components/layout/RequireAuth';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignUpPage />} />
        <Route path="/profile-setup" element={<ProfileSetupPage />} />
        <Route path="/coach-profile-setup" element={<CoachProfileSetupPage />} />
        <Route path="/admin-verify" element={<AdminVerifyPage />} />
        <Route path="/admin-signup" element={<AdminSignUpPage />} />

        {/* ── Student portal ── */}
        <Route
          path="/dashboard"
          element={
            <RequireAuth role="student">
              <DashboardPage />
            </RequireAuth>
          }
        />
        <Route
          path="/profile-settings"
          element={
            <RequireAuth role="student">
              <ProfileSettingsPage />
            </RequireAuth>
          }
        />
        <Route
          path="/documents"
          element={
            <RequireAuth role="student">
              <DocumentsPage />
            </RequireAuth>
          }
        />
        <Route
          path="/schedules"
          element={
            <RequireAuth role="student">
              <SchedulesPage />
            </RequireAuth>
          }
        />
        <Route
          path="/facility-reservation"
          element={
            <RequireAuth role="student">
              <FacilityReservationPage />
            </RequireAuth>
          }
        />

        {/* ── Coach portal ── */}
        <Route
          path="/coach/dashboard"
          element={
            <RequireAuth role="coach">
              <CoachDashboardPage />
            </RequireAuth>
          }
        />
        <Route
          path="/coach/profile-settings"
          element={
            <RequireAuth role="coach">
              <CoachProfileSettingsPage />
            </RequireAuth>
          }
        />
        <Route
          path="/coach/athletes"
          element={
            <RequireAuth role="coach">
              <CoachAthletesPage />
            </RequireAuth>
          }
        />
        <Route
          path="/coach/schedules"
          element={
            <RequireAuth role="coach">
              <CoachSchedulesPage />
            </RequireAuth>
          }
        />
        <Route
          path="/coach/facility-reservation"
          element={
            <RequireAuth role="coach">
              <CoachFacilityReservationPage />
            </RequireAuth>
          }
        />
        <Route
          path="/coach/reports"
          element={
            <RequireAuth role="coach">
              <CoachReportsPage />
            </RequireAuth>
          }
        />
        {/* TODO Phase 2: /coach/athletes, /coach/schedules, /coach/facility-reservation, /coach/reports */}

        {/* ── Staff Admin portal ── */}
        <Route
          path="/staff-admin/dashboard"
          element={
            <RequireAuth role="staff_admin">
              <StaffAdminDashboardPage />
            </RequireAuth>
          }
        />
        <Route
          path="/staff-admin/whitelist"
          element={
            <RequireAuth role="staff_admin">
              <StaffAdminWhitelistPage />
            </RequireAuth>
          }
        />
        <Route
          path="/staff-admin/coach-management"
          element={
            <RequireAuth role="staff_admin">
              <StaffAdminCoachManagementPage />
            </RequireAuth>
          }
        />
        <Route
          path="/staff-admin/coach-schedules"
          element={
            <RequireAuth role="staff_admin">
              <StaffAdminCoachSchedulesPage />
            </RequireAuth>
          }
        />
        <Route
          path="/staff-admin/facility-requests"
          element={
            <RequireAuth role="staff_admin">
              <StaffAdminFacilityRequestsPage />
            </RequireAuth>
          }
        />
        <Route
          path="/staff-admin/athlete-gallery"
          element={
            <RequireAuth role="staff_admin">
              <StaffAdminAthleteGalleryPage />
            </RequireAuth>
          }
        />
        <Route
          path="/staff-admin/reports"
          element={
            <RequireAuth role="staff_admin">
              <StaffAdminReportsPage />
            </RequireAuth>
          }
        />
        {/* TODO Phase 3: /staff-admin/profile-settings */}

        {/* ── Super Admin portal ── */}
        <Route
          path="/superadmin/dashboard"
          element={
            <RequireAuth role="superadmin">
              <SuperAdminDashboardPage />
            </RequireAuth>
          }
        />
        <Route
          path="/superadmin/profile-settings"
          element={
            <RequireAuth role="superadmin">
              <SuperAdminProfileSettingsPage />
            </RequireAuth>
          }
        />
        <Route
          path="/superadmin/users"
          element={
            <RequireAuth role="superadmin">
              <SuperAdminUserManagementPage />
            </RequireAuth>
          }
        />
        <Route
          path="/superadmin/sport-programs"
          element={
            <RequireAuth role="superadmin">
              <SuperAdminSportProgramsPage />
            </RequireAuth>
          }
        />
        <Route
          path="/superadmin/whitelist"
          element={
            <RequireAuth role="superadmin">
              <SuperAdminWhitelistPage />
            </RequireAuth>
          }
        />
        <Route
          path="/superadmin/facility-requests"
          element={
            <RequireAuth role="superadmin">
              <SuperAdminFacilityRequestsPage />
            </RequireAuth>
          }
        />
        <Route
          path="/superadmin/coach-schedules"
          element={
            <RequireAuth role="superadmin">
              <SuperAdminCoachSchedulesPage />
            </RequireAuth>
          }
        />
        <Route
          path="/superadmin/athlete-gallery"
          element={
            <RequireAuth role="superadmin">
              <SuperAdminAthleteGalleryPage />
            </RequireAuth>
          }
        />
        <Route
          path="/superadmin/coach-management"
          element={
            <RequireAuth role="superadmin">
              <SuperAdminCoachManagementPage />
            </RequireAuth>
          }
        />
        {/* TODO Phase 4: /superadmin/system-logs, /superadmin/reports */}
        {/* TODO Phase 5: /superadmin/database, /superadmin/system-settings */}
      </Routes>
    </BrowserRouter>
  );
}

export default App;