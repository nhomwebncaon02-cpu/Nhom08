import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Badge, Button, ButtonGroup, Card, Col, Form, InputGroup, Modal, Row, Spinner, Table } from 'react-bootstrap';
import { recurringApi, FREQUENCIES, frequencyLabel } from '../../api/recurringApi';
import { walletApi } from '../../api/walletApi';
import { categoryApi } from '../../api/categoryApi';
import { getErrorMessage } from '../../api/axiosClient';
import { useToast } from '../../context/ToastContext';
import { useDataRefresh } from '../../context/DataRefreshContext';
import PageHeader from '../../components/PageHeader';
import ConfirmDialog from '../../components/ConfirmDialog';
import EmptyState from '../../components/EmptyState';
import Loading from '../../components/Loading';
import { categoryIcon, formatDate, formatVND, todayYMD } from '../../utils/format';

const emptyForm = () => ({ type: 'Expense', AccountId: '', CategoryId: '', Amount: '', Frequency: 'monthly', NextDate: todayYMD(), Note: '' });

/** Giao dịch định kỳ: tiền nhà, lương, điện nước... tự ghi vào sổ khi đến hạn */
export default function RecurringPage() {
  const toast = useToast();
  const { version, refresh } = useDataRefresh();
  const [rules, setRules] = useState(null);
  const [wallets, setWallets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [running, setRunning] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const load = useCallback(async () => {
    setError('');
    try {
      const [r, w, c] = await Promise.all([recurringApi.list(), walletApi.list(), categoryApi.list()]);
      setRules(r);
      setWallets(w);
      setCategories(c);
    } catch (e) {
      setError(getErrorMessage(e, 'Không tải được giao dịch định kỳ'));
      setRules([]);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load, version]);

  const typeCategories = useMemo(() => categories.filter((c) => c.type === form.type), [categories, form.type]);

  const openCreate = () => {
    setEditing(null);
    setForm({ ...emptyForm(), AccountId: String(wallets[0]?.AccountId ?? '') });
    setFormError('');
    setShowForm(true);
  };
  const openEdit = (r) => {
    setEditing(r);
    setForm({
      type: r.category?.type ?? 'Expense',
      AccountId: String(r.AccountId),
      CategoryId: String(r.CategoryId),
      Amount: String(r.Amount),
      Frequency: r.Frequency,
      NextDate: String(r.NextDate).slice(0, 10),
      Note: r.Note ?? '',
    });
    setFormError('');
    setShowForm(true);
  };

  const save = async (e) => {
    e.preventDefault();
    const amount = Number(form.Amount);
    if (!form.AccountId || !form.CategoryId) return setFormError('Chọn ví và danh mục');
    if (!amount || amount <= 0) return setFormError('Số tiền phải lớn hơn 0');
    setSaving(true);
    setFormError('');
    try {
      const payload = {
        AccountId: Number(form.AccountId),
        CategoryId: Number(form.CategoryId),
        Amount: amount,
        Frequency: form.Frequency,
        NextDate: form.NextDate,
        Note: form.Note.trim() || undefined,
      };
      if (editing) await recurringApi.update(editing.RecurringId, payload);
      else await recurringApi.create(payload);
      toast.success(editing ? 'Đã cập nhật' : 'Đã tạo giao dịch định kỳ');
      setShowForm(false);
      refresh();
    } catch (err) {
      setFormError(getErrorMessage(err, 'Lưu thất bại'));
    } finally {
      setSaving(false);
    }
  };

  const toggle = async (r) => {
    try {
      await recurringApi.update(r.RecurringId, { IsActive: !r.IsActive });
      toast.success(r.IsActive ? 'Đã tạm dừng' : 'Đã bật lại');
      refresh();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const runNow = async () => {
    setRunning(true);
    try {
      const res = await recurringApi.process();
      if (res.created) toast.success(`Đã tạo ${res.created} giao dịch đến hạn`);
      else toast.info('Chưa có giao dịch nào đến hạn');
      if (res.skipped?.length) toast.warning(res.skipped.map((s) => `${formatDate(s.date)}: ${s.reason}`).join('\n'));
      refresh();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setRunning(false);
    }
  };

  const doDelete = async () => {
    setDeleteLoading(true);
    try {
      await recurringApi.remove(deleting.RecurringId);
      toast.success('Đã xoá');
      setDeleting(null);
      refresh();
    } catch (err) {
      toast.error(getErrorMessage(err));
      setDeleting(null);
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <>
      <PageHeader title="Giao dịch định kỳ" icon="fa-rotate" subtitle="Tự động ghi các khoản lặp lại như tiền nhà, lương, điện nước khi đến hạn.">
        <Button variant="outline-secondary" onClick={runNow} disabled={running}>
          {running ? <Spinner size="sm" animation="border" /> : <><i className="fa-solid fa-play me-1"></i> Chạy ngay</>}
        </Button>
        <Button variant="success" onClick={openCreate} disabled={!wallets.length}><i className="fa-solid fa-plus me-1"></i> Thêm</Button>
      </PageHeader>

      <Alert variant="light" className="border small">
        <i className="fa-solid fa-circle-info text-primary me-2"></i>
        Hệ thống tự kiểm tra mỗi lần bạn mở trang Tổng quan. Khoản chi làm vượt hạn mức ngân sách sẽ bị bỏ qua và báo lại cho bạn.
      </Alert>
      {error && <Alert variant="danger">{error}</Alert>}

      <Card className="border-0 shadow-sm">
        {rules === null ? (
          <Loading />
        ) : rules.length === 0 ? (
          <EmptyState icon="fa-rotate" title="Chưa có giao dịch định kỳ" text="VD: Tiền nhà 3.500.000đ mỗi tháng vào ngày 5.">
            <Button variant="success" onClick={openCreate} disabled={!wallets.length}>+ Thêm giao dịch định kỳ</Button>
          </EmptyState>
        ) : (
          <Table hover responsive className="mb-0 align-middle">
            <thead className="table-light">
              <tr>
                <th>Danh mục</th><th>Ghi chú</th><th>Ví</th><th>Chu kỳ</th><th>Lần tới</th>
                <th className="text-end">Số tiền</th><th className="text-center">Bật</th><th></th>
              </tr>
            </thead>
            <tbody>
              {rules.map((r) => {
                const income = r.category?.type === 'Income';
                return (
                  <tr key={r.RecurringId} className={r.IsActive ? '' : 'opacity-50'}>
                    <td><i className={`fa-solid ${categoryIcon(r.category?.icon)} me-2 text-${income ? 'success' : 'danger'}`}></i>{r.category?.categoryName}</td>
                    <td className="small text-secondary">{r.Note || '—'}</td>
                    <td className="small">{r.account?.AccountName}</td>
                    <td><Badge bg="light" text="dark">{frequencyLabel(r.Frequency)}</Badge></td>
                    <td className="small text-nowrap">{formatDate(String(r.NextDate).slice(0, 10))}</td>
                    <td className={`text-end fw-bold text-nowrap ${income ? 'text-success' : 'text-danger'}`}>{income ? '+' : '−'}{formatVND(r.Amount)}</td>
                    <td className="text-center">
                      <Form.Check type="switch" id={`rec-${r.RecurringId}`} checked={!!r.IsActive} onChange={() => toggle(r)} aria-label="Bật / tạm dừng" />
                    </td>
                    <td className="text-end text-nowrap">
                      <Button variant="link" size="sm" className="text-secondary" onClick={() => openEdit(r)} title="Sửa"><i className="fa-solid fa-pen"></i></Button>
                      <Button variant="link" size="sm" className="text-danger" onClick={() => setDeleting(r)} title="Xoá"><i className="fa-solid fa-trash"></i></Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        )}
      </Card>

      <Modal show={showForm} onHide={() => setShowForm(false)} centered>
        <Form onSubmit={save} noValidate>
          <Modal.Header closeButton><Modal.Title as="h5">{editing ? 'Sửa giao dịch định kỳ' : 'Thêm giao dịch định kỳ'}</Modal.Title></Modal.Header>
          <Modal.Body>
            {formError && <Alert variant="danger" className="py-2 small">{formError}</Alert>}
            <ButtonGroup className="w-100 mb-3">
              <Button variant={form.type === 'Expense' ? 'danger' : 'outline-danger'} onClick={() => setForm({ ...form, type: 'Expense', CategoryId: '' })}>Khoản chi</Button>
              <Button variant={form.type === 'Income' ? 'success' : 'outline-success'} onClick={() => setForm({ ...form, type: 'Income', CategoryId: '' })}>Khoản thu</Button>
            </ButtonGroup>
            <Row className="g-3">
              <Col sm={6}>
                <Form.Label className="small fw-semibold">Danh mục</Form.Label>
                <Form.Select value={form.CategoryId} onChange={(e) => setForm({ ...form, CategoryId: e.target.value })}>
                  <option value="">— Chọn —</option>
                  {typeCategories.map((c) => <option key={c.categoryId} value={c.categoryId}>{c.categoryName}</option>)}
                </Form.Select>
              </Col>
              <Col sm={6}>
                <Form.Label className="small fw-semibold">Ví</Form.Label>
                <Form.Select value={form.AccountId} onChange={(e) => setForm({ ...form, AccountId: e.target.value })}>
                  {wallets.map((w) => <option key={w.AccountId} value={w.AccountId}>{w.AccountName}</option>)}
                </Form.Select>
              </Col>
              <Col sm={6}>
                <Form.Label className="small fw-semibold">Số tiền</Form.Label>
                <InputGroup>
                  <Form.Control type="number" min="1" step="1000" value={form.Amount} onChange={(e) => setForm({ ...form, Amount: e.target.value })} />
                  <InputGroup.Text>đ</InputGroup.Text>
                </InputGroup>
              </Col>
              <Col sm={6}>
                <Form.Label className="small fw-semibold">Chu kỳ</Form.Label>
                <Form.Select value={form.Frequency} onChange={(e) => setForm({ ...form, Frequency: e.target.value })}>
                  {FREQUENCIES.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
                </Form.Select>
              </Col>
              <Col sm={6}>
                <Form.Label className="small fw-semibold">{editing ? 'Lần tới' : 'Bắt đầu từ'}</Form.Label>
                <Form.Control type="date" value={form.NextDate} onChange={(e) => setForm({ ...form, NextDate: e.target.value })} />
              </Col>
              <Col sm={6}>
                <Form.Label className="small fw-semibold">Ghi chú</Form.Label>
                <Form.Control maxLength={200} value={form.Note} onChange={(e) => setForm({ ...form, Note: e.target.value })} placeholder="VD: Tiền nhà" />
              </Col>
            </Row>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="light" onClick={() => setShowForm(false)}>Huỷ</Button>
            <Button type="submit" variant="success" disabled={saving}>{saving ? <Spinner size="sm" animation="border" /> : 'Lưu'}</Button>
          </Modal.Footer>
        </Form>
      </Modal>

      <ConfirmDialog
        show={!!deleting}
        title="Xoá giao dịch định kỳ"
        message={deleting ? `Xoá "${deleting.Note || deleting.category?.categoryName}"? Các giao dịch đã ghi trước đó vẫn được giữ.` : ''}
        loading={deleteLoading}
        onConfirm={doDelete}
        onClose={() => setDeleting(null)}
      />
    </>
  );
}
