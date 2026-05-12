import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useDarkMode } from '../context/DarkModeContext';
import { useToast } from '../context/ToastContext';
import { LoadingSpinner } from '../components/ProtectedRoute';
import { eventService } from '../services/eventService';
import useViewport from '../hooks/useViewport';

function formatDateTime(value) {
  const date = value ? new Date(value) : null;
  if (!date || Number.isNaN(date.valueOf())) return '—';
  return date.toLocaleString(undefined, { year: 'numeric', month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' });
}

export default function ActivityLogs() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { theme } = useDarkMode();
  const { isMobile } = useViewport();

  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 0 });
  const [filters, setFilters] = useState({ page: 1, limit: 20 });

  const canView = user?.role === 'organiser' || user?.role === 'admin';

  const load = useCallback(async () => {
    if (!canView) return;
    setLoading(true);
    try {
      const { data } = await eventService.getRegistrationActivity(filters);
      setLogs(Array.isArray(data?.logs) ? data.logs : []);
      setPagination({ total: data?.total || 0, page: data?.page || 1, pages: data?.pages || 0 });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load activity logs');
      setLogs([]);
      setPagination({ total: 0, page: 1, pages: 0 });
    } finally {
      setLoading(false);
    }
  }, [canView, filters, toast]);

  useEffect(() => { load(); }, [load]);

  const items = useMemo(() => logs.map((row) => {
    const attendeeName = row?.attendee?.name || 'Someone';
    const eventTitle = row?.event?.title || 'an event';
    const type = row?.type;
    const status = row?.status;
    const time = formatDateTime(row?.activityAt || row?.updatedAt || row?.createdAt);

    const label = type === 'registration_cancelled' || status === 'cancelled'
      ? `${attendeeName} cancelled registration for ${eventTitle}`
      : `${attendeeName} registered for ${eventTitle}`;

    const badge = type === 'registration_cancelled' || status === 'cancelled'
      ? { text: 'CANCELLED', bg: 'rgba(239,68,68,0.10)', fg: '#ef4444', border: 'rgba(239,68,68,0.30)' }
      : { text: 'REGISTERED', bg: 'rgba(16,185,129,0.10)', fg: '#10b981', border: 'rgba(16,185,129,0.30)' };

    return {
      id: row?._id || `${attendeeName}-${eventTitle}-${time}`,
      label,
      time,
      badge,
      attendeeEmail: row?.attendee?.email || '',
      notes: row?.notes || '',
    };
  }), [logs]);

  const selectStyle = {
    padding: '8px 12px',
    borderRadius: 8,
    border: `1px solid ${theme.inputBorder}`,
    fontSize: 13,
    background: theme.inputBg,
    color: theme.text,
    cursor: 'pointer',
    outline: 'none',
    transition: 'all 0.3s',
    width: isMobile ? '100%' : 'auto',
  };

  if (!canView) {
    return (
      <div style={{ background: theme.surface, borderRadius: 12, padding: 22, border: `1px solid ${theme.border}` }}>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: theme.text }}>Activity Logs</h2>
        <p style={{ margin: '8px 0 0', fontSize: 13, color: theme.textMuted }}>
          You don’t have access to this page.
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: isMobile ? 20 : 22, fontWeight: 800, color: theme.text }}>Activity Logs</h2>
          <p style={{ margin: '2px 0 0', fontSize: 13, color: theme.textMuted }}>
            Latest registrations and cancellations • {pagination.total} record{pagination.total !== 1 ? 's' : ''}
          </p>
        </div>
        <select
          value={filters.limit}
          onChange={(e) => setFilters((f) => ({ ...f, limit: Number(e.target.value), page: 1 }))}
          style={selectStyle}
        >
          {[10, 20, 50, 100].map((n) => <option key={n} value={n}>{n} / page</option>)}
        </select>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : items.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '56px 0', color: theme.textFaint }}>
          <div style={{ fontSize: 44, marginBottom: 12 }}>Logs</div>
          <p style={{ fontSize: 15, margin: 0 }}>No activity yet</p>
          <p style={{ fontSize: 13, margin: '6px 0 0', color: theme.textMuted }}>Registrations will show up here as they happen.</p>
        </div>
      ) : (
        <div style={{ background: theme.surface, borderRadius: 12, border: `1px solid ${theme.border}`, overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '180px 1fr 240px', gap: 0, padding: '12px 14px', borderBottom: `1px solid ${theme.border}`, fontSize: 12.5, color: theme.textMuted, fontWeight: 700 }}>
            <div>Status</div>
            <div>Activity</div>
            {!isMobile && <div>Time</div>}
          </div>

          {items.map((item) => (
            <div key={item.id} style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '180px 1fr 240px', gap: 0, padding: '12px 14px', borderBottom: `1px solid ${theme.border}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '6px 10px',
                  borderRadius: 999,
                  fontSize: 11.5,
                  fontWeight: 800,
                  background: item.badge.bg,
                  color: item.badge.fg,
                  border: `1px solid ${item.badge.border}`,
                  whiteSpace: 'nowrap',
                }}>
                  {item.badge.text}
                </span>
              </div>

              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 13.5, fontWeight: 650, color: theme.text, lineHeight: 1.35 }}>
                  {item.label}
                </div>
                {(item.attendeeEmail || item.notes) && (
                  <div style={{ marginTop: 4, fontSize: 12.5, color: theme.textFaint, lineHeight: 1.35 }}>
                    {item.attendeeEmail && <span>{item.attendeeEmail}</span>}
                    {item.attendeeEmail && item.notes && <span> • </span>}
                    {item.notes && <span>Notes: {item.notes}</span>}
                  </div>
                )}
                {isMobile && (
                  <div style={{ marginTop: 6, fontSize: 12, color: theme.textMuted }}>
                    {item.time}
                  </div>
                )}
              </div>

              {!isMobile && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', fontSize: 12.5, color: theme.textMuted }}>
                  {item.time}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {pagination.pages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 6, flexWrap: 'wrap' }}>
          {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => setFilters((f) => ({ ...f, page: p }))}
              style={{
                width: 36,
                height: 36,
                borderRadius: 8,
                border: `1px solid ${theme.inputBorder}`,
                background: p === pagination.page ? '#6366f1' : theme.surface,
                color: p === pagination.page ? '#fff' : theme.textSecondary,
                fontWeight: 700,
                fontSize: 14,
                cursor: 'pointer',
                transition: 'all 0.3s',
              }}
            >
              {p}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

