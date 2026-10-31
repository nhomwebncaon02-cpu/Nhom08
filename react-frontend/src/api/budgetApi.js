import api from './axiosClient';

// [Thành viên 2] Ngân sách + cảnh báo / chặn vượt hạn mức
export const budgetApi = {
  list: () => api.get('/budgets').then((r) => r.data),
  alerts: () => api.get('/budgets/alerts').then((r) => r.data),
  create: (data) => api.post('/budgets', data).then((r) => r.data),
  update: (id, data) => api.patch(`/budgets/${id}`, data).then((r) => r.data),
  remove: (id) => api.delete(`/budgets/${id}`).then((r) => r.data),
  /** Kiểm tra 1 khoản chi có vượt hạn mức không: { CategoryId, Amount, Date? } */
  check: (data) => api.post('/budgets/check', data).then((r) => r.data),
};

/** Màu (variant Bootstrap) theo trạng thái ngân sách */
export const BUDGET_STATUS = {
  ok: { label: 'An toàn', variant: 'success' },
  warning: { label: 'Sắp chạm hạn mức', variant: 'warning' },
  exceeded: { label: 'Vượt hạn mức', variant: 'danger' },
};
