import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useDarkMode } from '../context/DarkModeContext';
import { useToast } from '../context/ToastContext';
import { exportService } from '../services/exportService';

function getFilenameFromContentDisposition(value) {
  if (!value) return '';
  const match = /filename="?([^"]+)"?/i.exec(String(value));
  return match?.[1] || '';
}

export default function ExportExecutiveSummary() {
  const { user } = useAuth();
  const { theme } = useDarkMode();
  const { toast } = useToast();
  const [downloading, setDownloading] = useState(false);

  const canExport = user?.role === 'organiser';

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const res = await exportService.executiveSummaryCsv();
      const blob = new Blob([res.data], { type: 'text/csv' });
      const filename =
        getFilenameFromContentDisposition(res.headers?.['content-disposition']) || 'executive_summary.csv';

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to download CSV');
    } finally {
      setDownloading(false);
    }
  };

  if (!canExport) {
    return (
      <div style={{ background: theme.surface, borderRadius: 12, padding: 22, border: `1px solid ${theme.border}` }}>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: theme.text }}>Export Executive Summary</h2>
        <p style={{ margin: '8px 0 0', fontSize: 13, color: theme.textMuted }}>
          You donâ€™t have access to this page.
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ background: theme.surface, borderRadius: 12, padding: 22, border: `1px solid ${theme.border}` }}>
        <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: theme.text }}>Export Executive Summary</h2>
        <p style={{ margin: '6px 0 0', fontSize: 13, color: theme.textMuted }}>
          Download a CSV summary of your events.
        </p>
        <div style={{ marginTop: 16 }}>
          <button
            type="button"
            onClick={handleDownload}
            disabled={downloading}
            style={{
              padding: '10px 14px',
              borderRadius: 10,
              border: `1px solid ${theme.inputBorder}`,
              background: theme.surface,
              color: theme.text,
              fontWeight: 800,
              fontSize: 13,
              cursor: downloading ? 'not-allowed' : 'pointer',
              opacity: downloading ? 0.7 : 1,
            }}
          >
            {downloading ? 'Downloading...' : 'Download CSV'}
          </button>
        </div>
      </div>
    </div>
  );
}

