import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import SignUpPage from './pages/SignUpPage';
import ProfileSetupPage from './pages/ProfileSetupPage';
import DashboardPage from './pages/portal/DashboardPage';
import ProfileSettingsPage from './pages/portal/ProfileSettingsPage';
import DocumentsPage from './pages/portal/DocumentsPage';
import SchedulesPage from './pages/portal/SchedulesPage';
import FacilityReservationPage from './pages/portal/FacilityReservationPage';
import RequireAuth from './components/layout/RequireAuth';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignUpPage />} />
        <Route path="/profile-setup" element={<ProfileSetupPage />} />

        <Route
          path="/dashboard"
          element={
            <RequireAuth>
              <DashboardPage />
            </RequireAuth>
          }
        />
        <Route
          path="/profile-settings"
          element={
            <RequireAuth>
              <ProfileSettingsPage />
            </RequireAuth>
          }
        />

        <Route
          path="/documents"
          element={
            <RequireAuth>
              <DocumentsPage />
            </RequireAuth>
          }
        />
        <Route
          path="/schedules"
          element={
            <RequireAuth>
              <SchedulesPage />
            </RequireAuth>
          }
        />
        <Route
          path="/facility-reservation"
          element={
            <RequireAuth>
              <FacilityReservationPage />
            </RequireAuth>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;