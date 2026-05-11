import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { EventProvider } from './context/EventContext';
import { DarkModeProvider } from './context/DarkModeContext';
import { ToastProvider } from './context/ToastContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import AppLayout from './components/AppLayout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Events from './pages/Events';

export default function App() {
  return (
    <BrowserRouter>
      <DarkModeProvider>
        <ToastProvider>
          <AuthProvider>
            <EventProvider>
              <Routes>
                <Route path="/" element={<Navigate to="/login" replace />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
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
                </Route>
                <Route path="*" element={<Navigate to="/login" replace />} />
              </Routes>
            </EventProvider>
          </AuthProvider>
        </ToastProvider>
      </DarkModeProvider>
    </BrowserRouter>
  );
}
