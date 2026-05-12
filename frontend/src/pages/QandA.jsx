import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useDarkMode } from '../context/DarkModeContext';
import { LoadingSpinner } from '../components/ProtectedRoute';
import { useEvents } from '../context/EventContext';
import useViewport from '../hooks/useViewport';
import { questionService } from '../services/questionService';

function formatDateTime(value) {
  const date = value ? new Date(value) : null;
  if (!date || Number.isNaN(date.valueOf())) return '—';
  return date.toLocaleString(undefined, { year: 'numeric', month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' });
}

export default function QandA() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { theme } = useDarkMode();
  const { isMobile } = useViewport();

  const { myRegistrations, fetchMyRegistrations } = useEvents();

  const isAttendee = user?.role === 'attendee';
  const canAccess = Boolean(user);

  const [loading, setLoading] = useState(false);
  const [asking, setAsking] = useState(false);
  const [answeringId, setAnsweringId] = useState('');
  const [answerDraft, setAnswerDraft] = useState('');

  const [filters, setFilters] = useState({ page: 1, limit: 20, status: '' });
  const [data, setData] = useState({ items: [], total: 0, page: 1, pages: 0 });

  const [selectedEventId, setSelectedEventId] = useState('');
  const [questionDraft, setQuestionDraft] = useState('');

  useEffect(() => {
    if (isAttendee) fetchMyRegistrations();
  }, [fetchMyRegistrations, isAttendee]);

  const attendeeEvents = useMemo(() => (
    myRegistrations
      .map((r) => r.event)
      .filter(Boolean)
      .sort((a, b) => new Date(a.startDate) - new Date(b.startDate))
  ), [myRegistrations]);

  useEffect(() => {
    if (isAttendee && !selectedEventId && attendeeEvents.length > 0) setSelectedEventId(attendeeEvents[0]._id);
  }, [attendeeEvents, isAttendee, selectedEventId]);

  const load = useCallback(async () => {
    if (!canAccess) return;
    setLoading(true);
    try {
      const params = { page: filters.page, limit: filters.limit };
      if (filters.status) params.status = filters.status;
      const res = isAttendee ? await questionService.my(params) : await questionService.inbox(params);
      const payload = res.data || {};
      const items = Array.isArray(payload.questions) ? payload.questions : [];
      setData({ items, total: payload.total || 0, page: payload.page || 1, pages: payload.pages || 0 });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load questions');
      setData({ items: [], total: 0, page: 1, pages: 0 });
    } finally {
      setLoading(false);
    }
  }, [canAccess, filters.limit, filters.page, filters.status, isAttendee, toast]);

  useEffect(() => { load(); }, [load]);

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

  const inputStyle = {
    width: '100%',
    padding: '10px 12px',
    borderRadius: 10,
    border: `1px solid ${theme.inputBorder}`,
    fontSize: 13.5,
    outline: 'none',
    boxSizing: 'border-box',
    fontFamily: 'inherit',
    background: theme.inputBg,
    color: theme.text,
    transition: 'all 0.3s',
  };

  const handleAsk = async (e) => {
    e.preventDefault();
    if (!selectedEventId) return toast.error('Select an event');
    if (!questionDraft.trim()) return toast.error('Write your question');
    setAsking(true);
    try {
      await questionService.ask(selectedEventId, questionDraft);
      setQuestionDraft('');
      toast.success('Question sent');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send question');
    } finally {
      setAsking(false);
    }
  };

  const startAnswer = (id) => {
    setAnsweringId(id);
    setAnswerDraft('');
  };

  const submitAnswer = async (id) => {
    if (!answerDraft.trim()) return toast.error('Write an answer');
    try {
      await questionService.answer(id, answerDraft);
      toast.success('Answer sent');
      setAnsweringId('');
      setAnswerDraft('');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send answer');
    }
  };

  if (!canAccess) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: isMobile ? 20 : 22, fontWeight: 800, color: theme.text }}>Chat / Q&A</h2>
          <p style={{ margin: '2px 0 0', fontSize: 13, color: theme.textMuted }}>
            {isAttendee ? 'Ask organisers questions about your events' : 'Answer attendee questions for your events'}
          </p>
        </div>
        <select value={filters.status} onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value, page: 1 }))} style={selectStyle}>
          <option value="">All</option>
          <option value="open">Open</option>
          <option value="answered">Answered</option>
        </select>
      </div>

      {isAttendee && (
        <div style={{ background: theme.surface, borderRadius: 12, padding: 18, border: `1px solid ${theme.border}` }}>
          <div style={{ fontWeight: 800, color: theme.text, marginBottom: 10 }}>Ask a question</div>
          <form onSubmit={handleAsk} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <select value={selectedEventId} onChange={(e) => setSelectedEventId(e.target.value)} style={selectStyle}>
              {attendeeEvents.length === 0 ? (
                <option value="">No registered events</option>
              ) : (
                attendeeEvents.map((ev) => (
                  <option key={ev._id} value={ev._id}>{ev.title}</option>
                ))
              )}
            </select>
            <textarea
              value={questionDraft}
              onChange={(e) => setQuestionDraft(e.target.value)}
              rows={4}
              placeholder="Type your question for the organiser…"
              style={{ ...inputStyle, resize: 'vertical' }}
            />
            <button type="submit" disabled={asking || attendeeEvents.length === 0} style={{
              width: isMobile ? '100%' : 'fit-content',
              padding: '10px 16px',
              borderRadius: 10,
              border: 'none',
              background: asking ? '#a5b4fc' : '#6366f1',
              color: '#fff',
              fontWeight: 800,
              fontSize: 13.5,
              cursor: asking ? 'not-allowed' : 'pointer',
            }}
            >
              {asking ? 'Sending…' : 'Send question'}
            </button>
          </form>
        </div>
      )}

      {loading ? (
        <LoadingSpinner />
      ) : data.items.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '56px 0', color: theme.textFaint }}>
          <div style={{ fontSize: 44, marginBottom: 12 }}>Q&A</div>
          <p style={{ fontSize: 15, margin: 0 }}>No questions yet</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {data.items.map((q) => {
            const isAnswered = q.status === 'answered' && q.answer;
            const title = isAttendee ? (q?.event?.title || 'Event') : (q?.event?.title || 'Event');
            const asker = q?.attendee?.name ? `${q.attendee.name}${q.attendee.email ? ` (${q.attendee.email})` : ''}` : '';
            return (
              <div key={q._id} style={{ background: theme.surface, borderRadius: 12, border: `1px solid ${theme.border}`, padding: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 900, color: theme.text, fontSize: 14.5, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={title}>
                      {title}
                    </div>
                    <div style={{ marginTop: 3, fontSize: 12.5, color: theme.textMuted }}>
                      {isAttendee ? `Asked ${formatDateTime(q.createdAt)}` : `${asker ? `${asker} • ` : ''}${formatDateTime(q.createdAt)}`}
                    </div>
                  </div>
                  <div style={{
                    padding: '6px 10px',
                    borderRadius: 999,
                    fontSize: 11.5,
                    fontWeight: 900,
                    background: isAnswered ? 'rgba(16,185,129,0.10)' : 'rgba(245,158,11,0.10)',
                    color: isAnswered ? '#10b981' : '#f59e0b',
                    border: `1px solid ${isAnswered ? 'rgba(16,185,129,0.30)' : 'rgba(245,158,11,0.30)'}`,
                    whiteSpace: 'nowrap',
                    height: 'fit-content',
                  }}
                  >
                    {isAnswered ? 'ANSWERED' : 'OPEN'}
                  </div>
                </div>

                <div style={{ marginTop: 12 }}>
                  <div style={{ fontSize: 12, fontWeight: 900, color: theme.textMuted, marginBottom: 4 }}>Question</div>
                  <div style={{ fontSize: 13.5, color: theme.text, lineHeight: 1.45, whiteSpace: 'pre-wrap' }}>{q.question}</div>
                </div>

                {isAnswered && (
                  <div style={{ marginTop: 12, paddingTop: 12, borderTop: `1px solid ${theme.border}` }}>
                    <div style={{ fontSize: 12, fontWeight: 900, color: theme.textMuted, marginBottom: 4 }}>Answer</div>
                    <div style={{ fontSize: 13.5, color: theme.text, lineHeight: 1.45, whiteSpace: 'pre-wrap' }}>{q.answer}</div>
                  </div>
                )}

                {!isAttendee && !isAnswered && (
                  <div style={{ marginTop: 12, paddingTop: 12, borderTop: `1px solid ${theme.border}` }}>
                    {answeringId !== q._id ? (
                      <button
                        onClick={() => startAnswer(q._id)}
                        style={{
                          padding: '9px 12px',
                          borderRadius: 10,
                          border: `1px solid ${theme.inputBorder}`,
                          background: theme.inputBg,
                          color: theme.text,
                          fontWeight: 900,
                          fontSize: 13,
                          cursor: 'pointer',
                        }}
                      >
                        Write answer
                      </button>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        <textarea
                          value={answerDraft}
                          onChange={(e) => setAnswerDraft(e.target.value)}
                          rows={4}
                          placeholder="Type your answer…"
                          style={{ ...inputStyle, resize: 'vertical' }}
                        />
                        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                          <button
                            onClick={() => submitAnswer(q._id)}
                            style={{
                              padding: '10px 14px',
                              borderRadius: 10,
                              border: 'none',
                              background: '#10b981',
                              color: '#fff',
                              fontWeight: 900,
                              fontSize: 13,
                              cursor: 'pointer',
                            }}
                          >
                            Send answer
                          </button>
                          <button
                            onClick={() => { setAnsweringId(''); setAnswerDraft(''); }}
                            style={{
                              padding: '10px 14px',
                              borderRadius: 10,
                              border: `1px solid ${theme.inputBorder}`,
                              background: theme.surface,
                              color: theme.text,
                              fontWeight: 900,
                              fontSize: 13,
                              cursor: 'pointer',
                            }}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {data.pages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 6, flexWrap: 'wrap' }}>
          {Array.from({ length: data.pages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => setFilters((f) => ({ ...f, page: p }))}
              style={{
                width: 36,
                height: 36,
                borderRadius: 8,
                border: `1px solid ${theme.inputBorder}`,
                background: p === data.page ? '#6366f1' : theme.surface,
                color: p === data.page ? '#fff' : theme.textSecondary,
                fontWeight: 800,
                fontSize: 14,
                cursor: 'pointer',
                transition: 'all 0.3s',
              }}
            >
              {p}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

