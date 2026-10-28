import api from './axiosClient';

export const transactionApi = {
  list: (filters = {}) => api.get('/transactions', { params: filters }).then((r) => r.data),
  get: (id) => api.get(`/transactions/${id}`).then((r) => r.data),
  create: (data) => api.post('/transactions', data).then((r) => r.data),
  update: (id, data) => api.patch(`/transactions/${id}`, data).then((r) => r.data),
  remove: (id) => api.delete(`/transactions/${id}`).then((r) => r.data),
};
