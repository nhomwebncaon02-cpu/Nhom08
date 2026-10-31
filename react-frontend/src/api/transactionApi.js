import api from './axiosClient';

// [Thành viên 3] Giao dịch — lọc bằng QueryBuilder ở backend
export const transactionApi = {
  /** filters: { AccountId, CategoryId, Type, FromDate, ToDate, Search, Page, Limit }
   *  Có Page -> trả { items, total, page, limit }; không có -> trả mảng */
  list: (filters = {}) => api.get('/transactions', { params: filters }).then((r) => r.data),
  get: (id) => api.get(`/transactions/${id}`).then((r) => r.data),
  create: (data) => api.post('/transactions', data).then((r) => r.data),
  update: (id, data) => api.patch(`/transactions/${id}`, data).then((r) => r.data),
  remove: (id) => api.delete(`/transactions/${id}`).then((r) => r.data),
};
