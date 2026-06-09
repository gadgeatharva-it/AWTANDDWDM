import { createContext, useContext, useState, useCallback, useRef } from 'react';
import { eventService } from '../services/eventService';

const EventContext = createContext();
const RAZORPAY_SCRIPT_URL = 'https://checkout.razorpay.com/v1/checkout.js';

function loadRazorpayCheckout() {
  if (window.Razorpay) return Promise.resolve(true);

  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${RAZORPAY_SCRIPT_URL}"]`);
    if (existing) {
      existing.addEventListener('load', () => resolve(true), { once: true });
      existing.addEventListener('error', () => reject(new Error('Unable to load Razorpay checkout')), { once: true });
      return;
    }

    const script = document.createElement('script');
    script.src = RAZORPAY_SCRIPT_URL;
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => reject(new Error('Unable to load Razorpay checkout'));
    document.body.appendChild(script);
  });
}

function openRazorpayCheckout(options) {
  return new Promise((resolve, reject) => {
    const checkout = new window.Razorpay({
      ...options,
      handler: resolve,
      modal: {
        ondismiss: () => reject(new Error('Payment was cancelled')),
      },
    });

    checkout.on('payment.failed', (response) => {
      reject(new Error(response?.error?.description || 'Payment failed'));
    });

    checkout.open();
  });
}

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

export function EventProvider({ children }) {
  const [events, setEvents] = useState([]);
  const [stats, setStats] = useState(DEFAULT_STATS);
  const [myRegistrations, setMyRegistrations] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [recommendationsMeta, setRecommendationsMeta] = useState({ personalized: false, historySize: 0 });
  const [recommendationsLoading, setRecommendationsLoading] = useState(false);
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const eventsRequestId = useRef(0);
  const statsRequestId = useRef(0);
  const statsCache = useRef(DEFAULT_STATS);

  const fetchEvents = useCallback(async (params = {}) => {
    const requestId = eventsRequestId.current + 1;
    eventsRequestId.current = requestId;
    setLoading(true); setError(null);
    try {
      const { data } = await eventService.getAll(params);
      if (requestId !== eventsRequestId.current) return;
      setEvents(data.events);
      setPagination({ total: data.total, page: data.page, pages: data.pages });
    } catch (err) {
      if (requestId !== eventsRequestId.current) return;
      setError(err.response?.data?.message || 'Failed to fetch events');
    } finally {
      if (requestId === eventsRequestId.current) setLoading(false);
    }
  }, []);

  const fetchStats = useCallback(async (params = {}) => {
    const requestId = statsRequestId.current + 1;
    statsRequestId.current = requestId;
    setError(null);
    try {
      const { data } = await eventService.getStats(params);
      if (requestId !== statsRequestId.current) return statsCache.current;
      statsCache.current = data;
      setStats(data);
      return data;
    } catch (err) {
      if (requestId !== statsRequestId.current) return statsCache.current;
      setError(err.response?.data?.message || 'Failed to fetch dashboard stats');
      console.error('Stats error:', err);
      return statsCache.current;
    }
  }, []);

  const createEvent = useCallback(async (data) => {
    const { data: newEvent } = await eventService.create(data);
    setEvents((prev) => [newEvent, ...prev]);
    return newEvent;
  }, []);

  const updateEvent = useCallback(async (id, data) => {
    const { data: updated } = await eventService.update(id, data);
    setEvents((prev) => prev.map((e) => (e._id === id ? updated : e)));
    return updated;
  }, []);

  const deleteEvent = useCallback(async (id) => {
    await eventService.remove(id);
    setEvents((prev) => prev.filter((e) => e._id !== id));
  }, []);

  const fetchMyRegistrations = useCallback(async () => {
    try {
      const { data } = await eventService.getMyRegistrations();
      setMyRegistrations(data);
      return data;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch registrations');
      return [];
    }
  }, []);

  const fetchRecommendations = useCallback(async (params = {}) => {
    setRecommendationsLoading(true);
    try {
      const { data } = await eventService.getRecommendations(params);
      setRecommendations(data.recommendations || []);
      setRecommendationsMeta({
        personalized: Boolean(data.personalized),
        historySize: Number(data.historySize) || 0,
      });
      return data.recommendations || [];
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch recommendations');
      return [];
    } finally {
      setRecommendationsLoading(false);
    }
  }, []);

  const registerForEvent = useCallback(async (eventOrId, notes = '') => {
    const eventId = typeof eventOrId === 'object' ? eventOrId._id : eventOrId;
    const eventPrice = Number(typeof eventOrId === 'object' ? eventOrId.price : 0) || 0;
    let data;

    if (eventPrice > 0) {
      const { data: order } = await eventService.createPaymentOrder(eventId, notes);
      await loadRazorpayCheckout();
      const payment = await openRazorpayCheckout({
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        name: 'EventFlow',
        description: order.event?.title || 'Event registration',
        order_id: order.orderId,
        prefill: {},
        theme: { color: '#6366f1' },
      });
      const verified = await eventService.verifyPayment({
        eventId,
        razorpay_order_id: payment.razorpay_order_id,
        razorpay_payment_id: payment.razorpay_payment_id,
        razorpay_signature: payment.razorpay_signature,
      });
      data = verified.data;
    } else {
      const response = await eventService.register(eventId, notes);
      data = response.data;
    }

    setEvents((prev) => prev.map((event) => (
      event._id === eventId
        ? { ...event, registeredCount: Math.min(event.capacity, event.registeredCount + 1) }
        : event
    )));
    setRecommendations((prev) => prev.filter((event) => event._id !== eventId));
    await fetchMyRegistrations();
    return data;
  }, [fetchMyRegistrations]);

  const cancelEventRegistration = useCallback(async (eventId) => {
    const { data } = await eventService.cancelRegistration(eventId);
    setEvents((prev) => prev.map((event) => (
      event._id === eventId
        ? { ...event, registeredCount: Math.max(0, event.registeredCount - 1) }
        : event
    )));
    setMyRegistrations((prev) => prev.filter((registration) => registration.event?._id !== eventId));
    return data;
  }, []);

  return (
    <EventContext.Provider value={{
      events, stats, myRegistrations, recommendations, recommendationsMeta, recommendationsLoading,
      pagination, loading, error,
      fetchEvents, fetchStats, createEvent, updateEvent, deleteEvent,
      fetchMyRegistrations, fetchRecommendations, registerForEvent, cancelEventRegistration,
    }}>
      {children}
    </EventContext.Provider>
  );
}

export const useEvents = () => useContext(EventContext);
