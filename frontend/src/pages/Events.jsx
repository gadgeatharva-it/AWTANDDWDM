import { useEffect, useState, useCallback } from 'react';
import { useEvents } from '../context/EventContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useDarkMode } from '../context/DarkModeContext';
import EventCard from '../components/EventCard';
import EventModal from '../components/EventModal';
import EventDetailsModal from '../components/EventDetailsModal';
import { LoadingSpinner } from '../components/ProtectedRoute';
import useViewport from '../hooks/useViewport';
import { useEventDetailsModal } from '../hooks/useEventDetailsModal';
import useDebouncedValue from '../hooks/useDebouncedValue';

const CATEGORIES = ['', 'conference', 'workshop', 'webinar', 'meetup', 'concert', 'sports', 'other'];
const STATUSES = ['', 'draft', 'published', 'cancelled', 'completed'];
const PRICE_TYPES = [
  { value: '', label: 'All prices' },
  { value: 'free', label: 'Free' },
  { value: 'paid', label: 'Paid' },
];
const SORTS = [
  { value: '-createdAt', label: 'Newest first' },
  { value: 'createdAt', label: 'Oldest first' },
  { value: 'startDate', label: 'Start date up' },
  { value: '-startDate', label: 'Start date down' },
  { value: '-registeredCount', label: 'Most popular' },
];

