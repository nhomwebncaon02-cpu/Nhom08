import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Badge, Button, ButtonGroup, Card, Col, Dropdown, Form, InputGroup, Modal, ProgressBar, Row, Spinner } from 'react-bootstrap';
import { budgetApi, BUDGET_STATUS } from '../../api/budgetApi';
import { categoryApi } from '../../api/categoryApi';
import { getErrorMessage } from '../../api/axiosClient';
import { useToast } from '../../context/ToastContext';
import { useDataRefresh } from '../../context/DataRefreshContext';
import PageHeader from '../../components/PageHeader';
import ConfirmDialog from '../../components/ConfirmDialog';
import EmptyState from '../../components/EmptyState';
import Loading from '../../components/Loading';
import BudgetAlerts from '../../components/BudgetAlerts';
import { categoryIcon, formatDate, formatVND, monthRange, todayYMD } from '../../utils/format';

const emptyForm = () => {
  const { start, end } = monthRange(0);
  return { CategoryId: '', AmountLimit: '', StartDate: start, EndDate: end };
};

/**
 * [Thành viên 2] Thiết lập ngân sách + Budget Alerts.
 * Logic chặn vượt hạn mức chạy ở backend (BudgetService.assertWithinBudget) mỗi khi thêm/sửa khoản chi.
 */
