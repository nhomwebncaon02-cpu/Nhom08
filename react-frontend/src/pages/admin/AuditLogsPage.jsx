import { useCallback, useEffect, useState } from 'react';
import { Alert, Badge, Button, Card, Col, Form, Row, Table } from 'react-bootstrap';
import { adminApi, AUDIT_ACTION_LABELS } from '../../api/adminApi';
import { getErrorMessage } from '../../api/axiosClient';
import PageHeader from '../../components/PageHeader';
import EmptyState from '../../components/EmptyState';
import Loading from '../../components/Loading';
import PaginationBar from '../../components/PaginationBar';
import { formatDateTime } from '../../utils/format';

const LIMIT = 20;
const EMPTY = { action: '', search: '', from: '', to: '' };

/** [Admin] Nhật ký hoạt động: ai đăng nhập, ai bị khoá, admin đã làm gì... */
export default function AuditLogsPage() {
  const [filters, setFilters] = useState(EMPTY);
  const [applied, setApplied] = useState(EMPTY);
  const [page, setPage] = useState(1);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setError('');
    try {
      const params = Object.fromEntries(Object.entries(applied).filter(([, v]) => v));
      setResult(await adminApi.auditLogs({ ...params, page, limit: LIMIT }));
    } catch (e) {
      setError(getErrorMessage(e, 'Không tải được nhật ký'));
      setResult({ items: [], total: 0, page: 1, limit: LIMIT });
    }
  }, [applied, page]);

  useEffect(() => {
    load();
  }, [load]);

  const apply = (e) => {
    e.preventDefault();
    setPage(1);
    setApplied(filters);
  };
  const set = (e) => setFilters({ ...filters, [e.target.name]: e.target.value });

  return (
    <>
      <PageHeader title="Nhật ký hoạt động" icon="fa-clock-rotate-left" subtitle="Ghi lại đăng nhập, đăng ký và mọi thao tác quản trị.">
        <Button variant="outline-secondary" onClick={load}><i className="fa-solid fa-rotate me-1"></i> Làm mới</Button>
      </PageHeader>

      <Card className="border-0 shadow-sm mb-3">
        <Card.Body>
          <Form onSubmit={apply}>
            <Row className="g-2 align-items-end">
              <Col md={3}>
                <Form.Label className="small fw-semibold">Hành động</Form.Label>
                <Form.Select name="action" value={filters.action} onChange={set}>
                  <option value="">Tất cả</option>
                  {Object.entries(AUDIT_ACTION_LABELS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </Form.Select>
              </Col>
              <Col md={3}>
                <Form.Label className="small fw-semibold">Tìm kiếm</Form.Label>
                <Form.Control name="search" value={filters.search} onChange={set} placeholder="Username / nội dung" maxLength={100} />
              </Col>
              <Col xs={6} md={2}>
                <Form.Label className="small fw-semibold">Từ ngày</Form.Label>
                <Form.Control type="date" name="from" value={filters.from} onChange={set} />
              </Col>
              <Col xs={6} md={2}>
                <Form.Label className="small fw-semibold">Đến ngày</Form.Label>
                <Form.Control type="date" name="to" value={filters.to} onChange={set} />
              </Col>
              <Col md={2} className="d-flex gap-2">
                <Button type="submit" variant="admin" className="flex-grow-1">Lọc</Button>
                <Button variant="light" onClick={() => { setFilters(EMPTY); setApplied(EMPTY); setPage(1); }} title="Xoá lọc"><i className="fa-solid fa-xmark"></i></Button>
              </Col>
            </Row>
          </Form>
        </Card.Body>
      </Card>

      {error && <Alert variant="danger">{error}</Alert>}

      <Card className="border-0 shadow-sm">
        {result === null ? (
          <Loading />
        ) : result.items.length === 0 ? (
          <EmptyState icon="fa-clock-rotate-left" title="Không có bản ghi nào" />
        ) : (
          <>
            <Table hover responsive size="sm" className="mb-0 align-middle">
              <thead className="table-light">
                <tr><th>Thời gian</th><th>Người thực hiện</th><th>Hành động</th><th>Chi tiết</th><th>IP</th></tr>
              </thead>
              <tbody>
                {result.items.map((l) => {
                  const a = AUDIT_ACTION_LABELS[l.Action] ?? { label: l.Action, bg: 'secondary' };
                  return (
                    <tr key={l.LogId}>
                      <td className="small text-nowrap">{formatDateTime(l.CreatedAt)}</td>
                      <td className="small fw-semibold">{l.Username ?? '—'}</td>
                      <td><Badge bg={a.bg}>{a.label}</Badge></td>
                      <td className="small text-secondary">{l.Detail ?? '—'}</td>
                      <td className="small font-monospace text-secondary">{l.IpAddress ?? ''}</td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
            <Card.Footer className="bg-white">
              <PaginationBar page={result.page} total={result.total} limit={result.limit} onChange={setPage} />
            </Card.Footer>
          </>
        )}
      </Card>
    </>
  );
}
