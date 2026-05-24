import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useDarkMode } from '../context/DarkModeContext';
import { useToast } from '../context/ToastContext';
import { LoadingSpinner } from '../components/ProtectedRoute';
import useViewport from '../hooks/useViewport';
import { userService } from '../services/userService';

function formatDate(value) {
  const date = value ? new Date(value) : null;
  if (!date || Number.isNaN(date.valueOf())) return '—';
  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: '2-digit' });
}

export default function Users() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { theme } = useDarkMode();
  const { isMobile } = useViewport();

  const canView = user?.role === 'organiser' || user?.role === 'admin';
  const canManageAll = user?.role === 'admin';
  const canManageAttendees = user?.role === 'organiser';
  const canManage = canManageAll || canManageAttendees;

  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 0 });
  const [filters, setFilters] = useState({ role: '', search: '', page: 1, limit: 20, active: '' });

  const load = useCallback(async () => {
    if (!canView) return;
    setLoading(true);
    try {
      const params = { ...filters };
      if (!params.role) delete params.role;
      if (!params.search) delete params.search;
      if (params.active === '') delete params.active;
      const { data } = await userService.list(params);
      setRows(Array.isArray(data?.users) ? data.users : []);
      setPagination({ total: data?.total || 0, page: data?.page || 1, pages: data?.pages || 0 });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load users');
      setRows([]);
      setPagination({ total: 0, page: 1, pages: 0 });
    } finally {
      setLoading(false);
    }
  }, [canView, filters, toast]);

  useEffect(() => { load(); }, [load]);

  const items = useMemo(() => rows.map((u) => {
    const role = u?.role || '—';
    const id = u?._id;
    const isSelf = Boolean(id && user?.id && String(id) === String(user.id));
    const isActive = u?.isActive !== false;
    const canToggle = !isSelf && (canManageAll || (canManageAttendees && role === 'attendee'));

    return {
      id,
      name: u?.name || '—',
      email: u?.email || '—',
      role,
      isActive,
      createdAt: formatDate(u?.createdAt),
      canToggle,
      isSelf,
    };
  }), [rows, user?.id, canManageAll, canManageAttendees]);

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

  const handleToggleActive = async (id, nextActive) => {
    try {
      await userService.setActive(id, nextActive);
      toast.success(nextActive ? 'User activated' : 'User deactivated');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update user');
    }
  };

  if (!canView) {
    return (
      <div style={{ background: theme.surface, borderRadius: 12, padding: 22, border: `1px solid ${theme.border}` }}>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: theme.text }}>Users</h2>
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
          <h2 style={{ margin: 0, fontSize: isMobile ? 20 : 22, fontWeight: 800, color: theme.text }}>Users</h2>
          <p style={{ margin: '2px 0 0', fontSize: 13, color: theme.textMuted }}>
            {pagination.total} user{pagination.total !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 200px 180px 180px', gap: 10 }}>
        <input
          type="text"
          placeholder="Search name/email..."
          value={filters.search}
          onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value, page: 1 }))}
          style={{ ...selectStyle, cursor: 'text' }}
        />
        <select value={filters.role} onChange={(e) => setFilters((f) => ({ ...f, role: e.target.value, page: 1 }))} style={selectStyle}>
          <option value="">All roles</option>
          <option value="organiser">Organiser</option>
          <option value="attendee">Attendee</option>
        </select>
        <select value={filters.active} onChange={(e) => setFilters((f) => ({ ...f, active: e.target.value, page: 1 }))} style={selectStyle}>
          <option value="">All statuses</option>
          <option value="true">Active</option>
          <option value="false">Deactivated</option>
        </select>
        <select value={filters.limit} onChange={(e) => setFilters((f) => ({ ...f, limit: Number(e.target.value), page: 1 }))} style={selectStyle}>
          {[10, 20, 50, 100].map((n) => <option key={n} value={n}>{n} / page</option>)}
        </select>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : items.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '56px 0', color: theme.textFaint }}>
          <div style={{ fontSize: 44, marginBottom: 12 }}>Users</div>
          <p style={{ fontSize: 15, margin: 0 }}>No users found</p>
        </div>
      ) : (
        <div style={{ background: theme.surface, borderRadius: 12, border: `1px solid ${theme.border}`, overflow: 'hidden' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : canManage ? '1.3fr 1.4fr 160px 130px 140px' : '1.3fr 1.4fr 160px 130px',
            gap: 0,
            padding: '12px 14px',
            borderBottom: `1px solid ${theme.border}`,
            fontSize: 12.5,
            color: theme.textMuted,
            fontWeight: 700,
          }}
          >
            <div>Name</div>
            <div>Email</div>
            <div>Role</div>
            <div>Status</div>
            {canManage && !isMobile && <div style={{ textAlign: 'right' }}>Action</div>}
          </div>

          {items.map((item) => (
            <div
              key={item.id}
              style={{
                display: 'grid',
                gridTemplateColumns: isMobile ? '1fr' : canManage ? '1.3fr 1.4fr 160px 130px 140px' : '1.3fr 1.4fr 160px 130px',
                gap: 0,
                padding: '12px 14px',
                borderBottom: `1px solid ${theme.border}`,
              }}
            >
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 13.5, fontWeight: 700, color: theme.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={item.name}>
                  {item.name}
                </div>
                {isMobile && <div style={{ marginTop: 3, fontSize: 12, color: theme.textFaint }}>Joined {item.createdAt}</div>}
              </div>
              <div style={{ minWidth: 0, display: 'flex', alignItems: 'center', color: theme.textMuted, fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={item.email}>
                {item.email}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', textTransform: 'capitalize', color: theme.textMuted, fontSize: 13 }}>
                {item.role}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '6px 10px',
                  borderRadius: 999,
                  fontSize: 11.5,
                  fontWeight: 800,
                  background: item.isActive ? 'rgba(16,185,129,0.10)' : 'rgba(239,68,68,0.10)',
                  color: item.isActive ? '#10b981' : '#ef4444',
                  border: `1px solid ${item.isActive ? 'rgba(16,185,129,0.30)' : 'rgba(239,68,68,0.30)'}`,
                  whiteSpace: 'nowrap',
                }}>
                  {item.isActive ? 'ACTIVE' : 'DEACTIVATED'}
                </span>
                {!isMobile && <span style={{ fontSize: 12, color: theme.textFaint }}>Joined {item.createdAt}</span>}
              </div>
              {canManage && (canManageAll || item.canToggle) && (
                <div style={{ display: 'flex', justifyContent: isMobile ? 'flex-start' : 'flex-end', marginTop: isMobile ? 10 : 0 }}>
                  <button
                    onClick={() => handleToggleActive(item.id, !item.isActive)}
                    disabled={!item.canToggle}
                    style={{
                      padding: '8px 12px',
                      borderRadius: 8,
                      border: `1px solid ${theme.inputBorder}`,
                      background: theme.surface,
                      color: theme.text,
                      fontWeight: 700,
                      fontSize: 12.5,
                      cursor: item.canToggle ? 'pointer' : 'not-allowed',
                      opacity: item.canToggle ? 1 : 0.55,
                    }}
                  >
                    {item.isActive ? 'Deactivate' : 'Activate'}
                  </button>
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
