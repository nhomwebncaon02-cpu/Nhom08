import api from './axiosClient';

// Quản trị hệ thống (chỉ admin)
export const adminApi = {
  stats: () => api.get('/admin/stats').then((r) => r.data),
  auditLogs: (params) => api.get('/admin/audit-logs', { params }).then((r) => r.data),

  users: (params) => api.get('/users', { params }).then((r) => r.data),
  user: (id) => api.get(`/users/${id}`).then((r) => r.data),
  updateUser: (id, data) => api.put(`/users/${id}`, data).then((r) => r.data),
  setStatus: (id, IsActive) => api.patch(`/users/${id}/status`, { IsActive }).then((r) => r.data),
  resetPassword: (id, newPassword) => api.patch(`/users/${id}/reset-password`, { newPassword }).then((r) => r.data),
  deleteUser: (id) => api.delete(`/users/${id}`).then((r) => r.data),
};

export const AUDIT_ACTION_LABELS = {
  LOGIN_SUCCESS: { label: 'Đăng nhập', bg: 'success' },
  LOGIN_FAILED: { label: 'Đăng nhập sai', bg: 'warning' },
  LOGIN_BLOCKED: { label: 'Bị chặn (đã khoá)', bg: 'danger' },
  REGISTER: { label: 'Đăng ký', bg: 'info' },
  PASSWORD_CHANGE: { label: 'Đổi mật khẩu', bg: 'secondary' },
  USER_UPDATE: { label: 'Sửa người dùng', bg: 'primary' },
  USER_ROLE: { label: 'Đổi vai trò', bg: 'primary' },
  USER_LOCK: { label: 'Khoá tài khoản', bg: 'danger' },
  USER_UNLOCK: { label: 'Mở khoá', bg: 'success' },
  USER_RESET_PASSWORD: { label: 'Đặt lại mật khẩu', bg: 'warning' },
  USER_DELETE: { label: 'Xoá người dùng', bg: 'danger' },
  CATEGORY_CREATE: { label: 'Tạo danh mục', bg: 'info' },
  CATEGORY_UPDATE: { label: 'Sửa danh mục', bg: 'info' },
  CATEGORY_DELETE: { label: 'Xoá danh mục', bg: 'dark' },
};
