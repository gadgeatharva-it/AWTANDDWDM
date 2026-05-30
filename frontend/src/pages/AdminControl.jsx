import { useCallback, useEffect, useMemo, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useDarkMode } from '../context/DarkModeContext';
import { useToast } from '../context/ToastContext';
import { LoadingSpinner } from '../components/ProtectedRoute';
import EventModal from '../components/EventModal';
import EventDetailsModal from '../components/EventDetailsModal';
import EventCard from '../components/EventCard';
import useViewport from '../hooks/useViewport';
import { useEventDetailsModal } from '../hooks/useEventDetailsModal';
import useDebouncedValue from '../hooks/useDebouncedValue';
import { eventService } from '../services/eventService';
import { userService } from '../services/userService';

const eventSorts = [
  { value: '-createdAt', label: 'Newest' },
  { value: 'startDate', label: 'Start date up' },
  { value: '-startDate', label: 'Start date down' },
  { value: '-registeredCount', label: 'Popular' },
];

function Stat({ label, value, color, theme }) {
  return (
    <div style={{ background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: 10, padding: 16, borderLeft: `4px solid ${color}` }}>
      <div style={{ fontSize: 12, color: theme.textMuted, fontWeight: 800, marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 24, color: theme.text, fontWeight: 900 }}>{value}</div>
    </div>
  );
}

