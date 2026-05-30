import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { EventProvider } from './context/EventContext';
import { DarkModeProvider } from './context/DarkModeContext';
import { ToastProvider } from './context/ToastContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import AppLayout from './components/AppLayout';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import ResetPasswordInvalid from './pages/ResetPasswordInvalid';
import Dashboard from './pages/Dashboard';
import Events from './pages/Events';
import ActivityLogs from './pages/ActivityLogs';
import Users from './pages/Users';
import ExportExecutiveSummary from './pages/ExportExecutiveSummary';
import QandA from './pages/QandA';
import MyRegisteredEvents from './pages/MyRegisteredEvents';
import UpcomingEvents from './pages/UpcomingEvents';
import Notifications from './pages/Notifications';
import OrganizerCopilot from './components/OrganizerCopilot';
import AdminControl from './pages/AdminControl';
import MyAttendees from './pages/MyAttendees';

function AppRoutes() {
  const { user } = useAuth();
  const showOrganizerCopilot = user?.role === 'organiser';
  const adminOnly = (element) => (user?.role === 'admin' ? element : <Navigate to="/app/dashboard" replace />);
  const organiserOnly = (element) => (user?.role === 'organiser' ? element : <Navigate to="/app/dashboard" replace />);

  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPasswordInvalid />} />
      <Route path="/reset-password/:token" element={<ResetPassword />} />
      <Route
        path="/app"
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/app/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="events" element={<Events />} />
        <Route path="activity" element={<ActivityLogs />} />
        <Route path="users" element={adminOnly(<Users />)} />
        <Route path="export/executive-summary" element={adminOnly(<ExportExecutiveSummary />)} />
        <Route path="my-events" element={<MyRegisteredEvents />} />
        <Route path="my-attendees" element={organiserOnly(<MyAttendees />)} />
        <Route path="upcoming" element={<UpcomingEvents />} />
        <Route path="notifications" element={<Notifications />} />
        <Route path="qa" element={<QandA />} />
        <Route path="admin-control" element={adminOnly(<AdminControl />)} />
        <Route
          path="ai-copilot"
          element={
            showOrganizerCopilot ? (
              <OrganizerCopilot organizerId={user?.id} />
            ) : (
              <Navigate to="/app/dashboard" replace />
            )
          }
        />
      </Route>
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <DarkModeProvider>
        <ToastProvider>
          <AuthProvider>
            <EventProvider>
              <AppRoutes />
            </EventProvider>
          </AuthProvider>
        </ToastProvider>
      </DarkModeProvider>
    </BrowserRouter>
  );
}
