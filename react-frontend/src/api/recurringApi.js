import api from './axiosClient';

// Giao dịch định kỳ (mở rộng)
export const recurringApi = {
  list: () => api.get('/recurring').then((r) => r.data),
  create: (data) => api.post('/recurring', data).then((r) => r.data),
  update: (id, data) => api.patch(`/recurring/${id}`, data).then((r) => r.data),
  remove: (id) => api.delete(`/recurring/${id}`).then((r) => r.data),
  /** Tạo các giao dịch đã đến hạn */
  process: () => api.post('/recurring/process').then((r) => r.data),
};

export const FREQUENCIES = [
  { value: 'daily', label: 'Hằng ngày' },
  { value: 'weekly', label: 'Hằng tuần' },
  { value: 'monthly', label: 'Hằng tháng' },
  { value: 'yearly', label: 'Hằng năm' },
];
export const frequencyLabel = (v) => FREQUENCIES.find((f) => f.value === v)?.label ?? v;
