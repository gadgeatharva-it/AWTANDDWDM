import { useState, useEffect } from 'react';
import { useDarkMode } from '../context/DarkModeContext';
import useViewport from '../hooks/useViewport';

const CATEGORIES = ['conference', 'workshop', 'webinar', 'meetup', 'concert', 'sports', 'other'];
const STATUSES = ['draft', 'published', 'cancelled', 'completed'];

const toDateInput = (iso) => iso ? iso.slice(0, 16) : '';

export default function EventModal({ event, onSave, onClose }) {
  const isEdit = !!event;
  const { theme } = useDarkMode();
  const { isMobile } = useViewport();
  const [form, setForm] = useState({
    title: '', description: '', category: 'other', status: 'draft',
    location: '', externalUrl: '', startDate: '', endDate: '', capacity: '', price: '', tags: '',
  });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (event) {
      setForm({
        title: event.title || '',
        description: event.description || '',
        category: event.category || 'other',
        status: event.status || 'draft',
        location: event.location || '',
        externalUrl: event.externalUrl || '',
        startDate: toDateInput(event.startDate),
        endDate: toDateInput(event.endDate),
        capacity: event.capacity || '',
        price: event.price || 0,
        tags: (event.tags || []).join(', '),
      });
    }
  }, [event]);

  const validate = () => {
    const e = {};
    if (!form.title.trim()) e.title = 'Title is required';
    if (!form.startDate) e.startDate = 'Start date is required';
    if (!form.endDate) e.endDate = 'End date is required';
    if (form.startDate && form.endDate && form.endDate <= form.startDate) e.endDate = 'End date must be after start date';
    if (!form.capacity || Number(form.capacity) < 1) e.capacity = 'Capacity must be at least 1';
    if (form.externalUrl.trim() && !/^https?:\/\/\S+\.\S+/.test(form.externalUrl.trim())) e.externalUrl = 'Enter a valid website URL';
    return e;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    setErrors((er) => ({ ...er, [name]: undefined }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setSaving(true);
    try {
      await onSave({
        ...form,
        capacity: Number(form.capacity),
        price: Number(form.price) || 0,
        tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean),
      });
    } finally { setSaving(false); }
  };

  const fieldStyle = (name) => ({
    width: '100%', padding: '9px 12px', borderRadius: 8, fontSize: 14,
    border: `1px solid ${errors[name] ? '#ef4444' : theme.inputBorder}`,
    outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit',
    background: theme.inputBg, color: theme.text, transition: 'all 0.3s',
  });

  const labelStyle = { fontSize: 13, fontWeight: 500, color: theme.textSecondary, display: 'block', marginBottom: 4 };

  return (
    <div style={{ position: 'fixed', inset: 0, background: theme.overlay, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ background: theme.surface, borderRadius: 16, width: '100%', maxWidth: 540, maxHeight: '90vh', overflowY: 'auto', padding: isMobile ? 18 : 28, border: `1px solid ${theme.border}`, transition: 'all 0.3s' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, gap: 12 }}>
          <h2 style={{ margin: 0, fontSize: isMobile ? 18 : 20, fontWeight: 700, color: theme.text }}>{isEdit ? 'Edit Event' : 'Create Event'}</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: theme.textMuted }}>x</button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={labelStyle}>Title *</label>
            <input name="title" value={form.title} onChange={handleChange} style={fieldStyle('title')} placeholder="Event title" />
            {errors.title && <span style={{ color: '#ef4444', fontSize: 12 }}>{errors.title}</span>}
          </div>

          <div>
            <label style={labelStyle}>Description</label>
            <textarea name="description" value={form.description} onChange={handleChange} rows={3} style={{ ...fieldStyle('description'), resize: 'vertical' }} placeholder="Describe your event..." />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 12 }}>
            <div>
              <label style={labelStyle}>Category</label>
              <select name="category" value={form.category} onChange={handleChange} style={fieldStyle('category')}>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Status</label>
              <select name="status" value={form.status} onChange={handleChange} style={fieldStyle('status')}>
                {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label style={labelStyle}>Location</label>
            <input name="location" value={form.location} onChange={handleChange} style={fieldStyle('location')} placeholder="Venue or Online" />
          </div>

          <div>
            <label style={labelStyle}>Website Link</label>
            <input name="externalUrl" value={form.externalUrl} onChange={handleChange} style={fieldStyle('externalUrl')} placeholder="https://event-website.com" />
            {errors.externalUrl && <span style={{ color: '#ef4444', fontSize: 12 }}>{errors.externalUrl}</span>}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 12 }}>
            <div>
              <label style={labelStyle}>Start Date *</label>
              <input type="datetime-local" name="startDate" value={form.startDate} onChange={handleChange} style={fieldStyle('startDate')} />
              {errors.startDate && <span style={{ color: '#ef4444', fontSize: 12 }}>{errors.startDate}</span>}
            </div>
            <div>
              <label style={labelStyle}>End Date *</label>
              <input type="datetime-local" name="endDate" value={form.endDate} onChange={handleChange} style={fieldStyle('endDate')} />
              {errors.endDate && <span style={{ color: '#ef4444', fontSize: 12 }}>{errors.endDate}</span>}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 12 }}>
            <div>
              <label style={labelStyle}>Capacity *</label>
              <input type="number" name="capacity" value={form.capacity} onChange={handleChange} min={1} style={fieldStyle('capacity')} placeholder="100" />
              {errors.capacity && <span style={{ color: '#ef4444', fontSize: 12 }}>{errors.capacity}</span>}
            </div>
            <div>
              <label style={labelStyle}>Price (Rs)</label>
              <input type="number" name="price" value={form.price} onChange={handleChange} min={0} style={fieldStyle('price')} placeholder="0 = free" />
            </div>
          </div>

          <div>
            <label style={labelStyle}>Tags (comma separated)</label>
            <input name="tags" value={form.tags} onChange={handleChange} style={fieldStyle('tags')} placeholder="tech, networking, free" />
          </div>

          <div style={{ display: 'flex', flexDirection: isMobile ? 'column-reverse' : 'row', gap: 10, marginTop: 8 }}>
            <button type="button" onClick={onClose} style={{
              flex: 1, padding: '10px 0', borderRadius: 8, border: `1px solid ${theme.inputBorder}`,
              background: theme.surface, color: theme.textSecondary, fontWeight: 600, fontSize: 14, cursor: 'pointer',
            }}>Cancel</button>
            <button type="submit" disabled={saving} style={{
              flex: 2, padding: '10px 0', borderRadius: 8, border: 'none',
              background: saving ? '#a5b4fc' : '#6366f1', color: '#fff',
              fontWeight: 600, fontSize: 14, cursor: saving ? 'not-allowed' : 'pointer',
            }}>
              {saving ? 'Saving...' : isEdit ? 'Update Event' : 'Create Event'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