export default function BudgetsPage() {
  const toast = useToast();
  const { version, refresh } = useDataRefresh();
  const [budgets, setBudgets] = useState(null);
  const [categories, setCategories] = useState([]);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('active');

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [check, setCheck] = useState({ CategoryId: '', Amount: '', Date: todayYMD() });
  const [checkResult, setCheckResult] = useState(null);
  const [checking, setChecking] = useState(false);

  const expenseCategories = useMemo(() => categories.filter((c) => c.type === 'Expense'), [categories]);

  const load = useCallback(async () => {
    setError('');
    try {
      const [b, c] = await Promise.all([budgetApi.list(), categoryApi.list()]);
      setBudgets(b);
      setCategories(c);
    } catch (e) {
      setError(getErrorMessage(e, 'Không tải được ngân sách'));
      setBudgets([]);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load, version]);

  const list = budgets ?? [];
  const visible = filter === 'active' ? list.filter((b) => b.IsActive) : list;
  const alerts = list.filter((b) => b.IsActive && b.Status !== 'ok');
  const totalLimit = list.filter((b) => b.IsActive).reduce((s, b) => s + b.AmountLimit, 0);
  const totalSpent = list.filter((b) => b.IsActive).reduce((s, b) => s + b.Spent, 0);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm());
    setFormError('');
    setShowForm(true);
  };
  const openEdit = (b) => {
    setEditing(b);
    setForm({ CategoryId: String(b.CategoryId), AmountLimit: String(b.AmountLimit), StartDate: b.StartDate, EndDate: b.EndDate });
    setFormError('');
    setShowForm(true);
  };
  const preset = (offset) => {
    const { start, end } = monthRange(offset);
    setForm((f) => ({ ...f, StartDate: start, EndDate: end }));
  };

  const save = async (e) => {
    e.preventDefault();
    const amount = Number(form.AmountLimit);
    if (!form.CategoryId) return setFormError('Vui lòng chọn danh mục');
    if (!amount || amount < 1000) return setFormError('Hạn mức tối thiểu 1.000đ');
    if (!form.StartDate || !form.EndDate) return setFormError('Vui lòng chọn khoảng thời gian');
    if (form.EndDate < form.StartDate) return setFormError('Ngày kết thúc phải sau ngày bắt đầu');
    setSaving(true);
    setFormError('');
    try {
      const payload = { CategoryId: Number(form.CategoryId), AmountLimit: amount, StartDate: form.StartDate, EndDate: form.EndDate };
      if (editing) await budgetApi.update(editing.BudgetId, payload);
      else await budgetApi.create(payload);
      toast.success(editing ? 'Đã cập nhật ngân sách' : 'Đã thiết lập ngân sách');
      setShowForm(false);
      refresh();
    } catch (err) {
      setFormError(getErrorMessage(err, 'Lưu ngân sách thất bại'));
    } finally {
      setSaving(false);
    }
  };

  const doDelete = async () => {
    setDeleteLoading(true);
    try {
      await budgetApi.remove(deleting.BudgetId);
      toast.success('Đã xoá ngân sách');
      setDeleting(null);
      refresh();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Xoá ngân sách thất bại'));
      setDeleting(null);
    } finally {
      setDeleteLoading(false);
    }
  };

  const doCheck = async (e) => {
    e.preventDefault();
    if (!check.CategoryId || !Number(check.Amount)) {
      setCheckResult({ allowed: false, status: 'invalid', message: 'Chọn danh mục và nhập số tiền cần chi' });
      return;
    }
    setChecking(true);
    try {
      setCheckResult(await budgetApi.check({ CategoryId: Number(check.CategoryId), Amount: Number(check.Amount), Date: check.Date }));
    } catch (err) {
      setCheckResult({ allowed: false, status: 'invalid', message: getErrorMessage(err) });
    } finally {
      setChecking(false);
    }
  };

  const checkVariant = !checkResult ? 'secondary' : !checkResult.allowed ? 'danger' : checkResult.status === 'warning' ? 'warning' : 'success';

  return (
    <>
      <PageHeader title="Hạn mức ngân sách" icon="fa-bullseye" subtitle="Cảnh báo khi dùng ≥ 80% và chặn khoản chi làm vượt hạn mức.">
        <Button variant="danger" onClick={openCreate}><i className="fa-solid fa-plus me-1"></i> Thiết lập ngân sách</Button>
      </PageHeader>

      <BudgetAlerts alerts={alerts} />
      {error && <Alert variant="danger">{error} <Alert.Link onClick={load}>Thử lại</Alert.Link></Alert>}

      {budgets && list.some((b) => b.IsActive) && (
        <Card className="border-0 shadow-sm mb-4">
          <Card.Body>
            <div className="d-flex justify-content-between small mb-2">
              <span className="fw-semibold">Tổng ngân sách đang áp dụng</span>
              <span>{formatVND(totalSpent)} / <b>{formatVND(totalLimit)}</b></span>
            </div>
            <ProgressBar
              now={Math.min(100, totalLimit ? (totalSpent / totalLimit) * 100 : 0)}
              variant={totalSpent > totalLimit ? 'danger' : totalSpent >= totalLimit * 0.8 ? 'warning' : 'success'}
              style={{ height: 12 }}
            />
          </Card.Body>
        </Card>
      )}

      <ButtonGroup size="sm" className="mb-3">
        <Button variant={filter === 'active' ? 'dark' : 'outline-secondary'} onClick={() => setFilter('active')}>Đang áp dụng</Button>
        <Button variant={filter === 'all' ? 'dark' : 'outline-secondary'} onClick={() => setFilter('all')}>Tất cả</Button>
      </ButtonGroup>

      {budgets === null ? (
        <Loading />
      ) : visible.length === 0 ? (
        <Card className="border-0 shadow-sm mb-4">
          <EmptyState icon="fa-bullseye" title={filter === 'active' ? 'Chưa có ngân sách đang áp dụng' : 'Bạn chưa thiết lập ngân sách nào'}>
            <Button variant="danger" onClick={openCreate}>+ Thiết lập ngân sách</Button>
          </EmptyState>
        </Card>
      ) : (
        <Row className="g-3 mb-4">
          {visible.map((b) => {
            const st = BUDGET_STATUS[b.Status];
            return (
              <Col md={6} xl={4} key={b.BudgetId}>
                <Card className={`h-100 shadow-sm ${b.Status === 'exceeded' ? 'border-danger' : 'border-0'}`}>
                  <Card.Body>
                    <div className="d-flex justify-content-between align-items-start mb-3">
                      <div className="d-flex align-items-center gap-3">
                        <span className="sm-stat-icon bg-danger-subtle text-danger"><i className={`fa-solid ${categoryIcon(b.CategoryIcon)}`}></i></span>
                        <div>
                          <div className="fw-bold">{b.CategoryName}</div>
                          <div className="small text-secondary">{formatDate(b.StartDate)} – {formatDate(b.EndDate)}</div>
                        </div>
                      </div>
                      <Dropdown align="end">
                        <Dropdown.Toggle variant="light" size="sm" className="border-0" aria-label="Tuỳ chọn"><i className="fa-solid fa-ellipsis"></i></Dropdown.Toggle>
                        <Dropdown.Menu>
                          <Dropdown.Item onClick={() => openEdit(b)}><i className="fa-solid fa-pen me-2"></i>Sửa</Dropdown.Item>
                          <Dropdown.Item className="text-danger" onClick={() => setDeleting(b)}><i className="fa-solid fa-trash me-2"></i>Xoá</Dropdown.Item>
                        </Dropdown.Menu>
                      </Dropdown>
                    </div>
                    <div className="d-flex justify-content-between small mb-1">
                      <b>{formatVND(b.Spent)}</b>
                      <span className="text-secondary">/ {formatVND(b.AmountLimit)}</span>
                    </div>
                    <ProgressBar now={Math.min(b.Percent, 100)} variant={st.variant} style={{ height: 10 }} className="mb-3" />
                    <div className="d-flex justify-content-between align-items-center small">
                      <Badge bg={st.variant}>{st.label} · {b.Percent}%</Badge>
                      <span className={b.Remaining < 0 ? 'text-danger fw-bold' : 'text-secondary'}>
                        {b.Remaining < 0 ? `Vượt ${formatVND(-b.Remaining)}` : `Còn ${formatVND(b.Remaining)}`}
                      </span>
                    </div>
                    {!b.IsActive && <div className="small text-secondary fst-italic mt-2">Ngoài thời gian áp dụng</div>}
                  </Card.Body>
                </Card>
              </Col>
            );
          })}
        </Row>
      )}

      {/* Kiểm tra trước khi chi — minh hoạ logic chặn vượt hạn mức */}
      <Card className="border-0 shadow-sm">
        <Card.Body>
          <h2 className="h6 fw-bold"><i className="fa-solid fa-shield-halved text-danger me-2"></i>Kiểm tra trước khi chi</h2>
          <p className="small text-secondary">Nhập khoản chi dự định để xem có vượt hạn mức không. Khi thêm giao dịch, backend dùng đúng logic này để chặn.</p>
          <Form onSubmit={doCheck}>
            <Row className="g-2">
              <Col md={4}>
                <Form.Select value={check.CategoryId} onChange={(e) => { setCheck({ ...check, CategoryId: e.target.value }); setCheckResult(null); }} aria-label="Danh mục chi">
                  <option value="">— Danh mục chi —</option>
                  {expenseCategories.map((c) => <option key={c.categoryId} value={c.categoryId}>{c.categoryName}</option>)}
                </Form.Select>
              </Col>
              <Col md={3}>
                <InputGroup>
                  <Form.Control type="number" min="0" step="1000" placeholder="Số tiền" value={check.Amount} onChange={(e) => { setCheck({ ...check, Amount: e.target.value }); setCheckResult(null); }} />
                  <InputGroup.Text>đ</InputGroup.Text>
                </InputGroup>
              </Col>
              <Col md={3}>
                <Form.Control type="date" value={check.Date} onChange={(e) => { setCheck({ ...check, Date: e.target.value }); setCheckResult(null); }} aria-label="Ngày" />
              </Col>
              <Col md={2} className="d-grid">
                <Button type="submit" variant="dark" disabled={checking}>{checking ? <Spinner size="sm" animation="border" /> : 'Kiểm tra'}</Button>
              </Col>
            </Row>
          </Form>
          {checkResult && (
            <Alert variant={checkVariant} className="mt-3 mb-0">
              <b>
                {checkResult.allowed
                  ? checkResult.status === 'warning' ? '⚠️ Được phép, nhưng cần lưu ý' : '✅ Được phép chi'
                  : checkResult.status === 'invalid' ? 'Thiếu thông tin' : '⛔ Bị chặn'}
              </b>
              <div className="small mt-1">{checkResult.message}</div>
            </Alert>
          )}
        </Card.Body>
      </Card>

      <Modal show={showForm} onHide={() => setShowForm(false)} centered>
        <Form onSubmit={save} noValidate>
          <Modal.Header closeButton><Modal.Title as="h5">{editing ? 'Sửa ngân sách' : 'Thiết lập ngân sách'}</Modal.Title></Modal.Header>
          <Modal.Body>
            {formError && <Alert variant="danger" className="py-2 small">{formError}</Alert>}
            <Form.Group className="mb-3">
              <Form.Label className="small fw-semibold">Danh mục chi</Form.Label>
              <Form.Select value={form.CategoryId} onChange={(e) => setForm({ ...form, CategoryId: e.target.value })}>
                <option value="">— Chọn danh mục —</option>
                {expenseCategories.map((c) => <option key={c.categoryId} value={c.categoryId}>{c.categoryName}</option>)}
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label className="small fw-semibold">Hạn mức</Form.Label>
              <InputGroup>
                <Form.Control type="number" min="1000" step="10000" placeholder="VD: 3000000" value={form.AmountLimit} onChange={(e) => setForm({ ...form, AmountLimit: e.target.value })} />
                <InputGroup.Text>VND</InputGroup.Text>
              </InputGroup>
              {Number(form.AmountLimit) > 0 && <Form.Text>= {formatVND(form.AmountLimit)}</Form.Text>}
            </Form.Group>
            <div className="d-flex justify-content-between align-items-center mb-1">
              <Form.Label className="small fw-semibold mb-0">Thời gian áp dụng</Form.Label>
              <ButtonGroup size="sm">
                <Button variant="outline-secondary" onClick={() => preset(0)}>Tháng này</Button>
                <Button variant="outline-secondary" onClick={() => preset(1)}>Tháng sau</Button>
              </ButtonGroup>
            </div>
            <Row className="g-2">
              <Col><Form.Control type="date" value={form.StartDate} onChange={(e) => setForm({ ...form, StartDate: e.target.value })} aria-label="Từ ngày" /></Col>
              <Col><Form.Control type="date" value={form.EndDate} min={form.StartDate} onChange={(e) => setForm({ ...form, EndDate: e.target.value })} aria-label="Đến ngày" /></Col>
            </Row>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="light" onClick={() => setShowForm(false)}>Huỷ</Button>
            <Button type="submit" variant="danger" disabled={saving}>{saving ? <Spinner size="sm" animation="border" /> : editing ? 'Lưu thay đổi' : 'Lưu ngân sách'}</Button>
          </Modal.Footer>
        </Form>
      </Modal>

      <ConfirmDialog
        show={!!deleting}
        title="Xoá ngân sách"
        message={deleting ? `Xoá ngân sách "${deleting.CategoryName}" (${formatDate(deleting.StartDate)} – ${formatDate(deleting.EndDate)})?` : ''}
        loading={deleteLoading}
        onConfirm={doDelete}
        onClose={() => setDeleting(null)}
      />
    </>
  );
}
