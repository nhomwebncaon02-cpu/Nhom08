import { useCallback, useEffect, useState } from 'react';
import { Alert, Badge, Button, Card, Col, Form, InputGroup, Row, Table } from 'react-bootstrap';
import { transactionApi } from '../../api/transactionApi';
import { walletApi } from '../../api/walletApi';
import { categoryApi } from '../../api/categoryApi';
import { getErrorMessage } from '../../api/axiosClient';
import { useToast } from '../../context/ToastContext';
import { useDataRefresh } from '../../context/DataRefreshContext';
import PageHeader from '../../components/PageHeader';
import ConfirmDialog from '../../components/ConfirmDialog';
import EmptyState from '../../components/EmptyState';
import Loading from '../../components/Loading';
import PaginationBar from '../../components/PaginationBar';
import TransactionFormModal from '../../components/TransactionFormModal';
import { categoryIcon, dateOnly, formatDate, formatMoney, monthRange } from '../../utils/format';
import { downloadCsv } from '../../utils/csv';

const LIMIT = 10;
const EMPTY_FILTERS = { AccountId: '', Type: '', CategoryId: '', FromDate: '', ToDate: '', Search: '' };

/** Bỏ các bộ lọc rỗng trước khi gửi lên API */
const clean = (f) => Object.fromEntries(Object.entries(f).filter(([, v]) => v !== '' && v !== null && v !== undefined));

/**
 * [Thành viên 3] UI Sổ giao dịch: lọc (QueryBuilder phía server), phân trang, thêm / sửa / xoá, xuất CSV.
 * Lỗi token (401) đã được axiosClient chặn và tự đăng xuất.
 */
