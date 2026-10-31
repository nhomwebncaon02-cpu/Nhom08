import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { Toast, ToastContainer } from 'react-bootstrap';

const ToastContext = createContext(null);
let nextId = 1;

const STYLES = {
  success: { bg: 'success', icon: 'fa-circle-check', title: 'Thành công' },
  danger: { bg: 'danger', icon: 'fa-circle-exclamation', title: 'Có lỗi' },
  warning: { bg: 'warning', icon: 'fa-triangle-exclamation', title: 'Lưu ý' },
  info: { bg: 'info', icon: 'fa-circle-info', title: 'Thông báo' },
};

/** Thông báo góc màn hình (thay cho alert()). Dùng: const toast = useToast(); toast.success('...') */
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const remove = useCallback((id) => setToasts((t) => t.filter((x) => x.id !== id)), []);
  const push = useCallback((type, message) => {
    const id = nextId++;
    setToasts((t) => [...t.slice(-3), { id, type, message }]);
  }, []);

  const api = useMemo(
    () => ({
      success: (m) => push('success', m),
      error: (m) => push('danger', m),
      warning: (m) => push('warning', m),
      info: (m) => push('info', m),
    }),
    [push],
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <ToastContainer position="top-end" className="p-3 position-fixed" style={{ zIndex: 2000 }}>
        {toasts.map((t) => {
          const s = STYLES[t.type];
          return (
            <Toast key={t.id} onClose={() => remove(t.id)} delay={t.type === 'danger' ? 6000 : 3500} autohide>
              <Toast.Header>
                <i className={`fa-solid ${s.icon} text-${s.bg} me-2`}></i>
                <strong className="me-auto">{s.title}</strong>
              </Toast.Header>
              <Toast.Body style={{ whiteSpace: 'pre-line' }}>{t.message}</Toast.Body>
            </Toast>
          );
        })}
      </ToastContainer>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast phải nằm trong <ToastProvider>');
  return ctx;
}
