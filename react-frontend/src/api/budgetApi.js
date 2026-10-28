import api from './axiosClient';

export const budgetApi = {
  list: () => api.get('/budgets').then((r) => r.data),
  alerts: () => api.get('/budgets/alerts').then((r) => r.data),
  create: (data) => api.post('/budgets', data).then((r) => r.data),
  update: (id, data) => api.patch(`/budgets/${id}`, data).then((r) => r.data),
  remove: (id) => api.delete(`/budgets/${id}`).then((r) => r.data),
  /** Kiểm tra 1 khoản chi có vượt hạn mức không: { CategoryId, Amount, Date? } */
  check: (data) => api.post('/budgets/check', data).then((r) => r.data),
};

export const categoryApi = {
  list: () => api.get('/categories').then((r) => r.data),
};

/** Màu theo trạng thái ngân sách */
export const BUDGET_STATUS = {
  ok: { label: 'An toàn', bar: 'bg-emerald-500', badge: 'bg-emerald-100 text-emerald-700' },
  warning: { label: 'Sắp chạm hạn mức', bar: 'bg-amber-500', badge: 'bg-amber-100 text-amber-700' },
  exceeded: { label: 'Vượt hạn mức', bar: 'bg-rose-600', badge: 'bg-rose-100 text-rose-700' },
};
