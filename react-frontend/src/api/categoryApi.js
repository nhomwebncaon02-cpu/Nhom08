import api from './axiosClient';

// [Thành viên 3] Danh mục thu/chi
export const categoryApi = {
  list: () => api.get('/categories').then((r) => r.data),
  /** [Admin] danh mục hệ thống + số lần sử dụng */
  system: () => api.get('/categories/system').then((r) => r.data),
  create: (data) => api.post('/categories', data).then((r) => r.data),
  update: (id, data) => api.patch(`/categories/${id}`, data).then((r) => r.data),
  remove: (id) => api.delete(`/categories/${id}`).then((r) => r.data),
};
