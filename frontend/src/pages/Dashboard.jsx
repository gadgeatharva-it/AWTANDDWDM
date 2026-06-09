import { useEffect, useMemo, useState } from 'react';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend,
  LineChart, Line, CartesianGrid,
} from 'recharts';
import { useEvents } from '../context/EventContext';
import { useAuth } from '../context/AuthContext';
import { useDarkMode } from '../context/DarkModeContext';
import { useToast } from '../context/ToastContext';
import EventCard from '../components/EventCard';
import useViewport from '../hooks/useViewport';
import EventDetailsModal from '../components/EventDetailsModal';
import { useEventDetailsModal } from '../hooks/useEventDetailsModal';

const COLORS = ['#6366f1', '#f59e0b', '#10b981', '#ec4899', '#06b6d4', '#f97316', '#8b5cf6'];
const MONTHS = [
  { value: '', label: 'All months' },
  { value: '1', label: 'Jan' },
  { value: '2', label: 'Feb' },
  { value: '3', label: 'Mar' },
  { value: '4', label: 'Apr' },
  { value: '5', label: 'May' },
  { value: '6', label: 'Jun' },
  { value: '7', label: 'Jul' },
  { value: '8', label: 'Aug' },
  { value: '9', label: 'Sep' },
  { value: '10', label: 'Oct' },
  { value: '11', label: 'Nov' },
  { value: '12', label: 'Dec' },
];
const CATEGORIES = ['', 'conference', 'workshop', 'webinar', 'meetup', 'concert', 'sports', 'other'];
const STATUSES = ['', 'draft', 'published', 'cancelled', 'completed'];
const DEFAULT_STATS = {
  overview: { totalEvents: 0, totalRegistrations: 0, totalRevenue: 0, avgCapacityUsed: 0 },
  byCategory: [],
  byStatus: [],
  byMonth: [],
  topEvents: [],
  drilldown: { level: 'month', rows: [] },
  pivot: [],
  trends: [],
  clusters: [],
  olap: { slice: '', dice: '', drill: '' },
  meta: { years: [] },
};

const QUOTES = [
  'Every great event starts with a great plan.',
  'Create experiences people remember for a lifetime.',
  'The best events bring people together.',
];

function StatCard({ label, value, color, theme, isMobile }) {
  return (
    <div style={{
      background: theme.surface, borderRadius: 12, padding: isMobile ? '18px 16px' : '20px 24px',
      border: `1px solid ${theme.border}`, boxShadow: theme.cardShadow,
      borderLeft: `4px solid ${color}`, transition: 'all 0.3s',
    }}>
      <div style={{ fontSize: 13, color: theme.textMuted, marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: isMobile ? 24 : 28, fontWeight: 700, color: theme.text, wordBreak: 'break-word' }}>{value}</div>
    </div>
  );
}

