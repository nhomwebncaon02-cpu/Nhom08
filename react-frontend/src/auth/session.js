/**
 * Quản lý phiên đăng nhập phía client.
 *  - Mặc định lưu vào sessionStorage  -> tự mất khi đóng tab/trình duyệt
 *  - Nếu tick "Ghi nhớ đăng nhập"     -> lưu vào localStorage
 *  - Tự kiểm tra hạn token (claim `exp` của JWT) mỗi lần đọc
 */
const KEY = 'SM_SESSION';

const safe = (fn, fallback = null) => {
  try { return fn(); } catch { return fallback; }
};

/** Giải mã phần payload của JWT (không xác minh chữ ký — việc đó do backend làm) */
export function decodeJwt(token) {
  return safe(() => {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const json = decodeURIComponent(
      atob(base64).split('').map((c) => '%' + c.charCodeAt(0).toString(16).padStart(2, '0')).join(''),
    );
    return JSON.parse(json);
  });
}

export function isTokenExpired(token) {
  const payload = decodeJwt(token);
  if (!payload?.exp) return true;
  return payload.exp * 1000 <= Date.now();
}

export function saveSession({ token, user }, remember = false) {
  clearSession();
  const storage = remember ? localStorage : sessionStorage;
  safe(() => storage.setItem(KEY, JSON.stringify({ token, user })));
}

export function getSession() {
  const raw = safe(() => sessionStorage.getItem(KEY)) ?? safe(() => localStorage.getItem(KEY));
  if (!raw) return null;
  const session = safe(() => JSON.parse(raw));
  if (!session?.token || isTokenExpired(session.token)) {
    clearSession();
    return null;
  }
  return session;
}

export function updateSessionUser(user) {
  for (const storage of [sessionStorage, localStorage]) {
    const raw = safe(() => storage.getItem(KEY));
    const s = raw && safe(() => JSON.parse(raw));
    if (s) safe(() => storage.setItem(KEY, JSON.stringify({ ...s, user })));
  }
}

export function getToken() {
  return getSession()?.token ?? null;
}

export function clearSession() {
  safe(() => sessionStorage.removeItem(KEY));
  safe(() => localStorage.removeItem(KEY));
  // dọn key cũ của bản localStorage mock trước đây
  safe(() => localStorage.removeItem('SM_LOGGED_USER'));
}
