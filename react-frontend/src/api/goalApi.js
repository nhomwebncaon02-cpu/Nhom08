import api from './axiosClient';

// [Thành viên 4] Mục tiêu tiết kiệm
export const goalApi = {
  list: () => api.get('/goal').then((r) => r.data),
  create: (data) => api.post('/goal', data).then((r) => r.data),
  update: (id, data) => api.patch(`/goal/${id}`, data).then((r) => r.data),
  remove: (id) => api.delete(`/goal/${id}`).then((r) => r.data),
  /** { AccountId, Amount } — trừ ví, cộng vào mục tiêu */
  deposit: (id, data) => api.post(`/goal/${id}/deposit`, data).then((r) => r.data),
  /** { AccountId, Amount } — rút từ mục tiêu về ví */
  withdraw: (id, data) => api.post(`/goal/${id}/withdraw`, data).then((r) => r.data),
};
