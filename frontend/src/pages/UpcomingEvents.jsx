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

export default function UpcomingEvents() {
  const { user } = useAuth();
  const { theme } = useDarkMode();
  const { isMobile } = useViewport();
  const { myRegistrations, loading, fetchMyRegistrations } = useEvents();

  const isAttendee = user?.role === 'attendee';

  useEffect(() => {
    if (isAttendee) fetchMyRegistrations();
  }, [fetchMyRegistrations, isAttendee]);

  const upcoming = useMemo(() => {
    const now = new Date();
    const events = myRegistrations.map((r) => r.event).filter(Boolean);
    const next = events
      .map((e) => ({ event: e, start: e?.startDate ? new Date(e.startDate) : null }))
      .filter((x) => x.start && !Number.isNaN(x.start.valueOf()))
      .filter((x) => {
        const diff = x.start - now;
        return diff >= 0 && diff <= 7 * 24 * 60 * 60 * 1000;
      })
      .sort((a, b) => a.start - b.start)[0];
    if (!next) return null;
    return {
      id: next.event._id,
      title: next.event.title,
      date: formatShortDate(next.event.startDate),
      time: formatShortTime(next.event.startDate),
      location: next.event.location || 'Online',
    };
  }, [myRegistrations]);

  if (!isAttendee) {
    return (
      <div style={{ background: theme.surface, borderRadius: 12, padding: 22, border: `1px solid ${theme.border}` }}>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: theme.text }}>Upcoming Events</h2>
        <p style={{ margin: '8px 0 0', fontSize: 13, color: theme.textMuted }}>This page is for attendees only.</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <h2 style={{ margin: 0, fontSize: isMobile ? 20 : 22, fontWeight: 800, color: theme.text }}>Upcoming Events (Next 7 days)</h2>
        <p style={{ margin: '2px 0 0', fontSize: 13, color: theme.textMuted }}>Your soonest upcoming event</p>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : !upcoming ? (
        <div style={{ textAlign: 'center', padding: '56px 0', color: theme.textFaint }}>
          <div style={{ fontSize: 44, marginBottom: 12 }}>Upcoming</div>
          <p style={{ fontSize: 15, margin: 0 }}>No upcoming events in the next 7 days</p>
        </div>
      ) : (
        <div style={{ padding: 16, borderRadius: 14, border: `1px solid ${theme.border}`, background: theme.surface }}>
          <div style={{ fontSize: 12, color: theme.textMuted, fontWeight: 900, marginBottom: 10 }}>Upcoming Event</div>
          <div style={{ fontSize: 18, fontWeight: 900, color: theme.text, marginBottom: 10 }}>{upcoming.title}</div>
          <div style={{ fontSize: 13.5, color: theme.textMuted, lineHeight: 1.8 }}>
            <div>Date: {upcoming.date}</div>
            <div>Time: {upcoming.time}</div>
            <div>Location: {upcoming.location}</div>
          </div>
        </div>
      )}
    </div>
  );
}

