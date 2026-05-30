import { useState } from 'react';
import { Outlet } from 'react-router-dom';

import Sidebar from './Sidebar';
import Navbar from './Navbar';
import AIChatWidget from './AIChatWidget';

import { useAuth } from '../context/AuthContext';
import { useDarkMode } from '../context/DarkModeContext';
import useViewport from '../hooks/useViewport';

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const { user } = useAuth();
  const { theme } = useDarkMode();

  const { isMobile, isDesktop } = useViewport();

  const sidebarWidth = 240;
  const showAIChatWidget = user?.role === 'attendee' || user?.role === 'organiser';

  return (
    <div
      style={{
        minHeight: '100vh',
        background: theme.bg,
        fontFamily: 'system-ui, sans-serif',
        transition: 'background 0.3s',
      }}
    >

      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div
        style={{
          paddingLeft: isDesktop
            ? sidebarWidth
            : 0,
        }}
      >

        <Navbar
          onMenuClick={() =>
            setSidebarOpen(true)
          }
        />

        <main
          style={{
            padding: isMobile
              ? '16px 12px 24px'
              : '24px 20px',

            maxWidth: 1180,

            margin: '0 auto',
          }}
        >
          <Outlet />
        </main>

      </div>

      {showAIChatWidget && <AIChatWidget />}

    </div>
  );
}
