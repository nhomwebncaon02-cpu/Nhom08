import api from './axiosClient';

// [Thành viên 4] Thống kê cho trang Tổng quan
export const dashboardApi = {
  summary: () => api.get('/dashboard/summary').then((r) => r.data),
  monthly: (months = 6) => api.get('/dashboard/monthly', { params: { months } }).then((r) => r.data),
  byCategory: (month) => api.get('/dashboard/by-category', { params: month ? { month } : {} }).then((r) => r.data),
  recent: () => api.get('/dashboard/recent').then((r) => r.data),
};
