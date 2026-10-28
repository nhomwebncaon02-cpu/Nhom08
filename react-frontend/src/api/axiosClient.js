import axios from 'axios';
import { clearSession, getToken } from '../auth/session';

export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const api = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// Tự gắn JWT vào mọi request
api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Token hết hạn / không hợp lệ -> xoá phiên & quay về trang đăng nhập
api.interceptors.response.use(
  (res) => res,
  (error) => {
    const status = error.response?.status;
    const isAuthCall = error.config?.url?.startsWith('/auth/login') || error.config?.url?.startsWith('/auth/register');
    if (status === 401 && !isAuthCall) {
      clearSession();
      if (!window.location.pathname.startsWith('/auth')) {
        window.location.assign('/auth?expired=1');
      }
    }
    return Promise.reject(error);
  },
);

/** Lấy thông báo lỗi dễ đọc từ response của NestJS */
export function getErrorMessage(error, fallback = 'Đã có lỗi xảy ra, vui lòng thử lại.') {
  if (!error.response) return 'Không kết nối được máy chủ. Kiểm tra backend đã chạy chưa.';
  const msg = error.response.data?.message;
  if (Array.isArray(msg)) return msg.join('\n');
  return msg || fallback;
}

export default api;
