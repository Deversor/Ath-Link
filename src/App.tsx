import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import SignUpPage from './pages/SignUpPage';
import ProfileSetupPage from './pages/ProfileSetupPage';
import CoachProfileSetupPage from './pages/CoachProfileSetupPage';

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
      </Routes>
    </BrowserRouter>
  );
}

export default App;