import { useDarkMode } from '../context/DarkModeContext';
import useViewport from '../hooks/useViewport';

export default function Navbar({ onMenuClick }) {
  const { dark, toggle, theme } = useDarkMode();
  const { isMobile, isDesktop } = useViewport();

  return (
    <header style={{
      height: 56,
      background: theme.navbarBg,
      borderBottom: `1px solid ${theme.border}`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: isMobile ? '0 12px' : '0 20px',
      position: 'sticky',
      top: 0,
      zIndex: 30,
      transition: 'all 0.3s',
    }}>
      <button
        onClick={onMenuClick}
        style={{
          background: 'none',
          border: 'none',
          fontSize: 22,
          cursor: isDesktop ? 'default' : 'pointer',
          lineHeight: 1,
          color: theme.text,
          visibility: isDesktop ? 'hidden' : 'visible',
        }}
        aria-label="Open menu"
      >
        ☰
      </button>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {!isMobile && <span style={{ fontSize: 13, color: theme.textFaint }}>{dark ? 'Dark' : 'Light'}</span>}
        <span
          aria-hidden="true"
          title="Light mode"
          style={{
            fontSize: 14,
            lineHeight: 1,
            color: dark ? theme.textFaint : theme.text,
            userSelect: 'none',
          }}
        >
          ☀
        </span>
        <button
          onClick={toggle}
          aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
          style={{
            width: 44,
            height: 24,
            borderRadius: 12,
            border: 'none',
            cursor: 'pointer',
            padding: 2,
            background: dark ? '#6366f1' : '#d1d5db',
            transition: 'background 0.2s',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <div style={{
            width: 20, height: 20, borderRadius: '50%', background: '#fff',
            transform: dark ? 'translateX(20px)' : 'translateX(0)',
            transition: 'transform 0.2s',
          }} />
        </button>
        <span
          aria-hidden="true"
          title="Dark mode"
          style={{
            fontSize: 14,
            lineHeight: 1,
            color: dark ? theme.text : theme.textFaint,
            userSelect: 'none',
          }}
        >
          ☾
        </span>
      </div>
    </header>
  );
}
