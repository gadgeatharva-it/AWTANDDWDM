import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useDarkMode } from '../context/DarkModeContext';
import useViewport from '../hooks/useViewport';

const baseNavItems = [
  { to: '/app/dashboard', label: 'Dashboard', icon: 'D' },
  { to: '/app/events', label: 'Events', icon: 'E' },
];

export default function Sidebar({ open, onClose }) {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { dark, theme } = useDarkMode();
  const { isMobile, isDesktop } = useViewport();

  const showActivityLogs = user?.role === 'organiser' || user?.role === 'admin';
  const showQandA = user?.role === 'attendee' || user?.role === 'organiser';
  const showAttendeeExtras = user?.role === 'attendee';
  const showExecutiveExport = user?.role === 'admin';
  const showMyAttendees = user?.role === 'organiser';
  const showAdminControl = user?.role === 'admin';

  const navItems = [
    ...baseNavItems,
    ...(showAttendeeExtras ? [{ to: '/app/my-events', label: 'My Registered Events', icon: 'R' }] : []),
    ...(showAttendeeExtras ? [{ to: '/app/upcoming', label: 'Upcoming (7 days)', icon: 'U' }] : []),
    ...(showAttendeeExtras ? [{ to: '/app/notifications', label: 'Notifications', icon: 'N' }] : []),
    ...(showActivityLogs ? [{ to: '/app/activity', label: 'Activity Logs', icon: 'A' }] : []),
    ...(showMyAttendees ? [{ to: '/app/my-attendees', label: 'My Attendees', icon: 'M' }] : []),
    ...(showAdminControl ? [{ to: '/app/users', label: 'Users', icon: 'U' }] : []),
    ...(showAdminControl ? [{ to: '/app/admin-control', label: 'Admin Control', icon: '*' }] : []),
    ...(showExecutiveExport ? [{ to: '/app/export/executive-summary', label: 'Export Executive Summary', icon: 'X' }] : []),
    ...(showQandA ? [{ to: '/app/qa', label: 'Q&A', icon: 'Q' }] : []),
  ];

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/login');
  };

  const linkStyle = ({ isActive }) => ({
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: isMobile ? '12px 16px' : '10px 16px',
    borderRadius: 8,
    textDecoration: 'none',
    fontWeight: 500,
    fontSize: 15,
    color: isActive ? '#6366f1' : theme.textMuted,
    background: isActive ? (dark ? 'rgba(99,102,241,0.15)' : '#eef2ff') : 'transparent',
    transition: 'all 0.15s',
  });

  return (
    <>
      {open && !isDesktop && (
        <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: theme.overlay, zIndex: 39 }} />
      )}

      <aside style={{
        position: 'fixed',
        top: 0,
        left: 0,
        height: '100vh',
        width: isMobile ? '84vw' : 240,
        maxWidth: isMobile ? 280 : undefined,
        background: theme.sidebarBg,
        borderRight: `1px solid ${theme.border}`,
        display: 'flex',
        flexDirection: 'column',
        padding: '24px 16px',
        zIndex: 40,
        transform: isDesktop || open ? 'translateX(0)' : 'translateX(-100%)',
        transition: 'transform 0.25s ease, background 0.3s',
        boxShadow: !isDesktop && open ? '4px 0 20px rgba(0,0,0,0.08)' : 'none',
      }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 32, paddingLeft: 8 }}>
          <span style={{ fontSize: 22, fontWeight: 900, color: '#6366f1' }}>EF</span>
          <span style={{ fontWeight: 700, fontSize: 18, color: theme.text }}>EventFlow</span>
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1 }}>
          {navItems.map((item) => (
            <NavLink key={item.to} to={item.to} style={linkStyle} onClick={!isDesktop ? onClose : undefined}>
              <span style={{ width: 18, textAlign: 'center', fontWeight: 800 }}>{item.icon}</span> {item.label}
            </NavLink>
          ))}
        </nav>

        {user && (
          <div style={{ borderTop: `1px solid ${theme.border}`, paddingTop: 16 }}>
            <div style={{ fontSize: 13, color: theme.textMuted, marginBottom: 4, textTransform: 'capitalize' }}>{user.role}</div>
            <div style={{ fontWeight: 600, fontSize: 14, color: theme.text, marginBottom: 12 }}>{user.name}</div>
            <div style={{ fontSize: 12, color: theme.textFaint, marginBottom: 12, wordBreak: 'break-word', lineHeight: 1.4 }}>{user.email}</div>
            <button onClick={handleLogout} style={{
              width: '100%',
              padding: '9px 0',
              borderRadius: 8,
              border: `1px solid ${dark ? '#7f1d1d' : '#fee2e2'}`,
              background: dark ? 'rgba(239,68,68,0.1)' : '#fff5f5',
              color: '#ef4444',
              fontWeight: 600,
              fontSize: 14,
              cursor: 'pointer',
            }}
            >
              Logout
            </button>
          </div>
        )}
      </aside>
    </>
  );
}
