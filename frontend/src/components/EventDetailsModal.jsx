import { useEffect, useMemo, useState } from 'react';
import { useDarkMode } from '../context/DarkModeContext';
import useViewport from '../hooks/useViewport';

const statusColors = {
  draft: { bg: '#f3f4f6', text: '#6b7280', darkBg: '#374151', darkText: '#9ca3af' },
  published: { bg: '#dcfce7', text: '#16a34a', darkBg: '#14532d', darkText: '#4ade80' },
  cancelled: { bg: '#fee2e2', text: '#dc2626', darkBg: '#7f1d1d', darkText: '#f87171' },
  completed: { bg: '#e0e7ff', text: '#4f46e5', darkBg: '#312e81', darkText: '#a5b4fc' },
};

const categoryColors = {
  conference: '#8b5cf6',
  workshop: '#f59e0b',
  webinar: '#06b6d4',
  meetup: '#10b981',
  concert: '#ec4899',
  sports: '#f97316',
  other: '#6b7280',
};

function formatDate(value) {
  const date = value ? new Date(value) : null;
  if (!date || Number.isNaN(date.valueOf())) return '—';
  return date.toLocaleDateString();
}

function formatDateTime(value) {
  const date = value ? new Date(value) : null;
  if (!date || Number.isNaN(date.valueOf())) return '—';
  return date.toLocaleString(undefined, { year: 'numeric', month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' });
}

function googleMapsUrl(location) {
  const query = String(location || '').trim();
  if (!query) return '';
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

function initials(nameOrEmail) {
  const value = String(nameOrEmail || '').trim();
  if (!value) return '?';
  const parts = value.split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] || value[0];
  const last = parts.length > 1 ? parts[parts.length - 1][0] : '';
  return (first + last).toUpperCase();
}

export default function EventDetailsModal({
  event,
  open,
  onClose,
  onEdit,
  onDelete,
  onShare,
}) {
  const { dark, theme } = useDarkMode();
  const { isMobile } = useViewport();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (!open) return;
    setMounted(false);
    const t = setTimeout(() => setMounted(true), 10);
    return () => clearTimeout(t);
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  const safeEvent = event || null;

  const fillPct = useMemo(() => {
    if (!safeEvent || !safeEvent.capacity || safeEvent.capacity <= 0) return 0;
    return Math.min(100, Math.round(((safeEvent.registeredCount || 0) / safeEvent.capacity) * 100));
  }, [safeEvent]);

  const availableSeats = useMemo(() => {
    if (!safeEvent) return 0;
    const cap = Number(safeEvent.capacity) || 0;
    const reg = Number(safeEvent.registeredCount) || 0;
    return Math.max(0, cap - reg);
  }, [safeEvent]);

  if (!open || !safeEvent) return null;

  const sc = statusColors[safeEvent.status] || statusColors.draft;
  const categoryColor = categoryColors[safeEvent.category] || '#6b7280';
  const mapsUrl = googleMapsUrl(safeEvent.location);

  const overlayStyle = {
    position: 'fixed',
    inset: 0,
    zIndex: 60,
    background: dark ? 'rgba(0,0,0,0.55)' : 'rgba(15,23,42,0.35)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: isMobile ? 'flex-end' : 'center',
    padding: isMobile ? 12 : 20,
    opacity: mounted ? 1 : 0,
    transition: 'opacity 180ms ease',
  };

  const modalStyle = {
    width: '100%',
    maxWidth: 820,
    background: theme.surface,
    borderRadius: 12,
    border: `1px solid ${theme.border}`,
    boxShadow: theme.cardShadow,
    overflow: 'hidden',
    transform: mounted ? 'translateY(0px) scale(1)' : isMobile ? 'translateY(10px) scale(0.99)' : 'translateY(6px) scale(0.985)',
    transition: 'transform 180ms ease',
  };

  const sectionStyle = {
    padding: isMobile ? 16 : 20,
    borderBottom: `1px solid ${theme.border}`,
  };

  const labelStyle = { fontSize: 12, fontWeight: 900, color: theme.textMuted, marginBottom: 4 };
  const valueStyle = { fontSize: 13.5, color: theme.text, lineHeight: 1.45, wordBreak: 'break-word' };

  const neutralBtn = {
    padding: '9px 12px',
    borderRadius: 8,
    border: `1px solid ${theme.inputBorder}`,
    background: theme.surface,
    color: theme.textSecondary,
    fontWeight: 600,
    fontSize: 13,
    cursor: 'pointer',
  };

  const dangerBtn = {
    padding: '9px 12px',
    borderRadius: 8,
    border: `1px solid ${dark ? '#7f1d1d' : '#fee2e2'}`,
    background: dark ? 'rgba(239,68,68,0.1)' : '#fff5f5',
    color: '#ef4444',
    fontWeight: 600,
    fontSize: 13,
    cursor: 'pointer',
  };

  const primaryGhostBtn = {
    padding: '9px 12px',
    borderRadius: 8,
    border: `1px solid ${theme.inputBorder}`,
    background: theme.surface,
    color: theme.textSecondary,
    fontWeight: 600,
    fontSize: 13,
    cursor: 'pointer',
  };

  const attendees = Array.isArray(safeEvent.attendees) ? safeEvent.attendees : [];
  const attendeeCount = Number.isFinite(Number(safeEvent.registeredCount)) ? Number(safeEvent.registeredCount) : attendees.length;

  return (
    <div
      style={overlayStyle}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Event details"
    >
      <div style={modalStyle}>
        <div style={sectionStyle}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <span style={{
                  fontSize: 11,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                  color: categoryColor,
                }}
                >
                  {safeEvent.category}
                </span>
                <span style={{
                  padding: '3px 10px',
                  borderRadius: 20,
                  fontSize: 12,
                  fontWeight: 600,
                  whiteSpace: 'nowrap',
                  background: dark ? sc.darkBg : sc.bg,
                  color: dark ? sc.darkText : sc.text,
                }}
                >
                  {safeEvent.status}
                </span>
              </div>
              <h3 style={{ margin: '6px 0 0', fontSize: 18, fontWeight: 700, color: theme.text, lineHeight: 1.25, wordBreak: 'break-word' }}>
                {safeEvent.title}
              </h3>
            </div>
            <button
              onClick={() => onClose?.()}
              aria-label="Close"
              style={{
                border: `1px solid ${theme.inputBorder}`,
                background: theme.surface,
                color: theme.textSecondary,
                borderRadius: 10,
                width: 36,
                height: 36,
                cursor: 'pointer',
                fontSize: 16,
                lineHeight: '34px',
                textAlign: 'center',
                flexShrink: 0,
              }}
            >
              ✕
            </button>
          </div>
        </div>

        <div style={{ ...sectionStyle, paddingBottom: isMobile ? 14 : 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 14 }}>
            <div>
              <div style={labelStyle}>Date</div>
              <div style={valueStyle}>
                {formatDateTime(safeEvent.startDate)} {safeEvent.endDate ? `→ ${formatDateTime(safeEvent.endDate)}` : ''}
              </div>
            </div>
            <div>
              <div style={labelStyle}>Location</div>
              <div style={{ ...valueStyle, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <span>{safeEvent.location || '—'}</span>
                {mapsUrl && (
                  <a
                    href={mapsUrl}
                    target="_blank"
                    rel="noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    style={{
                      padding: '6px 10px',
                      borderRadius: 999,
                      border: `1px solid ${theme.inputBorder}`,
                      background: theme.surface,
                      color: theme.textSecondary,
                      fontWeight: 700,
                      fontSize: 12,
                      textDecoration: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    Open in Maps
                  </a>
                )}
              </div>
            </div>
            <div>
              <div style={labelStyle}>Price</div>
              <div style={valueStyle}>{safeEvent.price > 0 ? `Rs ${safeEvent.price}` : 'Free'}</div>
            </div>
            <div>
              <div style={labelStyle}>Registration Deadline</div>
              <div style={valueStyle}>{safeEvent.registrationDeadline ? formatDate(safeEvent.registrationDeadline) : formatDate(safeEvent.startDate)}</div>
            </div>
          </div>

          <div style={{ marginTop: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, fontSize: 12, color: theme.textMuted, marginBottom: 4, flexWrap: 'wrap' }}>
              <span>Capacity</span>
              <span style={{ fontWeight: 600 }}>{safeEvent.registeredCount || 0} / {safeEvent.capacity} ({fillPct}%)</span>
            </div>
            <div style={{ height: 6, borderRadius: 3, background: theme.border, overflow: 'hidden' }}>
              <div style={{
                height: '100%',
                borderRadius: 3,
                width: `${fillPct}%`,
                background: fillPct >= 90 ? '#ef4444' : fillPct >= 60 ? '#f59e0b' : '#6366f1',
                transition: 'width 0.4s ease',
              }}
              />
            </div>
            <div style={{ marginTop: 6, fontSize: 12.5, color: theme.textMuted }}>
              Available seats: <span style={{ fontWeight: 700, color: theme.textSecondary }}>{availableSeats}</span>
            </div>
          </div>
        </div>

        <div style={sectionStyle}>
          <div style={labelStyle}>Description</div>
          <div style={valueStyle}>{safeEvent.description || '—'}</div>
        </div>

        <div style={{ ...sectionStyle, paddingBottom: isMobile ? 14 : 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 14 }}>
            <div>
              <div style={labelStyle}>Organizer</div>
              <div style={valueStyle}>{safeEvent.organiser?.name || safeEvent.organiser?.email || '—'}</div>
            </div>
            <div>
              <div style={labelStyle}>Attendees</div>
              <div style={valueStyle}>{attendeeCount} registered user{attendeeCount === 1 ? '' : 's'}</div>
              {attendees.length > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
                  {attendees.slice(0, 6).map((a) => (
                    <div
                      key={a._id || a.email || a.name}
                      title={a.name || a.email}
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: '50%',
                        border: `1px solid ${theme.border}`,
                        background: theme.surface,
                        color: theme.textSecondary,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 11,
                        fontWeight: 800,
                      }}
                    >
                      {initials(a.name || a.email)}
                    </div>
                  ))}
                  {attendees.length > 6 && (
                    <div style={{ fontSize: 12.5, color: theme.textMuted, fontWeight: 700 }}>+{attendees.length - 6}</div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <div style={{ padding: isMobile ? 16 : 20 }}>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
            {onShare && (
              <button onClick={() => onShare(safeEvent)} style={primaryGhostBtn}>
                Share
              </button>
            )}
            {onEdit && (
              <button onClick={() => onEdit(safeEvent)} style={neutralBtn}>
                Edit
              </button>
            )}
            {onDelete && (
              <button onClick={() => onDelete(safeEvent._id)} style={dangerBtn}>
                Delete
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
