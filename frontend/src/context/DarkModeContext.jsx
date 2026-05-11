import { createContext, useContext, useEffect, useState, useMemo } from 'react';

const DarkModeContext = createContext();

const lightTheme = {
  bg: '#f9fafb',
  surface: '#fff',
  surfaceHover: '#f3f4f6',
  border: '#f3f4f6',
  borderMedium: '#e5e7eb',
  text: '#111827',
  textSecondary: '#374151',
  textMuted: '#6b7280',
  textFaint: '#9ca3af',
  inputBg: '#fff',
  inputBorder: '#e5e7eb',
  cardShadow: '0 1px 4px rgba(0,0,0,0.04)',
  modalShadow: '0 4px 24px rgba(0,0,0,0.07)',
  sidebarBg: '#fff',
  navbarBg: '#fff',
  overlay: 'rgba(0,0,0,0.3)',
};

const darkTheme = {
  bg: '#0f172a',
  surface: '#1e293b',
  surfaceHover: '#334155',
  border: '#334155',
  borderMedium: '#475569',
  text: '#f1f5f9',
  textSecondary: '#cbd5e1',
  textMuted: '#94a3b8',
  textFaint: '#64748b',
  inputBg: '#1e293b',
  inputBorder: '#475569',
  cardShadow: '0 1px 4px rgba(0,0,0,0.3)',
  modalShadow: '0 4px 24px rgba(0,0,0,0.4)',
  sidebarBg: '#1e293b',
  navbarBg: '#1e293b',
  overlay: 'rgba(0,0,0,0.6)',
};

export function DarkModeProvider({ children }) {
  const [dark, setDark] = useState(() => localStorage.getItem('darkMode') === 'true');

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    localStorage.setItem('darkMode', dark);
  }, [dark]);

  const toggle = () => setDark((d) => !d);

  const theme = useMemo(() => (dark ? darkTheme : lightTheme), [dark]);

  return <DarkModeContext.Provider value={{ dark, toggle, theme }}>{children}</DarkModeContext.Provider>;
}

export const useDarkMode = () => useContext(DarkModeContext);
