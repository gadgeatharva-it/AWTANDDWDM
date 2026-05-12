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

export default function MyRegisteredEvents() {
  const { user } = useAuth();
  const { theme } = useDarkMode();
  const { isMobile } = useViewport();
  const { myRegistrations, loading, fetchMyRegistrations } = useEvents();

  const isAttendee = user?.role === 'attendee';

  useEffect(() => {
    if (isAttendee) fetchMyRegistrations();
  }, [fetchMyRegistrations, isAttendee]);

  const rows = useMemo(() => {
    const now = new Date();
    const events = myRegistrations.map((r) => r.event).filter(Boolean);
    return events
      .sort((a, b) => new Date(a.startDate) - new Date(b.startDate))
      .map((event) => {
        const endDate = event?.endDate ? new Date(event.endDate) : null;
        const isCompleted = endDate && !Number.isNaN(endDate.valueOf()) ? endDate < now : false;
        return {
          id: event._id,
          title: event.title,
          date: formatShortDate(event.startDate),
          location: event.location || 'Online',
          status: isCompleted ? 'Completed' : 'Upcoming',
        };
      });
  }, [myRegistrations]);

  if (!isAttendee) {
    return (
      <div style={{ background: theme.surface, borderRadius: 12, padding: 22, border: `1px solid ${theme.border}` }}>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: theme.text }}>My Registered Events</h2>
        <p style={{ margin: '8px 0 0', fontSize: 13, color: theme.textMuted }}>This page is for attendees only.</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <h2 style={{ margin: 0, fontSize: isMobile ? 20 : 22, fontWeight: 800, color: theme.text }}>My Registered Events</h2>
        <p style={{ margin: '2px 0 0', fontSize: 13, color: theme.textMuted }}>Events you’ve registered for</p>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : rows.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '56px 0', color: theme.textFaint }}>
          <div style={{ fontSize: 44, marginBottom: 12 }}>Events</div>
          <p style={{ fontSize: 15, margin: 0 }}>No registrations yet</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {rows.map((row) => (
            <div key={row.id} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', padding: '12px 14px', borderRadius: 12, border: `1px solid ${theme.border}`, background: theme.surface }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: row.status === 'Upcoming' ? '#10b981' : '#94a3b8', marginTop: 6, flex: '0 0 auto' }} />
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontWeight: 800, color: theme.text, fontSize: 14.5, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={row.title}>
                  {row.title}
                </div>
                <div style={{ marginTop: 4, color: theme.textMuted, fontSize: 12.8 }}>{row.date} • {row.location}</div>
              </div>
              <div style={{
                padding: '6px 10px',
                borderRadius: 999,
                fontSize: 11.5,
                fontWeight: 900,
                background: row.status === 'Upcoming' ? 'rgba(16,185,129,0.10)' : 'rgba(148,163,184,0.15)',
                color: row.status === 'Upcoming' ? '#10b981' : theme.textMuted,
                border: `1px solid ${row.status === 'Upcoming' ? 'rgba(16,185,129,0.30)' : theme.border}`,
                whiteSpace: 'nowrap',
                flex: '0 0 auto',
              }}
              >
                {row.status}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

