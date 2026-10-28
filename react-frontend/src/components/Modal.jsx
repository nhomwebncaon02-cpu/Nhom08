import { useEffect } from 'react';

/** Hộp thoại đơn giản: đóng bằng nút X, phím Esc hoặc bấm ra ngoài */
export default function Modal({ open, title, onClose, children }) {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div
      className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div role="dialog" aria-modal="true" className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-lg text-slate-800">{title}</h3>
          <button type="button" onClick={onClose} aria-label="Đóng" className="text-slate-400 hover:text-slate-700 p-1">
            <i className="fa-solid fa-xmark text-lg"></i>
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
