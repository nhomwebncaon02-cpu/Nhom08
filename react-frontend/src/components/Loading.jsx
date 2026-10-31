import { Spinner } from 'react-bootstrap';

export default function Loading({ text = 'Đang tải dữ liệu...', className = 'py-5' }) {
  return (
    <div className={`text-center text-secondary ${className}`}>
      <Spinner animation="border" variant="success" size="sm" className="me-2" />
      {text}
    </div>
  );
}
