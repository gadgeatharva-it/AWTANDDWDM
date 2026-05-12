import api from './api';

export const questionService = {
  ask: (eventId, question) => api.post('/questions', { eventId, question }),
  my: (params) => api.get('/questions/my', { params }),
  inbox: (params) => api.get('/questions/inbox', { params }),
  answer: (id, answer) => api.patch(`/questions/${id}/answer`, { answer }),
};

