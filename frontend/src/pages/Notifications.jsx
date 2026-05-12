import { useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useDarkMode } from '../context/DarkModeContext';
import { useEvents } from '../context/EventContext';
import { LoadingSpinner } from '../components/ProtectedRoute';
import useViewport from '../hooks/useViewport';

function formatShortDate(value) {
  const date = value ? new Date(value) : null;
  if (!date || Number.isNaN(date.valueOf())) return '—';
  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: '2-digit' });
}

function formatShortTime(value) {
  const date = value ? new Date(value) : null;
  if (!date || Number.isNaN(date.valueOf())) return '—';
  return date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}

export default function Notifications() {
  const { user } = useAuth();
  const { theme } = useDarkMode();
  const { isMobile } = useViewport();
  const { myRegistrations, loading, fetchMyRegistrations } = useEvents();

  const isAttendee = user?.role === 'attendee';

  useEffect(() => {
    if (isAttendee) fetchMyRegistrations();
  }, [fetchMyRegistrations, isAttendee]);

  const notifications = useMemo(() => {
    const now = new Date();
    const events = myRegistrations.map((r) => r.event).filter(Boolean);
    const sorted = [...events].sort((a, b) => new Date(a.startDate) - new Date(b.startDate));

    return sorted.flatMap((event) => {
      const items = [];
      const start = event?.startDate ? new Date(event.startDate) : null;

      if (event?.status === 'cancelled') {
        items.push({
          id: `${event._id}-cancelled`,
          title: 'Cancellation alert',
          message: `"${event.title}" has been cancelled.`,
          time: formatShortDate(event.updatedAt || event.startDate),
          tone: 'danger',
        });
      }

      if (start && !Number.isNaN(start.valueOf())) {
        const diff = start - now;
        if (diff > 0 && diff <= 24 * 60 * 60 * 1000) {
          items.push({
            id: `${event._id}-reminder`,
            title: 'Event reminder',
            message: `"${event.title}" starts ${formatShortDate(event.startDate)} at ${formatShortTime(event.startDate)}.`,
            time: formatShortDate(event.startDate),
            tone: 'success',
          });
        } else if (diff > 0 && diff <= 7 * 24 * 60 * 60 * 1000) {
          items.push({
            id: `${event._id}-upcoming`,
            title: 'Event update',
            message: `You have "${event.title}" coming up on ${formatShortDate(event.startDate)}.`,
            time: formatShortDate(event.startDate),
            tone: 'info',
          });
        }
      }

      return items;
    }).slice(0, 12);
  }, [myRegistrations]);

  if (!isAttendee) {
    return (
      <div style={{ background: theme.surface, borderRadius: 12, padding: 22, border: `1px solid ${theme.border}` }}>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: theme.text }}>Notifications</h2>
        <p style={{ margin: '8px 0 0', fontSize: 13, color: theme.textMuted }}>This page is for attendees only.</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <h2 style={{ margin: 0, fontSize: isMobile ? 20 : 22, fontWeight: 800, color: theme.text }}>Notifications</h2>
        <p style={{ margin: '2px 0 0', fontSize: 13, color: theme.textMuted }}>Event reminders, updates, and cancellation alerts</p>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : notifications.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '56px 0', color: theme.textFaint }}>
          <div style={{ fontSize: 44, marginBottom: 12 }}>🔔</div>
          <p style={{ fontSize: 15, margin: 0 }}>No notifications right now</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {notifications.map((note) => (
            <div key={note.id} style={{ padding: '12px 14px', borderRadius: 12, border: `1px solid ${theme.border}`, background: theme.surface }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                <div style={{ fontWeight: 900, fontSize: 13.5, color: theme.text }}>{note.title}</div>
                <div style={{ fontSize: 12.5, color: theme.textFaint, whiteSpace: 'nowrap' }}>{note.time}</div>
              </div>
              <div style={{ marginTop: 6, fontSize: 13, color: theme.textMuted, lineHeight: 1.4 }}>{note.message}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