export default function Events() {
  const {
    events,
    myRegistrations,
    loading,
    pagination,
    fetchEvents,
    createEvent,
    updateEvent,
    deleteEvent,
    fetchMyRegistrations,
    registerForEvent,
    cancelEventRegistration,
  } = useEvents();
  const { user } = useAuth();
  const { toast } = useToast();
  const { theme } = useDarkMode();
  const { isMobile, isTablet } = useViewport();

  const [filters, setFilters] = useState({ search: '', category: '', status: '', priceType: '', sort: '-createdAt', page: 1 });
  const debouncedFilters = useDebouncedValue(filters, 350);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const detailsModal = useEventDetailsModal();

  const canCreate = user?.role === 'organiser' || user?.role === 'admin';

  const pageLimit = isMobile ? 10 : isTablet ? 10 : 12;

  const load = useCallback(() => {
    const params = {};
    if (debouncedFilters.search) params.search = debouncedFilters.search;
    if (debouncedFilters.category) params.category = debouncedFilters.category;
    if (debouncedFilters.status) params.status = debouncedFilters.status;
    if (debouncedFilters.priceType) params.priceType = debouncedFilters.priceType;
    params.sort = debouncedFilters.sort;
    params.page = debouncedFilters.page;
    params.limit = pageLimit;
    fetchEvents(params);
  }, [debouncedFilters, fetchEvents, pageLimit]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    if (user?.role === 'attendee') fetchMyRegistrations();
  }, [fetchMyRegistrations, user?.role]);

  useEffect(() => {
    setFilters((f) => ({ ...f, page: 1 }));
  }, [pageLimit]);

  const handleFilterChange = (key, value) => setFilters((f) => ({ ...f, [key]: value, page: 1 }));

  const handleSave = async (data) => {
    try {
      if (editingEvent) {
        await updateEvent(editingEvent._id, data);
        toast.success('Event updated!');
      } else {
        await createEvent(data);
        toast.success('Event created!');
      }
      setModalOpen(false);
      setEditingEvent(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save event');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this event? This cannot be undone.')) return;
    try {
      await deleteEvent(id);
      toast.success('Event deleted');
    } catch (err) {
      toast.error('Failed to delete event');
    }
  };

  const handleEdit = (event) => { setEditingEvent(event); setModalOpen(true); };
  const handleCardClick = (event) => detailsModal.openForEvent(event);
  const registeredIds = new Set(myRegistrations.map((registration) => registration.event?._id));
  const canManageSelectedEvent = Boolean(
    user
    && detailsModal.event
    && (user.role === 'admin' || user.id === detailsModal.event.organiser?._id),
  );

  const handleRegister = async (event) => {
    try {
      await registerForEvent(event._id);
      toast.success(`Registered for ${event.title}`);
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to register');
    }
  };

  const handleCancelRegistration = async (event) => {
    if (!window.confirm(`Cancel your registration for "${event.title}"?`)) return;
    try {
      await cancelEventRegistration(event._id);
      toast.success(`Registration cancelled for ${event.title}`);
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to cancel registration');
    }
  };

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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: isMobile ? 20 : 22, fontWeight: 700, color: theme.text }}>Events</h2>
          <p style={{ margin: '2px 0 0', fontSize: 13, color: theme.textMuted }}>{pagination.total} event{pagination.total !== 1 ? 's' : ''} found</p>
        </div>
        {canCreate && (
          <button onClick={() => { setEditingEvent(null); setModalOpen(true); }} style={{
            width: isMobile ? '100%' : 'auto',
            padding: '10px 20px', borderRadius: 8, border: 'none',
            background: '#6366f1', color: '#fff', fontWeight: 600, fontSize: 14, cursor: 'pointer',
          }}>
            + Create Event
          </button>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10 }}>
        <input
          type="text"
          placeholder="Search name, location, city, tag, month..."
          value={filters.search}
          onChange={(e) => handleFilterChange('search', e.target.value)}
          style={{ ...selectStyle, cursor: 'text' }}
        />
        <select value={filters.category} onChange={(e) => handleFilterChange('category', e.target.value)} style={selectStyle}>
          {CATEGORIES.map((c) => <option key={c} value={c}>{c || 'All categories'}</option>)}
        </select>
        <select value={filters.status} onChange={(e) => handleFilterChange('status', e.target.value)} style={selectStyle}>
          {STATUSES.map((s) => <option key={s} value={s}>{s || 'All statuses'}</option>)}
        </select>
        <select value={filters.sort} onChange={(e) => handleFilterChange('sort', e.target.value)} style={selectStyle}>
          {SORTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
        <select value={filters.priceType} onChange={(e) => handleFilterChange('priceType', e.target.value)} style={selectStyle}>
          {PRICE_TYPES.map((p) => <option key={p.value || 'all'} value={p.value}>{p.label}</option>)}
        </select>
      </div>

      {loading && events.length === 0 ? (
        <LoadingSpinner />
      ) : events.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: theme.textFaint }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>Events</div>
          <p style={{ fontSize: 16 }}>No events found</p>
          {canCreate && <p style={{ fontSize: 13 }}>Create your first event to get started!</p>}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(auto-fill, minmax(${isMobile ? 240 : isTablet ? 260 : 300}px, 1fr))`, gap: 16 }}>
          {events.map((event) => (
            <EventCard
              key={event._id}
              event={{
                ...event,
                isRegistered: registeredIds.has(event._id),
                onRegister: handleRegister,
                onCancelRegistration: handleCancelRegistration,
                onClick: handleCardClick,
              }}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {pagination.pages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
          {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((p) => (
            <button key={p} onClick={() => setFilters((f) => ({ ...f, page: p }))} style={{
              width: 36, height: 36, borderRadius: 8, border: `1px solid ${theme.inputBorder}`,
              background: p === filters.page ? '#6366f1' : theme.surface,
              color: p === filters.page ? '#fff' : theme.textSecondary,
              fontWeight: 600, fontSize: 14, cursor: 'pointer', transition: 'all 0.3s',
            }}>{p}</button>
          ))}
        </div>
      )}

      {modalOpen && (
        <EventModal
          event={editingEvent}
          onSave={handleSave}
          onClose={() => { setModalOpen(false); setEditingEvent(null); }}
        />
      )}

      <EventDetailsModal
        {...detailsModal.modalProps}
        onEdit={canManageSelectedEvent ? (e) => { detailsModal.close(); handleEdit(e); } : undefined}
        onDelete={canManageSelectedEvent ? (id) => { detailsModal.close(); handleDelete(id); } : undefined}
        onShare={(e) => {
          const url = `${window.location.origin}/app/events`;
          const text = `${e.title} • ${new Date(e.startDate).toLocaleDateString()} • ${e.location || 'Online'}\n${url}`;
          navigator.clipboard?.writeText?.(text);
          toast.success('Copied event info');
        }}
      />
    </div>
  );
}
