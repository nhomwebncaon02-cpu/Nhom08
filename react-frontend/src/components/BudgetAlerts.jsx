import { useEffect, useState } from 'react';
import { Alert, Button } from 'react-bootstrap';
import { budgetApi } from '../api/budgetApi';
import { formatVND } from '../utils/format';
import { useDataRefresh } from '../context/DataRefreshContext';

/**
 * [Thành viên 2] Banner cảnh báo ngân sách (Budget Alerts).
 * Truyền `alerts` từ ngoài, hoặc để component tự gọi GET /budgets/alerts.
 */
export default function BudgetAlerts({ alerts: alertsProp, onViewAll }) {
  const { version } = useDataRefresh();
  const [fetched, setFetched] = useState([]);
  const alerts = alertsProp ?? fetched;

  useEffect(() => {
    if (alertsProp) return;
    budgetApi.alerts().then(setFetched).catch(() => setFetched([]));
  }, [alertsProp, version]);

  if (!alerts.length) return null;
  const exceeded = alerts.filter((a) => a.Status === 'exceeded');
  const warning = alerts.filter((a) => a.Status === 'warning');

  return (
    <div className="mb-4">
      {exceeded.length > 0 && (
        <Alert variant="danger" className="mb-2">
          <Alert.Heading as="h6" className="fw-bold">
            <i className="fa-solid fa-circle-exclamation me-2"></i>
            {exceeded.length} ngân sách đã vượt hạn mức
          </Alert.Heading>
          <ul className="mb-0 small ps-3">
            {exceeded.map((b) => (
              <li key={b.BudgetId}>
                <b>{b.CategoryName}</b>: đã chi {formatVND(b.Spent)} / {formatVND(b.AmountLimit)} (vượt {formatVND(b.Spent - b.AmountLimit)})
              </li>
            ))}
          </ul>
        </Alert>
      )}
      {warning.length > 0 && (
        <Alert variant="warning" className="mb-2">
          <Alert.Heading as="h6" className="fw-bold">
            <i className="fa-solid fa-triangle-exclamation me-2"></i>
            {warning.length} ngân sách sắp chạm hạn mức
          </Alert.Heading>
          <ul className="mb-0 small ps-3">
            {warning.map((b) => (
              <li key={b.BudgetId}>
                <b>{b.CategoryName}</b>: đã dùng {b.Percent}% — còn lại {formatVND(b.Remaining)}
              </li>
            ))}
          </ul>
        </Alert>
      )}
      {onViewAll && (
        <Button variant="link" size="sm" className="p-0" onClick={onViewAll}>
          Xem tất cả ngân sách <i className="fa-solid fa-arrow-right ms-1"></i>
        </Button>
      )}
    </div>
  );
}
