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
  bg: '#050505',
  surface: '#111111',
  surfaceHover: '#1f1f1f',
  border: '#262626',
  borderMedium: '#3f3f46',
  text: '#f5f5f5',
  textSecondary: '#d4d4d4',
  textMuted: '#a3a3a3',
  textFaint: '#737373',
  inputBg: '#171717',
  inputBorder: '#3f3f46',
  cardShadow: '0 1px 4px rgba(0,0,0,0.3)',
  modalShadow: '0 4px 24px rgba(0,0,0,0.4)',
  sidebarBg: '#0d0d0d',
  navbarBg: '#0d0d0d',
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
