import { Card } from 'react-bootstrap';

/** Thẻ số liệu: icon + nhãn + giá trị (+ dòng phụ) */
export default function StatCard({ label, value, icon, color = 'success', sub, valueClass = '' }) {
  return (
    <Card className="h-100 shadow-sm border-0 sm-hover-lift">
      <Card.Body className="d-flex align-items-start gap-3">
        <span className={`sm-stat-icon bg-${color}-subtle text-${color}`}>
          <i className={`fa-solid ${icon}`}></i>
        </span>
        <div className="min-w-0">
          <div className="text-secondary small fw-semibold text-uppercase">{label}</div>
          <div className={`sm-stat-value ${valueClass}`}>{value}</div>
          {sub && <div className="small text-secondary mt-1">{sub}</div>}
        </div>
      </Card.Body>
    </Card>
  );
}
