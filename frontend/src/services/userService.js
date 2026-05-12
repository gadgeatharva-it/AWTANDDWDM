import api from './api';

export const userService = {
  list: (params) => api.get('/users', { params }),
  setActive: (id, active) => api.patch(`/users/${id}/active`, { active }),
};

