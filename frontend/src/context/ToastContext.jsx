import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import useViewport from '../hooks/useViewport';

const ToastContext = createContext();

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const { isMobile } = useViewport();

  const addToast = useCallback((message, type = 'info', duration = 3500) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), duration);
  }, []);

  const toast = useMemo(() => ({
    success: (msg) => addToast(msg, 'success'),
    error: (msg) => addToast(msg, 'error'),
    info: (msg) => addToast(msg, 'info'),
  }), [addToast]);

  const value = useMemo(() => ({ toast }), [toast]);

  const typeStyles = {
    success: { background: '#16a34a', color: '#fff' },
    error: { background: '#dc2626', color: '#fff' },
    info: { background: '#2563eb', color: '#fff' },
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div style={{
        position: 'fixed',
        bottom: isMobile ? 12 : 24,
        right: isMobile ? 12 : 24,
        left: isMobile ? 12 : 'auto',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
      }}>
        {toasts.map((t) => (
          <div key={t.id} style={{
            padding: '12px 20px', borderRadius: 8, fontSize: 14, fontWeight: 500,
            boxShadow: '0 4px 12px rgba(0,0,0,0.2)', minWidth: isMobile ? 'auto' : 220, maxWidth: isMobile ? '100%' : 340,
            animation: 'slideIn 0.2s ease', ...typeStyles[t.type],
          }}>
            {t.message}
          </div>
        ))}
      </div>
      <style>{`@keyframes slideIn { from { opacity:0; transform:translateX(20px); } to { opacity:1; transform:translateX(0); } }`}</style>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
