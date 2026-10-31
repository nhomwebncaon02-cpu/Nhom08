/** Tiêu đề trang + mô tả + các nút hành động bên phải */
export default function PageHeader({ title, subtitle, icon, children }) {
  return (
    <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3 mb-4">
      <div>
        <h1 className="h3 fw-800 mb-1">
          {icon && <i className={`fa-solid ${icon} me-2 opacity-75`}></i>}
          {title}
        </h1>
        {subtitle && <p className="text-secondary mb-0">{subtitle}</p>}
      </div>
      {children && <div className="d-flex flex-wrap gap-2">{children}</div>}
    </div>
  );
}
