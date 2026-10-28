import { useEffect, useState } from 'react';
import { budgetApi } from '../../api/budgetApi';
import { formatVND } from '../../utils/format';

/**
 * Banner cảnh báo ngân sách (Budget Alerts).
 * - Truyền `alerts` từ ngoài vào, hoặc để component tự gọi GET /budgets/alerts.
 */
export default function BudgetAlerts({ alerts: alertsProp, onViewAll, refreshKey }) {
  const [fetched, setFetched] = useState([]);
  const alerts = alertsProp ?? fetched;

  useEffect(() => {
    if (alertsProp) return;
    budgetApi.alerts().then(setFetched).catch(() => setFetched([]));
  }, [alertsProp, refreshKey]);

  if (!alerts.length) return null;

  const exceeded = alerts.filter((a) => a.Status === 'exceeded');
  const warning = alerts.filter((a) => a.Status === 'warning');

  return (
    <div className="space-y-2" role="alert">
      {exceeded.length > 0 && (
        <div className="p-4 rounded-2xl border border-rose-200 bg-rose-50">
          <p className="font-bold text-rose-700 text-sm">
            <i className="fa-solid fa-circle-exclamation mr-1.5"></i>
            {exceeded.length} ngân sách đã vượt hạn mức
          </p>
          <ul className="mt-1.5 text-xs text-rose-700 space-y-0.5">
            {exceeded.map((b) => (
              <li key={b.BudgetId}>
                <b>{b.CategoryName}</b>: đã chi {formatVND(b.Spent)} / {formatVND(b.AmountLimit)} (vượt {formatVND(b.Spent - b.AmountLimit)})
              </li>
            ))}
          </ul>
        </div>
      )}
      {warning.length > 0 && (
        <div className="p-4 rounded-2xl border border-amber-200 bg-amber-50">
          <p className="font-bold text-amber-700 text-sm">
            <i className="fa-solid fa-triangle-exclamation mr-1.5"></i>
            {warning.length} ngân sách sắp chạm hạn mức
          </p>
          <ul className="mt-1.5 text-xs text-amber-700 space-y-0.5">
            {warning.map((b) => (
              <li key={b.BudgetId}>
                <b>{b.CategoryName}</b>: đã dùng {b.Percent}% — còn lại {formatVND(b.Remaining)}
              </li>
            ))}
          </ul>
        </div>
      )}
      {onViewAll && (
        <button type="button" onClick={onViewAll} className="text-xs font-bold text-slate-600 hover:underline">
          Xem tất cả ngân sách →
        </button>
      )}
    </div>
  );
}