function Panel({ title, theme, children, subtitle }) {
  return (
    <div style={{ background: theme.surface, borderRadius: 12, padding: 20, border: `1px solid ${theme.border}`, transition: 'all 0.3s' }}>
      <div style={{ marginBottom: 16 }}>
        <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: theme.text }}>{title}</h3>
        {subtitle && <p style={{ margin: '6px 0 0', fontSize: 13, color: theme.textMuted }}>{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

export default function Dashboard() {
  const {
    stats,
    events,
    myRegistrations,
    recommendations,
    recommendationsMeta,
    recommendationsLoading,
    loading,
    fetchStats,
    fetchEvents,
    fetchMyRegistrations,
    fetchRecommendations,
    registerForEvent,
    cancelEventRegistration,
  } = useEvents();
  const { user } = useAuth();
  const { toast } = useToast();
  const { theme } = useDarkMode();
  const { isMobile, isTablet } = useViewport();
  const detailsModal = useEventDetailsModal();
  const showAdvancedAnalytics = user?.role !== 'attendee';
  const isAttendee = user?.role === 'attendee';
  const isOrganiser = user?.role === 'organiser';
  const quote = QUOTES[new Date().getDay() % QUOTES.length];
  const [filters, setFilters] = useState({ year: '', month: '', category: '', status: '', drill: 'month' });
  const firstName = user?.name?.split(' ')?.[0] || user?.name || '';

  useEffect(() => {
    fetchStats(filters);
  }, [fetchStats, filters]);

  useEffect(() => {
    if (user?.role) fetchEvents({ sort: '-createdAt', limit: 6 });
  }, [fetchEvents, user?.role]);

  useEffect(() => {
    if (user?.role === 'attendee') fetchMyRegistrations();
  }, [fetchMyRegistrations, user?.role]);

  useEffect(() => {
    if (user?.role === 'attendee') fetchRecommendations({ limit: 6 });
  }, [fetchRecommendations, user?.role]);

  const currentStats = stats || DEFAULT_STATS;
  const { overview, byCategory, byStatus, byMonth, drilldown, pivot, trends, clusters, olap, meta } = currentStats;
  const registeredIds = new Set(myRegistrations.map((registration) => registration.event?._id));

  const monthData = byMonth.map((m) => ({
    name: `${m._id.month}/${String(m._id.year).slice(-2)}`,
    Events: m.count,
    Registrations: m.registrations,
  }));

  const categoryData = byCategory.map((c) => ({ name: c._id, value: c.count }));
  const pivotData = pivot.map((row) => ({ name: row.category, Revenue: row.revenue, Registrations: row.registrations }));
  const drillData = drilldown.rows.map((row) => ({ name: row.label, Events: row.count, Revenue: row.revenue, Registrations: row.registrations }));
  const trendData = trends.map((row) => ({
    name: row.label,
    Events: row.eventsCreated,
    Registrations: row.registrations,
    Revenue: row.revenue,
  }));

  const availableYears = useMemo(() => (meta?.years || []).map((year) => String(year)), [meta]);
  const analyticsSubtitle = isOrganiser
    ? 'Slice, dice, drill-down, and pivot controls for your events'
    : 'Slice, dice, drill-down, and pivot controls for the dashboard cube';
  const recentEventsSubtitle = isOrganiser
    ? 'Latest events created by you'
    : 'Latest events visible to all users and organisers';
  const recommendationsSubtitle = recommendationsMeta.personalized
    ? `Based on your ${recommendationsMeta.historySize} confirmed registration${recommendationsMeta.historySize === 1 ? '' : 's'}`
    : 'Trending upcoming events to help you get started';

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
      ...(key === 'year' && !value ? { month: '' } : {}),
    }));
  };

  const handleRegister = async (event) => {
    try {
      await registerForEvent(event);
      toast.success(`Registered for ${event.title}`);
      fetchStats(filters);
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to register');
    }
  };

  const handleCancelRegistration = async (event) => {
    if (!window.confirm(`Cancel your registration for "${event.title}"?`)) return;
    try {
      await cancelEventRegistration(event._id);
      toast.success(`Registration cancelled for ${event.title}`);
      fetchStats(filters);
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to cancel registration');
    }
  };

  const filterFieldStyle = {
    padding: '8px 12px',
    borderRadius: 8,
    border: `1px solid ${theme.inputBorder}`,
    fontSize: 13,
    background: theme.inputBg,
    color: theme.text,
    outline: 'none',
    width: '100%',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)', borderRadius: 14, padding: isMobile ? '18px 16px' : '22px 28px', color: '#fff' }}>
        <h2 style={{ margin: 0, fontSize: isMobile ? 18 : 20, fontWeight: 700 }}>
          Welcome, {firstName} 👋
        </h2>
        <p style={{ margin: '6px 0 0', opacity: 0.85, fontSize: 14 }}>"{quote}"</p>
      </div>

      {showAdvancedAnalytics && (
        <Panel title="OLAP Filters" theme={theme} subtitle={analyticsSubtitle}>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
            <select value={filters.year} onChange={(e) => handleFilterChange('year', e.target.value)} style={filterFieldStyle}>
              <option value="">All years</option>
              {availableYears.map((year) => <option key={year} value={year}>{year}</option>)}
            </select>
            <select value={filters.month} onChange={(e) => handleFilterChange('month', e.target.value)} style={filterFieldStyle} disabled={!filters.year}>
              {MONTHS.map((month) => <option key={month.value || 'all'} value={month.value}>{month.label}</option>)}
            </select>
            <select value={filters.category} onChange={(e) => handleFilterChange('category', e.target.value)} style={filterFieldStyle}>
              {CATEGORIES.map((category) => <option key={category || 'all'} value={category}>{category || 'All categories'}</option>)}
            </select>
            <select value={filters.status} onChange={(e) => handleFilterChange('status', e.target.value)} style={filterFieldStyle}>
              {STATUSES.map((status) => <option key={status || 'all'} value={status}>{status || 'All statuses'}</option>)}
            </select>
            <select value={filters.drill} onChange={(e) => handleFilterChange('drill', e.target.value)} style={filterFieldStyle}>
              <option value="year">Drill: Year</option>
              <option value="month">Drill: Month</option>
              <option value="day">Drill: Day</option>
            </select>
          </div>

          {Boolean(olap.slice || olap.dice || olap.drill) && (
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(220px, 1fr))', gap: 10, marginTop: 14 }}>
              {[
                { key: 'slice', value: olap.slice },
                { key: 'dice', value: olap.dice },
                { key: 'drill', value: olap.drill },
              ].filter((item) => Boolean(item.value)).map((item) => (
                <div key={item.key} style={{ padding: '10px 12px', borderRadius: 10, background: theme.surface, color: theme.textSecondary, fontSize: 13, border: `1px solid ${theme.border}` }}>
                  {item.value}
                </div>
              ))}
            </div>
          )}
        </Panel>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16 }}>
        <StatCard label="Total Events" value={overview.totalEvents} color="#6366f1" theme={theme} isMobile={isMobile} />
        <StatCard
          label={isAttendee ? 'My Registered Events' : 'Total Registrations'}
          value={isAttendee ? myRegistrations.length : overview.totalRegistrations}
          color="#10b981"
          theme={theme}
          isMobile={isMobile}
        />
        {showAdvancedAnalytics && (
          <StatCard
            label="Total Revenue"
            value={`Rs ${overview.totalRevenue.toLocaleString()}`}
            color="#f59e0b"
            theme={theme}
            isMobile={isMobile}
          />
        )}
        {showAdvancedAnalytics && (
          <StatCard
            label="Avg Capacity Used"
            value={`${Math.round((overview.avgCapacityUsed || 0) * 100)}%`}
            color="#ec4899"
            theme={theme}
            isMobile={isMobile}
          />
        )}
      </div>

      {showAdvancedAnalytics && (
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(auto-fit, minmax(${isMobile ? 240 : 300}px, 1fr))`, gap: 20 }}>
        <Panel title="Events by Category" theme={theme}>
          {categoryData.length === 0 ? (
            <p style={{ color: theme.textFaint, fontSize: 14 }}>No data yet</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={categoryData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} dataKey="value" nameKey="name" label={({ name, value }) => `${name}: ${value}`} labelLine={false}>
                  {categoryData.map((_, index) => <Cell key={index} fill={COLORS[index % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: 8, color: theme.text }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </Panel>

        <Panel title="Events by Status" theme={theme}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {byStatus.map((row, index) => (
              <div key={row._id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 12, height: 12, borderRadius: '50%', background: COLORS[index % COLORS.length], flexShrink: 0 }} />
                <span style={{ flex: 1, fontSize: 14, color: theme.textSecondary, textTransform: 'capitalize' }}>{row._id}</span>
                <span style={{ fontWeight: 700, fontSize: 16, color: theme.text }}>{row.count}</span>
              </div>
            ))}
            {byStatus.length === 0 && <p style={{ color: theme.textFaint, fontSize: 14 }}>No data yet</p>}
          </div>
        </Panel>
      </div>
      )}


      {showAdvancedAnalytics && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(auto-fit, minmax(${isMobile ? 240 : 320}px, 1fr))`, gap: 20 }}>
            <Panel title="Drill-Down View" theme={theme} subtitle={isOrganiser ? 'Year -> Month -> Day analysis of your filtered events' : 'Year -> Month -> Day analysis of filtered events'}>
              {drillData.length === 0 ? (
                <p style={{ color: theme.textFaint, fontSize: 14 }}>No drill-down data yet</p>
              ) : (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={drillData} margin={{ top: 4, right: 8, bottom: 0, left: isMobile ? -24 : -10 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" tick={{ fontSize: 12, fill: theme.textMuted }} />
                    <YAxis tick={{ fontSize: 12, fill: theme.textMuted }} allowDecimals={false} />
                    <Tooltip contentStyle={{ background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: 8, color: theme.text }} />
                    <Legend />
                    <Bar dataKey="Events" fill="#6366f1" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Registrations" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </Panel>

            <Panel title="Pivot: Category vs Revenue" theme={theme} subtitle={isOrganiser ? 'Your revenue and registrations by category' : 'Pivoted revenue and registrations by category'}>
              {pivotData.length === 0 ? (
                <p style={{ color: theme.textFaint, fontSize: 14 }}>No pivot data yet</p>
              ) : (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={pivotData} margin={{ top: 4, right: 8, bottom: 0, left: isMobile ? -24 : -10 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" tick={{ fontSize: 12, fill: theme.textMuted }} />
                    <YAxis tick={{ fontSize: 12, fill: theme.textMuted }} allowDecimals={false} />
                    <Tooltip contentStyle={{ background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: 8, color: theme.text }} />
                    <Legend />
                    <Bar dataKey="Revenue" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Registrations" fill="#06b6d4" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </Panel>
          </div>

          <Panel title="Trend Analysis" theme={theme} subtitle={isOrganiser ? 'Monthly movement across your events, registrations, and revenue' : 'Monthly events, registrations, and revenue movement'}>
            {trendData.length === 0 ? (
              <p style={{ color: theme.textFaint, fontSize: 14 }}>No trend data yet</p>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={trendData} margin={{ top: 8, right: 12, bottom: 0, left: isMobile ? -24 : -10 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 12, fill: theme.textMuted }} />
                  <YAxis tick={{ fontSize: 12, fill: theme.textMuted }} allowDecimals={false} />
                  <Tooltip contentStyle={{ background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: 8, color: theme.text }} />
                  <Legend />
                  <Line type="monotone" dataKey="Events" stroke="#6366f1" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="Registrations" stroke="#10b981" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="Revenue" stroke="#f59e0b" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </Panel>

          <Panel title="K-Means Clustering" theme={theme} subtitle="Attendees grouped into high, medium, and low engagement buckets">
            {clusters.length === 0 ? (
              <p style={{ color: theme.textFaint, fontSize: 14 }}>Not enough attendee activity yet</p>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: `repeat(auto-fit, minmax(${isMobile ? 220 : 240}px, 1fr))`, gap: 16 }}>
                {clusters.map((cluster, index) => (
                  <div key={cluster.label} style={{ padding: 16, borderRadius: 12, background: theme.inputBg, border: `1px solid ${theme.border}` }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                      <div style={{ width: 12, height: 12, borderRadius: '50%', background: COLORS[index % COLORS.length] }} />
                      <div style={{ fontWeight: 600, color: theme.text }}>{cluster.label}</div>
                    </div>
                    <div style={{ fontSize: 13, color: theme.textMuted, lineHeight: 1.7 }}>
                      <div>Users: {cluster.size}</div>
                      <div>Avg registrations: {cluster.avgRegistrations}</div>
                      <div>Avg active months: {cluster.avgActiveMonths}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Panel>

          <Panel title="Monthly Activity Snapshot" theme={theme}>
            {monthData.length === 0 ? (
              <p style={{ color: theme.textFaint, fontSize: 14 }}>No data yet</p>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={monthData} margin={{ top: 4, right: 8, bottom: 0, left: isMobile ? -24 : -10 }}>
                  <XAxis dataKey="name" tick={{ fontSize: 12, fill: theme.textMuted }} />
                  <YAxis tick={{ fontSize: 12, fill: theme.textMuted }} allowDecimals={false} />
                  <Tooltip contentStyle={{ background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: 8, color: theme.text }} />
                  <Legend />
                  <Bar dataKey="Events" fill="#6366f1" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Registrations" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </Panel>
        </>
      )}

      {isAttendee && (
        <Panel title="Recommended For You" theme={theme} subtitle={recommendationsSubtitle}>
          {recommendationsLoading ? (
            <p style={{ color: theme.textFaint, fontSize: 14 }}>Finding events that match your interests...</p>
          ) : recommendations.length === 0 ? (
            <p style={{ color: theme.textFaint, fontSize: 14 }}>No available upcoming events to recommend yet.</p>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: `repeat(auto-fill, minmax(${isMobile ? 240 : isTablet ? 260 : 280}px, 1fr))`, gap: 16 }}>
              {recommendations.map((event) => (
                <EventCard
                  key={event._id}
                  event={{
                    ...event,
                    isRegistered: registeredIds.has(event._id),
                    onRegister: handleRegister,
                    onCancelRegistration: handleCancelRegistration,
                    onClick: detailsModal.openForEvent,
                  }}
                />
              ))}
            </div>
          )}
        </Panel>
      )}

      <Panel title="Recent Events" theme={theme} subtitle={recentEventsSubtitle}>
        {loading && events.length === 0 ? (
          <p style={{ color: theme.textFaint, fontSize: 14 }}>Loading events...</p>
        ) : events.length === 0 ? (
          <p style={{ color: theme.textFaint, fontSize: 14 }}>No events available yet</p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(auto-fill, minmax(${isMobile ? 240 : isTablet ? 260 : 280}px, 1fr))`, gap: 16 }}>
            {events.map((event) => (
              <EventCard
                key={event._id}
                event={{
                  ...event,
                  isRegistered: registeredIds.has(event._id),
                  onRegister: handleRegister,
                  onCancelRegistration: handleCancelRegistration,
                  onClick: detailsModal.openForEvent,
                }}
              />
            ))}
          </div>
        )}
      </Panel>

      <EventDetailsModal
        {...detailsModal.modalProps}
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
