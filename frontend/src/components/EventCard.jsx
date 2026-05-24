import { useAuth } from '../context/AuthContext';
import { useDarkMode } from '../context/DarkModeContext';
import useViewport from '../hooks/useViewport';

const statusColors = {
  draft: { bg: '#f3f4f6', text: '#6b7280', darkBg: '#374151', darkText: '#9ca3af' },
  published: { bg: '#dcfce7', text: '#16a34a', darkBg: '#14532d', darkText: '#4ade80' },
  cancelled: { bg: '#fee2e2', text: '#dc2626', darkBg: '#7f1d1d', darkText: '#f87171' },
  completed: { bg: '#e0e7ff', text: '#4f46e5', darkBg: '#312e81', darkText: '#a5b4fc' },
};

const priorityColors = {
  conference: '#8b5cf6', workshop: '#f59e0b', webinar: '#06b6d4',
  meetup: '#10b981', concert: '#ec4899', sports: '#f97316', other: '#6b7280',
};

export default function EventCard({ event, onEdit, onDelete }) {
  const { user } = useAuth();
  const { dark, theme } = useDarkMode();
  const { isMobile } = useViewport();
  const canManage = user && (user.id === event.organiser?._id || user.role === 'admin');
  const showActions = canManage && onEdit && onDelete;
  const canRegister = user?.role === 'attendee';
  const isRegistered = Boolean(event.isRegistered);
  const isPublished = event.status === 'published';
  const isFull = event.registeredCount >= event.capacity;

  const fillPct = event.capacity > 0 ? Math.min(100, Math.round((event.registeredCount / event.capacity) * 100)) : 0;
  const sc = statusColors[event.status] || statusColors.draft;

  const cardClickable = typeof event?.onClick === 'function';

  return (
    <div
      onClick={(e) => {
        if (!cardClickable) return;
        if (e.target.closest('button')) return;
        event.onClick(event);
      }}
      role={cardClickable ? 'button' : undefined}
      tabIndex={cardClickable ? 0 : undefined}
      onKeyDown={(e) => {
        if (!cardClickable) return;
        if (e.key !== 'Enter' && e.key !== ' ') return;
        e.preventDefault();
        event.onClick(event);
      }}
      style={{
      background: theme.surface, borderRadius: 12, border: `1px solid ${theme.border}`,
      padding: isMobile ? 16 : 20, display: 'flex', flexDirection: 'column', gap: 12,
      boxShadow: theme.cardShadow, transition: 'all 0.3s',
      height: '100%',
      cursor: cardClickable ? 'pointer' : 'default',
      outline: 'none',
    }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
        <div style={{ minWidth: 0 }}>
          <span style={{
            fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5,
            color: priorityColors[event.category] || '#6b7280',
          }}>
            {event.category}
          </span>
          <h3 style={{ margin: '4px 0 0', fontSize: 16, fontWeight: 600, color: theme.text, lineHeight: 1.3, wordBreak: 'break-word' }}>
            {event.title}
          </h3>
        </div>
        <span style={{
          padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap',
          background: dark ? sc.darkBg : sc.bg, color: dark ? sc.darkText : sc.text,
        }}>
          {event.status}
        </span>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, fontSize: 13, color: theme.textMuted }}>
        <span>{new Date(event.startDate).toLocaleDateString()}</span>
        <span style={{ wordBreak: 'break-word' }}>{event.location}</span>
        {event.price > 0 ? <span>Rs {event.price}</span> : <span style={{ color: '#10b981', fontWeight: 600 }}>Free</span>}
      </div>

      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, fontSize: 12, color: theme.textMuted, marginBottom: 4, flexWrap: 'wrap' }}>
          <span>Capacity</span>
          <span style={{ fontWeight: 600 }}>{event.registeredCount} / {event.capacity} ({fillPct}%)</span>
        </div>
        <div style={{ height: 6, borderRadius: 3, background: theme.border, overflow: 'hidden' }}>
          <div style={{
            height: '100%', borderRadius: 3, width: `${fillPct}%`,
            background: fillPct >= 90 ? '#ef4444' : fillPct >= 60 ? '#f59e0b' : '#6366f1',
            transition: 'width 0.4s ease',
          }} />
        </div>
      </div>

      {showActions && (
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 8, marginTop: 'auto' }}>
          <button onClick={() => onEdit(event)} style={{
            padding: '8px 0', borderRadius: 8, border: `1px solid ${theme.inputBorder}`,
            background: theme.surface, color: theme.textSecondary, fontWeight: 500, fontSize: 13, cursor: 'pointer',
          }}>
            Edit
          </button>
          <button onClick={() => onDelete(event._id)} style={{
            padding: '8px 0', borderRadius: 8, border: `1px solid ${dark ? '#7f1d1d' : '#fee2e2'}`,
            background: dark ? 'rgba(239,68,68,0.1)' : '#fff5f5', color: '#ef4444', fontWeight: 500, fontSize: 13, cursor: 'pointer',
          }}>
            Delete
          </button>
        </div>
      )}

      {canRegister && !showActions && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 8, marginTop: 'auto' }}>
          {isRegistered ? (
            <button
              onClick={() => event.onCancelRegistration?.(event)}
              style={{
                padding: '9px 0', borderRadius: 8, border: `1px solid ${dark ? '#7f1d1d' : '#fecaca'}`,
                background: dark ? 'rgba(239,68,68,0.12)' : '#fff5f5', color: '#dc2626',
                fontWeight: 600, fontSize: 13, cursor: 'pointer',
              }}
            >
              Cancel Registration
            </button>
          ) : (
            <button
              onClick={() => event.onRegister?.(event)}
              disabled={!isPublished || isFull}
              style={{
                padding: '9px 0', borderRadius: 8, border: 'none',
                background: !isPublished || isFull ? '#cbd5e1' : '#10b981', color: '#fff',
                fontWeight: 600, fontSize: 13, cursor: !isPublished || isFull ? 'not-allowed' : 'pointer',
              }}
            >
              {!isPublished ? 'Not Open Yet' : isFull ? 'Event Full' : 'Register Now'}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
