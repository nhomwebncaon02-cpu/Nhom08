import { Pagination } from 'react-bootstrap';

/** Phân trang: hiện tối đa 5 số trang quanh trang hiện tại */
export default function PaginationBar({ page, total, limit, onChange }) {
  const pages = Math.max(1, Math.ceil(total / limit));
  if (total === 0) return null;
  const from = (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);
  const start = Math.max(1, Math.min(page - 2, pages - 4));
  const nums = [];
  for (let p = start; p <= Math.min(pages, start + 4); p++) nums.push(p);

  return (
    <div className="d-flex flex-column flex-sm-row align-items-center justify-content-between gap-2">
      <small className="text-secondary">Hiển thị {from}–{to} / {total}</small>
      {pages > 1 && (
        <Pagination size="sm" className="mb-0">
          <Pagination.First disabled={page === 1} onClick={() => onChange(1)} />
          <Pagination.Prev disabled={page === 1} onClick={() => onChange(page - 1)} />
          {nums.map((p) => (
            <Pagination.Item key={p} active={p === page} onClick={() => onChange(p)}>{p}</Pagination.Item>
          ))}
          <Pagination.Next disabled={page === pages} onClick={() => onChange(page + 1)} />
          <Pagination.Last disabled={page === pages} onClick={() => onChange(pages)} />
        </Pagination>
      )}
    </div>
  );
}
