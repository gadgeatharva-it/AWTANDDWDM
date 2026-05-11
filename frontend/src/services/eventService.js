import api from './api';

export const eventService = {
  getAll: (params) => api.get('/events', { params }),
  getOne: (id) => api.get(`/events/${id}`),
  create: (data) => api.post('/events', data),
  update: (id, data) => api.put(`/events/${id}`, data),
  remove: (id) => api.delete(`/events/${id}`),
  getStats: (params) => api.get('/events/stats', { params }),

  // Registrations
  register: (eventId, notes) => api.post('/registrations/register', { eventId, notes }),
  cancelRegistration: (eventId) => api.delete(`/registrations/cancel/${eventId}`),
  getMyRegistrations: () => api.get('/registrations/my'),
  getAttendees: (eventId) => api.get(`/registrations/event/${eventId}`),
};
