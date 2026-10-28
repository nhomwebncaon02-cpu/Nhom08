import Modal from './Modal';

export default function ConfirmDialog({ open, title, message, confirmText = 'Xoá', loading, onConfirm, onClose }) {
  return (
    <Modal open={open} title={title} onClose={onClose}>
      <p className="text-sm text-slate-600 whitespace-pre-line">{message}</p>
      <div className="flex gap-2 pt-5">
        <button type="button" onClick={onClose} className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 rounded-xl font-bold text-sm">Huỷ</button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={loading}
          className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-60 text-white rounded-xl font-bold text-sm"
        >
          {loading ? <i className="fa-solid fa-spinner fa-spin"></i> : confirmText}
        </button>
      </div>
    </Modal>
  );
}