export default function AdminControl() {
  const { user } = useAuth();
  const { theme } = useDarkMode();
  const { toast } = useToast();
  const { isMobile, isTablet } = useViewport();
  const detailsModal = useEventDetailsModal();

  const [loading, setLoading] = useState(false);
  const [events, setEvents] = useState([]);
  const [users, setUsers] = useState([]);
  const [eventPagination, setEventPagination] = useState({ total: 0, page: 1, pages: 0 });
  const [userPagination, setUserPagination] = useState({ total: 0, page: 1, pages: 0 });
  const [eventFilters, setEventFilters] = useState({ search: '', status: '', category: '', sort: '-createdAt', page: 1, limit: 9 });
  const [userFilters, setUserFilters] = useState({ search: '', role: '', active: '', page: 1, limit: 10 });
  const debouncedEventFilters = useDebouncedValue(eventFilters, 350);
  const debouncedUserFilters = useDebouncedValue(userFilters, 350);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);

  const isAdmin = user?.role === 'admin';

  const inputStyle = {
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

  const load = useCallback(async () => {
    if (!isAdmin) return;
    setLoading(true);
    try {
      const cleanEventFilters = { ...debouncedEventFilters };
      Object.keys(cleanEventFilters).forEach((key) => {
        if (cleanEventFilters[key] === '') delete cleanEventFilters[key];
      });
      const cleanUserFilters = { ...debouncedUserFilters };
      Object.keys(cleanUserFilters).forEach((key) => {
        if (cleanUserFilters[key] === '') delete cleanUserFilters[key];
      });

      const [eventsRes, usersRes] = await Promise.all([
        eventService.getAll(cleanEventFilters),
        userService.list(cleanUserFilters),
      ]);

      setEvents(Array.isArray(eventsRes.data?.events) ? eventsRes.data.events : []);
      setEventPagination({
        total: eventsRes.data?.total || 0,
        page: eventsRes.data?.page || 1,
        pages: eventsRes.data?.pages || 0,
      });
      setUsers(Array.isArray(usersRes.data?.users) ? usersRes.data.users : []);
      setUserPagination({
        total: usersRes.data?.total || 0,
        page: usersRes.data?.page || 1,
        pages: usersRes.data?.pages || 0,
      });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load admin data');
    } finally {
      setLoading(false);
    }
  }, [debouncedEventFilters, debouncedUserFilters, isAdmin, toast]);

  useEffect(() => { load(); }, [load]);

  const stats = useMemo(() => ({
    events: eventPagination.total,
    users: userPagination.total,
    activeUsers: users.filter((row) => row.isActive !== false).length,
    visibleEvents: events.length,
  }), [eventPagination.total, events.length, userPagination.total, users]);

  const saveEvent = async (data) => {
    try {
      if (editingEvent) {
        await eventService.update(editingEvent._id, data);
        toast.success('Event updated');
      } else {
        await eventService.create(data);
        toast.success('Event created');
      }
      setModalOpen(false);
      setEditingEvent(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save event');
    }
  };

  const deleteEvent = async (eventId) => {
    if (!window.confirm('Delete this event and its registrations?')) return;
    try {
      await eventService.remove(eventId);
      toast.success('Event deleted');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete event');
    }
  };

  const toggleUser = async (targetUser) => {
    const nextActive = targetUser.isActive === false;
    try {
      await userService.setActive(targetUser._id, nextActive);
      toast.success(nextActive ? 'User activated' : 'User deactivated');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update user');
    }
  };

  if (!isAdmin) return <Navigate to="/app/dashboard" replace />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <div>
          <h2 style={{ margin: 0, color: theme.text, fontSize: isMobile ? 20 : 22, fontWeight: 900 }}>Admin Control</h2>
          <p style={{ margin: '3px 0 0', color: theme.textMuted, fontSize: 13 }}>Manage users and events from one protected page.</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: `repeat(auto-fit, minmax(${isMobile ? 150 : 180}px, 1fr))`, gap: 12 }}>
        <Stat label="Total Events" value={stats.events} color="#6366f1" theme={theme} />
        <Stat label="Visible Events" value={stats.visibleEvents} color="#06b6d4" theme={theme} />
        <Stat label="Total Users" value={stats.users} color="#10b981" theme={theme} />
        <Stat label="Active Users On Page" value={stats.activeUsers} color="#f59e0b" theme={theme} />
      </div>

      <section style={{ background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: 12, padding: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', flexWrap: 'wrap', marginBottom: 12 }}>
          <h3 style={{ margin: 0, color: theme.text, fontSize: 16 }}>Users</h3>
          <div style={{ color: theme.textMuted, fontSize: 13 }}>{userPagination.total} users</div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 170px 170px', gap: 10, marginBottom: 12 }}>
          <input placeholder="Search name, email, role, status..." value={userFilters.search} onChange={(e) => setUserFilters((f) => ({ ...f, search: e.target.value, page: 1 }))} style={inputStyle} />
          <select value={userFilters.role} onChange={(e) => setUserFilters((f) => ({ ...f, role: e.target.value, page: 1 }))} style={inputStyle}>
            <option value="">All roles</option>
            <option value="admin">Admin</option>
            <option value="organiser">Organiser</option>
            <option value="attendee">Attendee</option>
          </select>
          <select value={userFilters.active} onChange={(e) => setUserFilters((f) => ({ ...f, active: e.target.value, page: 1 }))} style={inputStyle}>
            <option value="">All statuses</option>
            <option value="true">Active</option>
            <option value="false">Deactivated</option>
          </select>
        </div>
        {loading && users.length === 0 ? <LoadingSpinner /> : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {users.map((row) => {
              const isSelf = String(row._id) === String(user.id);
              return (
                <div key={row._id} style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1.2fr 1.5fr 120px 120px 120px', gap: 10, alignItems: 'center', padding: '10px 12px', borderRadius: 10, border: `1px solid ${theme.border}`, background: theme.inputBg }}>
                  <div style={{ minWidth: 0, color: theme.text, fontWeight: 800, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.name}</div>
                  <div style={{ minWidth: 0, color: theme.textMuted, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.email}</div>
                  <div style={{ color: theme.textMuted, fontSize: 13, textTransform: 'capitalize' }}>{row.role}</div>
                  <div style={{ color: row.isActive === false ? '#ef4444' : '#10b981', fontSize: 12, fontWeight: 900 }}>{row.isActive === false ? 'DEACTIVATED' : 'ACTIVE'}</div>
                  <button disabled={isSelf || row.role === 'admin'} onClick={() => toggleUser(row)} style={{ padding: '8px 10px', borderRadius: 8, border: `1px solid ${theme.inputBorder}`, background: theme.surface, color: theme.text, fontWeight: 800, opacity: isSelf || row.role === 'admin' ? 0.55 : 1, cursor: isSelf || row.role === 'admin' ? 'not-allowed' : 'pointer' }}>
                    {row.isActive === false ? 'Activate' : 'Deactivate'}
                  </button>
                </div>
              );
            })}
            {users.length === 0 && <div style={{ color: theme.textMuted, padding: 20, textAlign: 'center' }}>No users found</div>}
          </div>
        )}
      </section>

      <section style={{ background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: 12, padding: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', flexWrap: 'wrap', marginBottom: 12 }}>
          <h3 style={{ margin: 0, color: theme.text, fontSize: 16 }}>Events</h3>
          <div style={{ color: theme.textMuted, fontSize: 13 }}>{eventPagination.total} events</div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 150px 150px 150px', gap: 10, marginBottom: 14 }}>
          <input placeholder="Search title, location, city, tag, month..." value={eventFilters.search} onChange={(e) => setEventFilters((f) => ({ ...f, search: e.target.value, page: 1 }))} style={inputStyle} />
          <select value={eventFilters.status} onChange={(e) => setEventFilters((f) => ({ ...f, status: e.target.value, page: 1 }))} style={inputStyle}>
            <option value="">All statuses</option>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="cancelled">Cancelled</option>
            <option value="completed">Completed</option>
          </select>
          <select value={eventFilters.category} onChange={(e) => setEventFilters((f) => ({ ...f, category: e.target.value, page: 1 }))} style={inputStyle}>
            <option value="">All categories</option>
            <option value="conference">Conference</option>
            <option value="workshop">Workshop</option>
            <option value="webinar">Webinar</option>
            <option value="meetup">Meetup</option>
            <option value="other">Other</option>
          </select>
          <select value={eventFilters.sort} onChange={(e) => setEventFilters((f) => ({ ...f, sort: e.target.value, page: 1 }))} style={inputStyle}>
            {eventSorts.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
          </select>
        </div>
        {loading && events.length === 0 ? <LoadingSpinner /> : (
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(auto-fill, minmax(${isMobile ? 240 : isTablet ? 260 : 300}px, 1fr))`, gap: 14 }}>
            {events.map((event) => (
              <EventCard key={event._id} event={{ ...event, onClick: detailsModal.openForEvent }} onEdit={(e) => { setEditingEvent(e); setModalOpen(true); }} onDelete={deleteEvent} />
            ))}
            {events.length === 0 && <div style={{ color: theme.textMuted, padding: 20 }}>No events found</div>}
          </div>
        )}
      </section>

      {modalOpen && (
        <EventModal event={editingEvent} onSave={saveEvent} onClose={() => { setModalOpen(false); setEditingEvent(null); }} />
      )}

      <EventDetailsModal {...detailsModal.modalProps} onEdit={(e) => { detailsModal.close(); setEditingEvent(e); setModalOpen(true); }} onDelete={(id) => { detailsModal.close(); deleteEvent(id); }} />
    </div>
  );
}
