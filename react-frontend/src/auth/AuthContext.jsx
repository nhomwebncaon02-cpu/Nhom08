import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import api from '../api/axiosClient';
import { clearSession, getSession, saveSession, updateSessionUser } from './session';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => getSession()?.user ?? null);
  const [checking, setChecking] = useState(() => !!getSession());

  // Khi tải lại trang: xác minh token với backend (GET /auth/me)
  useEffect(() => {
    if (!getSession()) return;
    api
      .get('/auth/me')
      .then((res) => {
        setUser(res.data);
        updateSessionUser(res.data);
      })
      .catch(() => {
        clearSession();
        setUser(null);
      })
      .finally(() => setChecking(false));
  }, []);

  const login = useCallback(async ({ username, password, remember }) => {
    const { data } = await api.post('/auth/login', { username, password });
    saveSession({ token: data.access_token, user: data.user }, remember);
    setUser(data.user);
    return data.user;
  }, []);

  const register = useCallback(async ({ fullName, username, email, password }) => {
    const { data } = await api.post('/auth/register', { fullName, username, email, password });
    return data;
  }, []);

  /** Cập nhật thông tin user đang đăng nhập (sau khi sửa hồ sơ) */
  const updateUser = useCallback((patch) => {
    setUser((u) => {
      const next = { ...u, ...patch };
      updateSessionUser(next);
      return next;
    });
  }, []);

  const logout = useCallback(() => {
    clearSession();
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, isAuthenticated: !!user, checking, login, register, logout, updateUser }),
    [user, checking, login, register, logout, updateUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth phải được dùng bên trong <AuthProvider>');
  return ctx;
}

export const homePathFor = (user) => (user?.Role === 'admin' ? '/admin' : '/user');
