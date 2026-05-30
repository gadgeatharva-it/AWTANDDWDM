import { useCallback, useEffect, useMemo, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useDarkMode } from '../context/DarkModeContext';
import { useToast } from '../context/ToastContext';
import { LoadingSpinner } from '../components/ProtectedRoute';
import useDebouncedValue from '../hooks/useDebouncedValue';
import useViewport from '../hooks/useViewport';
import { eventService } from '../services/eventService';

function formatDate(value) {
  const date = value ? new Date(value) : null;
  if (!date || Number.isNaN(date.valueOf())) return '-';
  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: '2-digit' });
}

export default function MyAttendees() {
  const { user } = useAuth();
  const { theme } = useDarkMode();
  const { toast } = useToast();
  const { isMobile } = useViewport();

  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 0 });
  const [filters, setFilters] = useState({ search: '', page: 1, limit: 20 });
  const debouncedFilters = useDebouncedValue(filters, 350);

  const isOrganiser = user?.role === 'organiser';

  const load = useCallback(async () => {
    if (!isOrganiser) return;
    setLoading(true);
    try {
      const params = { ...debouncedFilters };
      if (!params.search) delete params.search;
      const { data } = await eventService.getMyAttendees(params);
      setRows(Array.isArray(data?.attendees) ? data.attendees : []);
      setPagination({ total: data?.total || 0, page: data?.page || 1, pages: data?.pages || 0 });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load attendees');
      setRows([]);
      setPagination({ total: 0, page: 1, pages: 0 });
    } finally {
      setLoading(false);
    }
  }, [debouncedFilters, isOrganiser, toast]);

  useEffect(() => { load(); }, [load]);

  const attendees = useMemo(() => rows.map((row) => ({
    id: row._id,
    name: row.name || '-',
    email: row.email || '-',
    registrations: row.registrations || 0,
    lastRegisteredAt: formatDate(row.lastRegisteredAt),
  })), [rows]);

  if (!isOrganiser) return <Navigate to="/app/dashboard" replace />;

  const fieldStyle = {
    padding: '9px 12px',
    borderRadius: 8,
    border: `1px solid ${theme.inputBorder}`,
    background: theme.inputBg,
    color: theme.text,
    fontSize: 13,
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: isMobile ? 20 : 22, fontWeight: 900, color: theme.text }}>My Attendees</h2>
          <p style={{ margin: '3px 0 0', color: theme.textMuted, fontSize: 13 }}>
            {pagination.total} attendee{pagination.total !== 1 ? 's' : ''} registered across your events
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 160px', gap: 10 }}>
        <input
          placeholder="Search attendee name or email..."
          value={filters.search}
          onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value, page: 1 }))}
          style={fieldStyle}
        />
        <select
          value={filters.limit}
          onChange={(e) => setFilters((f) => ({ ...f, limit: Number(e.target.value), page: 1 }))}
          style={fieldStyle}
        >
          {[10, 20, 50, 100].map((n) => <option key={n} value={n}>{n} / page</option>)}
        </select>
      </div>

      {loading && attendees.length === 0 ? (
        <LoadingSpinner />
      ) : attendees.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '56px 0', color: theme.textFaint }}>
          <div style={{ fontSize: 38, marginBottom: 12 }}>Attendees</div>
          <p style={{ fontSize: 15, margin: 0 }}>No attendees found</p>
        </div>
      ) : (
        <div style={{ background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: 12, overflow: 'hidden' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : '1.2fr 1.4fr 140px 160px',
            padding: '12px 14px',
            borderBottom: `1px solid ${theme.border}`,
            color: theme.textMuted,
            fontSize: 12.5,
            fontWeight: 800,
          }}>
            <div>Name</div>
            {!isMobile && <div>Email</div>}
            {!isMobile && <div>Registrations</div>}
            {!isMobile && <div>Last Registered</div>}
          </div>

          {attendees.map((attendee) => (
            <div
              key={attendee.id}
              style={{
                display: 'grid',
                gridTemplateColumns: isMobile ? '1fr' : '1.2fr 1.4fr 140px 160px',
                padding: '12px 14px',
                borderBottom: `1px solid ${theme.border}`,
                color: theme.text,
                fontSize: 13.5,
                gap: isMobile ? 4 : 0,
              }}
            >
              <div style={{ fontWeight: 800, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{attendee.name}</div>
              <div style={{ color: theme.textMuted, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{attendee.email}</div>
              <div style={{ color: theme.textMuted }}>{attendee.registrations}</div>
              <div style={{ color: theme.textMuted }}>{attendee.lastRegisteredAt}</div>
            </div>
          ))}
        </div>
      )}

      {pagination.pages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, flexWrap: 'wrap' }}>
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
                fontWeight: 800,
                cursor: 'pointer',
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