export default function TransactionsPage() {
  const toast = useToast();
  const { version, refresh } = useDataRefresh();
  const [wallets, setWallets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [applied, setApplied] = useState(EMPTY_FILTERS);
  const [page, setPage] = useState(1);
  const [result, setResult] = useState(null); // { items, total, page, limit }
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    Promise.all([walletApi.list(), categoryApi.list()])
      .then(([w, c]) => {
        setWallets(w);
        setCategories(c);
      })
      .catch((e) => setError(getErrorMessage(e)));
  }, [version]);

  const load = useCallback(async () => {
    setError('');
    try {
      setResult(await transactionApi.list({ ...clean(applied), Page: page, Limit: LIMIT }));
    } catch (e) {
      setError(getErrorMessage(e, 'Không thể tải giao dịch'));
      setResult({ items: [], total: 0, page: 1, limit: LIMIT });
    }
  }, [applied, page]);

  useEffect(() => {
    load();
  }, [load, version]);

  const updateFilter = (e) => setFilters((f) => ({ ...f, [e.target.name]: e.target.value }));
  const applyFilters = (e) => {
    e?.preventDefault();
    if (filters.FromDate && filters.ToDate && filters.FromDate > filters.ToDate) {
      toast.warning('Ngày bắt đầu phải trước ngày kết thúc');
      return;
    }
    setPage(1);
    setApplied(filters);
  };
  const resetFilters = () => {
    setFilters(EMPTY_FILTERS);
    setApplied(EMPTY_FILTERS);
    setPage(1);
  };
  const thisMonth = () => {
    const { start, end } = monthRange(0);
    const next = { ...filters, FromDate: start, ToDate: end };
    setFilters(next);
    setApplied(next);
    setPage(1);
  };

  const doDelete = async () => {
    setDeleteLoading(true);
    try {
      await transactionApi.remove(deleting.TransactionId);
      toast.success('Đã xoá giao dịch, số dư ví đã được hoàn lại');
      setDeleting(null);
      refresh();
    } catch (e) {
      toast.error(getErrorMessage(e, 'Không thể xoá giao dịch'));
      setDeleting(null);
    } finally {
      setDeleteLoading(false);
    }
  };

  const exportCsv = async () => {
    setExporting(true);
    try {
      const all = await transactionApi.list(clean(applied)); // không truyền Page -> lấy toàn bộ theo bộ lọc
      downloadCsv(`giao-dich-${dateOnly(new Date())}.csv`, [
        { label: 'Mã GD', value: (t) => t.TransactionId },
        { label: 'Ngày', value: (t) => formatDate(dateOnly(t.TransactionDate)) },
        { label: 'Loại', value: (t) => (t.category?.type === 'Income' ? 'Thu' : 'Chi') },
        { label: 'Danh mục', value: (t) => t.category?.categoryName },
        { label: 'Ví', value: (t) => t.account?.AccountName },
        { label: 'Số tiền', value: (t) => (t.category?.type === 'Income' ? 1 : -1) * Number(t.Amount) },
        { label: 'Tiền tệ', value: (t) => t.account?.Currency || 'VND' },
        { label: 'Ghi chú', value: (t) => t.Note ?? '' },
      ], all);
      toast.success(`Đã xuất ${all.length} giao dịch ra file CSV`);
    } catch (e) {
      toast.error(getErrorMessage(e, 'Xuất CSV thất bại'));
    } finally {
      setExporting(false);
    }
  };

  const filterCategories = categories.filter((c) => !filters.Type || c.type === filters.Type);
  const hasFilter = Object.values(applied).some((v) => v !== '');

  return (
    <>
      <PageHeader title="Sổ giao dịch" icon="fa-receipt" subtitle="Ghi chép, tìm kiếm và lọc mọi khoản thu chi.">
        <Button variant="outline-secondary" onClick={exportCsv} disabled={exporting || !result?.total}>
          <i className="fa-solid fa-file-csv me-1"></i> {exporting ? 'Đang xuất...' : 'Xuất CSV'}
        </Button>
        <Button variant="success" onClick={() => { setEditing(null); setShowForm(true); }} disabled={!wallets.length}>
          <i className="fa-solid fa-plus me-1"></i> Thêm giao dịch
        </Button>
      </PageHeader>

      {!wallets.length && result && (
        <Alert variant="info">Bạn cần tạo ít nhất một ví trước khi thêm giao dịch.</Alert>
      )}

      <Card className="border-0 shadow-sm mb-3">
        <Card.Body>
          <Form onSubmit={applyFilters}>
            <Row className="g-2 align-items-end">
              <Col md={6} lg={3}>
                <Form.Label className="small fw-semibold">Tìm theo ghi chú</Form.Label>
                <InputGroup>
                  <InputGroup.Text><i className="fa-solid fa-magnifying-glass"></i></InputGroup.Text>
                  <Form.Control name="Search" value={filters.Search} onChange={updateFilter} placeholder="VD: ăn trưa" maxLength={100} />
                </InputGroup>
              </Col>
              <Col sm={6} md={3} lg={2}>
                <Form.Label className="small fw-semibold">Ví</Form.Label>
                <Form.Select name="AccountId" value={filters.AccountId} onChange={updateFilter}>
                  <option value="">Tất cả ví</option>
                  {wallets.map((w) => <option key={w.AccountId} value={w.AccountId}>{w.AccountName}</option>)}
                </Form.Select>
              </Col>
              <Col sm={6} md={3} lg={1}>
                <Form.Label className="small fw-semibold">Loại</Form.Label>
                <Form.Select name="Type" value={filters.Type} onChange={(e) => setFilters((f) => ({ ...f, Type: e.target.value, CategoryId: '' }))}>
                  <option value="">Tất cả</option>
                  <option value="Income">Thu</option>
                  <option value="Expense">Chi</option>
                </Form.Select>
              </Col>
              <Col sm={6} md={4} lg={2}>
                <Form.Label className="small fw-semibold">Danh mục</Form.Label>
                <Form.Select name="CategoryId" value={filters.CategoryId} onChange={updateFilter}>
                  <option value="">Tất cả danh mục</option>
                  {filterCategories.map((c) => <option key={c.categoryId} value={c.categoryId}>{c.categoryName}</option>)}
                </Form.Select>
              </Col>
              <Col xs={6} md={4} lg={2}>
                <Form.Label className="small fw-semibold">Từ ngày</Form.Label>
                <Form.Control type="date" name="FromDate" value={filters.FromDate} onChange={updateFilter} />
              </Col>
              <Col xs={6} md={4} lg={2}>
                <Form.Label className="small fw-semibold">Đến ngày</Form.Label>
                <Form.Control type="date" name="ToDate" value={filters.ToDate} onChange={updateFilter} />
              </Col>
            </Row>
            <div className="d-flex flex-wrap gap-2 mt-3">
              <Button type="submit" variant="dark" size="sm"><i className="fa-solid fa-filter me-1"></i>Lọc</Button>
              <Button variant="outline-secondary" size="sm" onClick={thisMonth}>Tháng này</Button>
              {hasFilter && <Button variant="link" size="sm" onClick={resetFilters}>Xoá bộ lọc</Button>}
            </div>
          </Form>
        </Card.Body>
      </Card>

      {error && <Alert variant="danger">{error}</Alert>}

      <Card className="border-0 shadow-sm">
        {result === null ? (
          <Loading />
        ) : result.items.length === 0 ? (
          <EmptyState
            icon="fa-receipt"
            title={hasFilter ? 'Không có giao dịch phù hợp' : 'Chưa có giao dịch nào'}
            text={hasFilter ? 'Thử đổi hoặc xoá bộ lọc.' : 'Bấm "Thêm giao dịch" hoặc nút + ở góc màn hình.'}
          />
        ) : (
          <>
            <Table hover responsive className="mb-0 align-middle">
              <thead className="table-light">
                <tr>
                  <th>Ngày</th>
                  <th>Danh mục</th>
                  <th>Ghi chú</th>
                  <th>Ví</th>
                  <th className="text-end">Số tiền</th>
                  <th className="text-end" style={{ width: 110 }}></th>
                </tr>
              </thead>
              <tbody>
                {result.items.map((t) => {
                  const income = t.category?.type === 'Income';
                  return (
                    <tr key={t.TransactionId}>
                      <td className="text-nowrap small">{formatDate(dateOnly(t.TransactionDate))}</td>
                      <td>
                        <Badge bg={income ? 'success-subtle' : 'danger-subtle'} text={income ? 'success' : 'danger'} className="fw-semibold">
                          <i className={`fa-solid ${categoryIcon(t.category?.icon)} me-1`}></i>{t.category?.categoryName}
                        </Badge>
                      </td>
                      <td className="small text-secondary">{t.Note || '—'}</td>
                      <td className="small">{t.account?.AccountName}</td>
                      <td className={`text-end fw-bold text-nowrap ${income ? 'text-success' : 'text-danger'}`}>
                        {income ? '+' : '−'}{formatMoney(t.Amount, t.account?.Currency || 'VND')}
                      </td>
                      <td className="text-end text-nowrap">
                        <Button variant="link" size="sm" className="text-secondary" title="Sửa" onClick={() => { setEditing(t); setShowForm(true); }}>
                          <i className="fa-solid fa-pen"></i>
                        </Button>
                        <Button variant="link" size="sm" className="text-danger" title="Xoá" onClick={() => setDeleting(t)}>
                          <i className="fa-solid fa-trash"></i>
                        </Button>
                      </td>
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

      <TransactionFormModal
        show={showForm}
        onHide={() => setShowForm(false)}
        transaction={editing}
        wallets={wallets}
        categories={categories}
        onSaved={(msg) => { toast.success(msg); refresh(); }}
      />

      <ConfirmDialog
        show={!!deleting}
        title="Xoá giao dịch"
        message={deleting ? `Xoá giao dịch ${formatMoney(deleting.Amount, deleting.account?.Currency || 'VND')} (${deleting.category?.categoryName})?\nSố dư ví sẽ được hoàn lại tương ứng.` : ''}
        loading={deleteLoading}
        onConfirm={doDelete}
        onClose={() => setDeleting(null)}
      />
    </>
  );
}
