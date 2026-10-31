/** Hiển thị khi danh sách trống */
export default function EmptyState({ icon = 'fa-inbox', title, text, children }) {
  return (
    <div className="text-center py-5 px-3">
      <div className="d-inline-flex align-items-center justify-content-center rounded-circle bg-light mb-3" style={{ width: 72, height: 72 }}>
        <i className={`fa-solid ${icon} fs-2 text-secondary`}></i>
      </div>
      <h5 className="fw-bold">{title}</h5>
      {text && <p className="text-secondary mb-3">{text}</p>}
      {children}
    </div>
  );
}
