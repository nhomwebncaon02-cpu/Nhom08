import { useCallback, useEffect, useState } from 'react';
import { Alert, Badge, Button, ButtonGroup, Card, Col, Dropdown, Form, InputGroup, Modal, ProgressBar, Row, Spinner } from 'react-bootstrap';
import { goalApi } from '../../api/goalApi';
import { walletApi } from '../../api/walletApi';
import { getErrorMessage } from '../../api/axiosClient';
import { useToast } from '../../context/ToastContext';
import { useDataRefresh } from '../../context/DataRefreshContext';
import PageHeader from '../../components/PageHeader';
import ConfirmDialog from '../../components/ConfirmDialog';
import EmptyState from '../../components/EmptyState';
import Loading from '../../components/Loading';
import StatCard from '../../components/StatCard';
import { dateOnly, daysUntil, formatDate, formatVND } from '../../utils/format';

const EMPTY = { name: '', targetAmount: '', deadline: '' };

/**
 * [Thành viên 4] Mục tiêu tiết kiệm (viết lại bằng React-Bootstrap, nối API thật).
 * Không sửa tay "đã tích luỹ" nữa: nạp tiền từ ví / rút về ví -> số dư ví thay đổi tương ứng.
 */
export default function GoalsPage() {
  const toast = useToast();
  const { version, refresh } = useDataRefresh();
  const [goals, setGoals] = useState(null);
  const [wallets, setWallets] = useState([]);
  const [error, setError] = useState('');

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const [money, setMoney] = useState(null); // { goal, kind: 'deposit' | 'withdraw' }
  const [moneyForm, setMoneyForm] = useState({ AccountId: '', Amount: '' });
  const [moneyError, setMoneyError] = useState('');

  const [deleting, setDeleting] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const load = useCallback(async () => {
    setError('');
    try {
      const [g, w] = await Promise.all([goalApi.list(), walletApi.list()]);
      setGoals(g);
      setWallets(w.filter((x) => (x.Currency || 'VND') === 'VND'));
    } catch (e) {
      setError(getErrorMessage(e, 'Không tải được mục tiêu'));
      setGoals([]);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load, version]);

  const list = goals ?? [];
  const saved = list.reduce((s, g) => s + Number(g.currentAmount), 0);
  const target = list.reduce((s, g) => s + Number(g.targetAmount), 0);
  const done = list.filter((g) => Number(g.currentAmount) >= Number(g.targetAmount)).length;

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY);
    setFormError('');
    setShowForm(true);
  };
  const openEdit = (g) => {
    setEditing(g);
    setForm({ name: g.name, targetAmount: String(g.targetAmount), deadline: dateOnly(g.deadline) });
    setFormError('');
    setShowForm(true);
  };

  const save = async (e) => {
    e.preventDefault();
    const amount = Number(form.targetAmount);
    if (!form.name.trim()) return setFormError('Vui lòng nhập tên mục tiêu');
    if (!amount || amount < 1000) return setFormError('Số tiền mục tiêu tối thiểu 1.000đ');
    if (!form.deadline) return setFormError('Vui lòng chọn hạn chót');
    setSaving(true);
    setFormError('');
    try {
      const payload = { name: form.name.trim(), targetAmount: amount, deadline: form.deadline };
      if (editing) await goalApi.update(editing.id, payload);
      else await goalApi.create(payload);
      toast.success(editing ? 'Đã cập nhật mục tiêu' : 'Đã tạo mục tiêu mới');
      setShowForm(false);
      refresh();
    } catch (err) {
      setFormError(getErrorMessage(err, 'Lưu mục tiêu thất bại'));
    } finally {
      setSaving(false);
    }
  };

  const openMoney = (goal, kind) => {
    setMoney({ goal, kind });
    setMoneyForm({ AccountId: String(wallets[0]?.AccountId ?? ''), Amount: '' });
    setMoneyError('');
  };

  const doMoney = async (e) => {
    e.preventDefault();
    const amount = Number(moneyForm.Amount);
    if (!moneyForm.AccountId) return setMoneyError('Chọn ví');
    if (!amount || amount <= 0) return setMoneyError('Số tiền phải lớn hơn 0');
    setSaving(true);
    setMoneyError('');
    try {
      const payload = { AccountId: Number(moneyForm.AccountId), Amount: amount };
      if (money.kind === 'deposit') await goalApi.deposit(money.goal.id, payload);
      else await goalApi.withdraw(money.goal.id, payload);
      toast.success(money.kind === 'deposit' ? `Đã nạp ${formatVND(amount)} vào "${money.goal.name}"` : `Đã rút ${formatVND(amount)} về ví`);
      setMoney(null);
      refresh();
    } catch (err) {
      setMoneyError(getErrorMessage(err, 'Thao tác thất bại'));
    } finally {
      setSaving(false);
    }
  };

  const doDelete = async () => {
    setDeleteLoading(true);
    try {
      await goalApi.remove(deleting.id);
      toast.success('Đã xoá mục tiêu');
      setDeleting(null);
      refresh();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Xoá mục tiêu thất bại'));
      setDeleting(null);
    } finally {
      setDeleteLoading(false);
    }
  };

  const remaining = money ? Math.max(0, Number(money.goal.targetAmount) - Number(money.goal.currentAmount)) : 0;
  const selectedWallet = wallets.find((w) => String(w.AccountId) === moneyForm.AccountId);

  return (
    <>
      <PageHeader title="Mục tiêu tiết kiệm" icon="fa-piggy-bank" subtitle="Đặt mục tiêu, nạp tiền từ ví và theo dõi tiến độ.">
        <Button variant="success" onClick={openCreate}><i className="fa-solid fa-plus me-1"></i> Thêm mục tiêu</Button>
      </PageHeader>

      {error && <Alert variant="danger">{error} <Alert.Link onClick={load}>Thử lại</Alert.Link></Alert>}

      {goals === null ? (
        <Loading />
      ) : (
        <>
          <Row className="g-3 mb-4">
            <Col md={4}><StatCard label="Đã tích luỹ" icon="fa-coins" color="warning" value={formatVND(saved)} /></Col>
            <Col md={4}><StatCard label="Tổng mục tiêu" icon="fa-flag-checkered" color="primary" value={formatVND(target)} sub={`${target ? Math.round((saved / target) * 100) : 0}% hoàn thành`} /></Col>
            <Col md={4}><StatCard label="Đã đạt" icon="fa-trophy" color="success" value={`${done} / ${list.length}`} sub="mục tiêu" /></Col>
          </Row>

          {list.length === 0 ? (
            <Card className="border-0 shadow-sm">
              <EmptyState icon="fa-piggy-bank" title="Bạn chưa có mục tiêu nào" text="Ví dụ: mua laptop, quỹ dự phòng 6 tháng, du lịch Đà Lạt...">
                <Button variant="success" onClick={openCreate}>+ Tạo mục tiêu</Button>
              </EmptyState>
            </Card>
          ) : (
            <Row className="g-3">
              {list.map((g) => {
                const pct = g.targetAmount > 0 ? Math.round((g.currentAmount / g.targetAmount) * 100) : 0;
                const days = daysUntil(g.deadline);
                const reached = pct >= 100;
                return (
                  <Col md={6} xl={4} key={g.id}>
                    <Card className={`h-100 shadow-sm ${reached ? 'border-success' : 'border-0'}`}>
                      <Card.Body className="d-flex flex-column">
                        <div className="d-flex justify-content-between align-items-start mb-3">
                          <div className="min-w-0">
                            <div className="fw-bold fs-5 text-truncate">{reached && '🏆 '}{g.name}</div>
                            <div className="small text-secondary">Hạn: {formatDate(dateOnly(g.deadline))}</div>
                          </div>
                          <Dropdown align="end">
                            <Dropdown.Toggle variant="light" size="sm" className="border-0" aria-label="Tuỳ chọn"><i className="fa-solid fa-ellipsis"></i></Dropdown.Toggle>
                            <Dropdown.Menu>
                              <Dropdown.Item onClick={() => openEdit(g)}><i className="fa-solid fa-pen me-2"></i>Sửa</Dropdown.Item>
                              <Dropdown.Item className="text-danger" onClick={() => setDeleting(g)}><i className="fa-solid fa-trash me-2"></i>Xoá</Dropdown.Item>
                            </Dropdown.Menu>
                          </Dropdown>
                        </div>
                        <ProgressBar now={Math.min(pct, 100)} label={`${pct}%`} variant={reached ? 'success' : 'warning'} style={{ height: 18 }} className="mb-2" />
                        <div className="d-flex justify-content-between small mb-3">
                          <span><b>{formatVND(g.currentAmount)}</b></span>
                          <span className="text-secondary">/ {formatVND(g.targetAmount)}</span>
                        </div>
                        <div className="mb-3">
                          {reached ? (
                            <Badge bg="success">Đã đạt mục tiêu!</Badge>
                          ) : days === null ? null : days < 0 ? (
                            <Badge bg="danger">Quá hạn {-days} ngày</Badge>
                          ) : (
                            <Badge bg="light" text="dark">Còn {days} ngày · cần thêm {formatVND(g.targetAmount - g.currentAmount)}</Badge>
                          )}
                        </div>
                        <ButtonGroup className="mt-auto">
                          <Button variant="success" size="sm" onClick={() => openMoney(g, 'deposit')} disabled={!wallets.length}>
                            <i className="fa-solid fa-arrow-down me-1"></i>Nạp tiền
                          </Button>
                          <Button variant="outline-secondary" size="sm" onClick={() => openMoney(g, 'withdraw')} disabled={!g.currentAmount}>
                            <i className="fa-solid fa-arrow-up me-1"></i>Rút về ví
                          </Button>
                        </ButtonGroup>
                      </Card.Body>
                    </Card>
                  </Col>
                );
              })}
            </Row>
          )}
        </>
      )}

      <Modal show={showForm} onHide={() => setShowForm(false)} centered>
        <Form onSubmit={save} noValidate>
          <Modal.Header closeButton><Modal.Title as="h5">{editing ? 'Sửa mục tiêu' : 'Tạo mục tiêu mới'}</Modal.Title></Modal.Header>
          <Modal.Body>
            {formError && <Alert variant="danger" className="py-2 small">{formError}</Alert>}
            <Form.Group className="mb-3">
              <Form.Label className="small fw-semibold">Tên mục tiêu</Form.Label>
              <Form.Control autoFocus maxLength={100} placeholder="VD: Mua Macbook" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label className="small fw-semibold">Số tiền cần đạt</Form.Label>
              <InputGroup>
                <Form.Control type="number" min="1000" step="100000" value={form.targetAmount} onChange={(e) => setForm({ ...form, targetAmount: e.target.value })} />
                <InputGroup.Text>VND</InputGroup.Text>
              </InputGroup>
              {Number(form.targetAmount) > 0 && <Form.Text>= {formatVND(form.targetAmount)}</Form.Text>}
            </Form.Group>
            <Form.Group>
              <Form.Label className="small fw-semibold">Hạn chót</Form.Label>
              <Form.Control type="date" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="light" onClick={() => setShowForm(false)}>Huỷ</Button>
            <Button type="submit" variant="success" disabled={saving}>{saving ? <Spinner size="sm" animation="border" /> : editing ? 'Lưu thay đổi' : 'Tạo mục tiêu'}</Button>
          </Modal.Footer>
        </Form>
      </Modal>

      <Modal show={!!money} onHide={() => setMoney(null)} centered>
        {money && (
          <Form onSubmit={doMoney} noValidate>
            <Modal.Header closeButton>
              <Modal.Title as="h5">{money.kind === 'deposit' ? `Nạp tiền vào "${money.goal.name}"` : `Rút tiền từ "${money.goal.name}"`}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              {moneyError && <Alert variant="danger" className="py-2 small">{moneyError}</Alert>}
              <Form.Group className="mb-3">
                <Form.Label className="small fw-semibold">{money.kind === 'deposit' ? 'Lấy tiền từ ví' : 'Trả tiền về ví'}</Form.Label>
                <Form.Select value={moneyForm.AccountId} onChange={(e) => setMoneyForm({ ...moneyForm, AccountId: e.target.value })}>
                  {wallets.map((w) => <option key={w.AccountId} value={w.AccountId}>{w.AccountName} — {formatVND(w.Balance)}</option>)}
                </Form.Select>
              </Form.Group>
              <Form.Label className="small fw-semibold">Số tiền</Form.Label>
              <InputGroup>
                <Form.Control type="number" min="1" step="10000" value={moneyForm.Amount} onChange={(e) => setMoneyForm({ ...moneyForm, Amount: e.target.value })} autoFocus />
                {money.kind === 'deposit' ? (
                  <Button variant="outline-secondary" onClick={() => setMoneyForm({ ...moneyForm, Amount: String(Math.min(remaining, Math.max(0, Number(selectedWallet?.Balance ?? 0)))) })}>Đủ mục tiêu</Button>
                ) : (
                  <Button variant="outline-secondary" onClick={() => setMoneyForm({ ...moneyForm, Amount: String(money.goal.currentAmount) })}>Rút hết</Button>
                )}
              </InputGroup>
              <Form.Text>
                {money.kind === 'deposit' ? `Còn thiếu ${formatVND(remaining)} để đạt mục tiêu` : `Đang có ${formatVND(money.goal.currentAmount)} trong mục tiêu`}
              </Form.Text>
            </Modal.Body>
            <Modal.Footer>
              <Button variant="light" onClick={() => setMoney(null)}>Huỷ</Button>
              <Button type="submit" variant={money.kind === 'deposit' ? 'success' : 'primary'} disabled={saving}>
                {saving ? <Spinner size="sm" animation="border" /> : money.kind === 'deposit' ? 'Nạp tiền' : 'Rút tiền'}
              </Button>
            </Modal.Footer>
          </Form>
        )}
      </Modal>

      <ConfirmDialog
        show={!!deleting}
        title="Xoá mục tiêu"
        message={deleting ? (Number(deleting.currentAmount) > 0
          ? `Mục tiêu "${deleting.name}" đang có ${formatVND(deleting.currentAmount)}.\nHãy rút tiền về ví trước khi xoá.`
          : `Xoá mục tiêu "${deleting.name}"?`) : ''}
        loading={deleteLoading}
        onConfirm={doDelete}
        onClose={() => setDeleting(null)}
      />
    </>
  );
}
