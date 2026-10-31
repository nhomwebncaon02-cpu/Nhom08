import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Button, Card, Col, Dropdown, Form, InputGroup, Modal, Row, Spinner } from 'react-bootstrap';
import { walletApi, WALLET_TYPES, walletTypeOf } from '../../api/walletApi';
import { getErrorMessage } from '../../api/axiosClient';
import { useToast } from '../../context/ToastContext';
import { useDataRefresh } from '../../context/DataRefreshContext';
import PageHeader from '../../components/PageHeader';
import ConfirmDialog from '../../components/ConfirmDialog';
import EmptyState from '../../components/EmptyState';
import Loading from '../../components/Loading';
import { formatMoney, formatVND } from '../../utils/format';

const EMPTY = { AccountName: '', AccountType: 'Cash', Balance: '', Currency: 'VND' };
const EMPTY_TRANSFER = { FromAccountId: '', ToAccountId: '', Amount: '' };

/** [Thành viên 2] UI danh sách ví: thêm / sửa / xoá ví + chuyển tiền giữa các ví */
export default function WalletsPage() {
  const toast = useToast();
  const { version, refresh } = useDataRefresh();
  const [wallets, setWallets] = useState(null);
  const [error, setError] = useState('');

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const [showTransfer, setShowTransfer] = useState(false);
  const [transfer, setTransfer] = useState(EMPTY_TRANSFER);
  const [transferError, setTransferError] = useState('');

  const [deleting, setDeleting] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const load = useCallback(async () => {
    setError('');
    try {
      setWallets(await walletApi.list());
    } catch (e) {
      setError(getErrorMessage(e, 'Không tải được danh sách ví'));
      setWallets([]);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load, version]);

  const totals = useMemo(() => {
    const t = {};
    (wallets ?? []).forEach((w) => {
      const cur = w.Currency || 'VND';
      t[cur] = (t[cur] ?? 0) + Number(w.Balance);
    });
    return t;
  }, [wallets]);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY);
    setFormError('');
    setShowForm(true);
  };
  const openEdit = (w) => {
    setEditing(w);
    setForm({ AccountName: w.AccountName, AccountType: w.AccountType || 'Other', Balance: String(w.Balance), Currency: w.Currency || 'VND' });
    setFormError('');
    setShowForm(true);
  };

  const save = async (e) => {
    e.preventDefault();
    const name = form.AccountName.trim();
    const balance = form.Balance === '' ? 0 : Number(form.Balance);
    if (!name) return setFormError('Vui lòng nhập tên ví');
    if (Number.isNaN(balance) || balance < 0) return setFormError('Số dư phải là số không âm');
    setSaving(true);
    setFormError('');
    try {
      const payload = { AccountName: name, AccountType: form.AccountType, Balance: balance, Currency: form.Currency };
      if (editing) await walletApi.update(editing.AccountId, payload);
      else await walletApi.create(payload);
      toast.success(editing ? 'Đã cập nhật ví' : `Đã tạo ví "${name}"`);
      setShowForm(false);
      refresh();
    } catch (err) {
      setFormError(getErrorMessage(err, 'Lưu ví thất bại'));
    } finally {
      setSaving(false);
    }
  };

  const openTransfer = (from) => {
    const source = from ?? wallets?.[0];
    const target = (wallets ?? []).find((w) => w.AccountId !== source?.AccountId);
    setTransfer({ FromAccountId: String(source?.AccountId ?? ''), ToAccountId: String(target?.AccountId ?? ''), Amount: '' });
    setTransferError('');
    setShowTransfer(true);
  };

  const doTransfer = async (e) => {
    e.preventDefault();
    const amount = Number(transfer.Amount);
    if (!transfer.FromAccountId || !transfer.ToAccountId) return setTransferError('Chọn ví nguồn và ví đích');
    if (transfer.FromAccountId === transfer.ToAccountId) return setTransferError('Ví nguồn và ví đích phải khác nhau');
    if (!amount || amount <= 0) return setTransferError('Số tiền phải lớn hơn 0');
    setSaving(true);
    setTransferError('');
    try {
      await walletApi.transfer({ FromAccountId: Number(transfer.FromAccountId), ToAccountId: Number(transfer.ToAccountId), Amount: amount });
      toast.success(`Đã chuyển ${formatVND(amount)}`);
      setShowTransfer(false);
      refresh();
    } catch (err) {
      setTransferError(getErrorMessage(err, 'Chuyển tiền thất bại'));
    } finally {
      setSaving(false);
    }
  };

  const doDelete = async () => {
    setDeleteLoading(true);
    try {
      await walletApi.remove(deleting.AccountId);
      toast.success(`Đã xoá ví "${deleting.AccountName}"`);
      setDeleting(null);
      refresh();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Xoá ví thất bại'));
      setDeleting(null);
    } finally {
      setDeleteLoading(false);
    }
  };

  const fromWallet = wallets?.find((w) => String(w.AccountId) === transfer.FromAccountId);

  return (
    <>
      <PageHeader title="Ví & Tài khoản" icon="fa-wallet" subtitle="Tiền mặt, ngân hàng, thẻ tín dụng và ví điện tử của bạn.">
        <Button variant="outline-primary" onClick={() => openTransfer()} disabled={(wallets?.length ?? 0) < 2}>
          <i className="fa-solid fa-right-left me-1"></i> Chuyển tiền
        </Button>
        <Button variant="success" onClick={openCreate}><i className="fa-solid fa-plus me-1"></i> Thêm ví</Button>
      </PageHeader>

      <Card className="border-0 text-white mb-4 shadow-sm" style={{ background: 'linear-gradient(120deg,#2563eb,#4f46e5)' }}>
        <Card.Body className="p-4 d-flex flex-wrap justify-content-between align-items-end gap-3">
          <div>
            <div className="small text-uppercase fw-semibold opacity-75">Tổng số dư</div>
            {Object.keys(totals).length === 0 ? (
              <div className="display-6 fw-800">{formatVND(0)}</div>
            ) : (
              Object.entries(totals).map(([cur, sum]) => <div key={cur} className="display-6 fw-800">{formatMoney(sum, cur)}</div>)
            )}
          </div>
          <div className="opacity-75">{wallets?.length ?? 0} ví</div>
        </Card.Body>
      </Card>

      {error && <Alert variant="danger">{error} <Alert.Link onClick={load}>Thử lại</Alert.Link></Alert>}

      {wallets === null ? (
        <Loading />
      ) : wallets.length === 0 ? (
        <Card className="border-0 shadow-sm">
          <EmptyState icon="fa-wallet" title="Bạn chưa có ví nào" text="Tạo ví đầu tiên để bắt đầu ghi chép thu chi.">
            <Button variant="success" onClick={openCreate}>+ Tạo ví</Button>
          </EmptyState>
        </Card>
      ) : (
        <Row className="g-3">
          {wallets.map((w) => {
            const t = walletTypeOf(w.AccountType);
            return (
              <Col md={6} xl={4} key={w.AccountId}>
                <Card className="h-100 border-0 shadow-sm sm-hover-lift">
                  <Card.Body className="d-flex flex-column">
                    <div className="d-flex align-items-start justify-content-between mb-4">
                      <div className="d-flex align-items-center gap-3">
                        <span className={`sm-stat-icon bg-${t.color}-subtle text-${t.color}`}><i className={`fa-solid ${t.icon}`}></i></span>
                        <div>
                          <div className="fw-bold">{w.AccountName}</div>
                          <div className="small text-secondary">{t.label}</div>
                        </div>
                      </div>
                      <Dropdown align="end">
                        <Dropdown.Toggle variant="light" size="sm" className="border-0" aria-label="Tuỳ chọn">
                          <i className="fa-solid fa-ellipsis"></i>
                        </Dropdown.Toggle>
                        <Dropdown.Menu>
                          <Dropdown.Item onClick={() => openEdit(w)}><i className="fa-solid fa-pen me-2"></i>Sửa</Dropdown.Item>
                          <Dropdown.Item onClick={() => openTransfer(w)} disabled={wallets.length < 2}><i className="fa-solid fa-right-left me-2"></i>Chuyển tiền</Dropdown.Item>
                          <Dropdown.Divider />
                          <Dropdown.Item className="text-danger" onClick={() => setDeleting(w)}><i className="fa-solid fa-trash me-2"></i>Xoá</Dropdown.Item>
                        </Dropdown.Menu>
                      </Dropdown>
                    </div>
                    <div className="mt-auto">
                      <div className="small text-secondary">Số dư</div>
                      <div className={`fs-3 fw-800 ${Number(w.Balance) < 0 ? 'text-danger' : ''}`}>{formatMoney(w.Balance, w.Currency)}</div>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            );
          })}
        </Row>
      )}

      {/* Thêm / sửa ví */}
      <Modal show={showForm} onHide={() => setShowForm(false)} centered>
        <Form onSubmit={save} noValidate>
          <Modal.Header closeButton><Modal.Title as="h5">{editing ? 'Sửa ví' : 'Thêm ví mới'}</Modal.Title></Modal.Header>
          <Modal.Body>
            {formError && <Alert variant="danger" className="py-2 small">{formError}</Alert>}
            <Form.Group className="mb-3">
              <Form.Label className="small fw-semibold">Tên ví</Form.Label>
              <Form.Control autoFocus maxLength={100} placeholder="VD: Ví tiền mặt, Vietcombank..." value={form.AccountName} onChange={(e) => setForm({ ...form, AccountName: e.target.value })} />
            </Form.Group>
            <Form.Label className="small fw-semibold">Loại ví</Form.Label>
            <Row className="g-2 mb-3">
              {WALLET_TYPES.map((t) => (
                <Col xs={4} key={t.value}>
                  <Button
                    variant={form.AccountType === t.value ? t.color : `outline-${t.color}`}
                    className="w-100 py-2 small" size="sm"
                    onClick={() => setForm({ ...form, AccountType: t.value })}
                  >
                    <i className={`fa-solid ${t.icon} d-block mb-1`}></i>{t.label}
                  </Button>
                </Col>
              ))}
            </Row>
            <Row className="g-2">
              <Col xs={8}>
                <Form.Label className="small fw-semibold">{editing ? 'Số dư' : 'Số dư ban đầu'}</Form.Label>
                <Form.Control type="number" min="0" step="1000" placeholder="0" value={form.Balance} onChange={(e) => setForm({ ...form, Balance: e.target.value })} />
              </Col>
              <Col xs={4}>
                <Form.Label className="small fw-semibold">Tiền tệ</Form.Label>
                <Form.Select value={form.Currency} onChange={(e) => setForm({ ...form, Currency: e.target.value })}>
                  <option>VND</option><option>USD</option><option>EUR</option>
                </Form.Select>
              </Col>
            </Row>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="light" onClick={() => setShowForm(false)}>Huỷ</Button>
            <Button type="submit" variant="success" disabled={saving}>{saving ? <Spinner size="sm" animation="border" /> : editing ? 'Lưu thay đổi' : 'Tạo ví'}</Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Chuyển tiền */}
      <Modal show={showTransfer} onHide={() => setShowTransfer(false)} centered>
        <Form onSubmit={doTransfer} noValidate>
          <Modal.Header closeButton><Modal.Title as="h5"><i className="fa-solid fa-right-left me-2"></i>Chuyển tiền giữa các ví</Modal.Title></Modal.Header>
          <Modal.Body>
            {transferError && <Alert variant="danger" className="py-2 small">{transferError}</Alert>}
            <Form.Group className="mb-3">
              <Form.Label className="small fw-semibold">Từ ví</Form.Label>
              <Form.Select value={transfer.FromAccountId} onChange={(e) => setTransfer({ ...transfer, FromAccountId: e.target.value })}>
                {(wallets ?? []).map((w) => <option key={w.AccountId} value={w.AccountId}>{w.AccountName} — {formatMoney(w.Balance, w.Currency)}</option>)}
              </Form.Select>
            </Form.Group>
            <div className="text-center text-secondary mb-2"><i className="fa-solid fa-arrow-down"></i></div>
            <Form.Group className="mb-3">
              <Form.Label className="small fw-semibold">Đến ví</Form.Label>
              <Form.Select value={transfer.ToAccountId} onChange={(e) => setTransfer({ ...transfer, ToAccountId: e.target.value })}>
                {(wallets ?? []).filter((w) => String(w.AccountId) !== transfer.FromAccountId).map((w) => (
                  <option key={w.AccountId} value={w.AccountId}>{w.AccountName} — {formatMoney(w.Balance, w.Currency)}</option>
                ))}
              </Form.Select>
            </Form.Group>
            <Form.Label className="small fw-semibold">Số tiền</Form.Label>
            <InputGroup>
              <Form.Control type="number" min="1" step="1000" value={transfer.Amount} onChange={(e) => setTransfer({ ...transfer, Amount: e.target.value })} placeholder="0" />
              <Button variant="outline-secondary" onClick={() => setTransfer({ ...transfer, Amount: String(Math.max(0, Number(fromWallet?.Balance ?? 0))) })}>Tất cả</Button>
            </InputGroup>
            {Number(transfer.Amount) > 0 && <Form.Text>= {formatVND(transfer.Amount)}</Form.Text>}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="light" onClick={() => setShowTransfer(false)}>Huỷ</Button>
            <Button type="submit" variant="primary" disabled={saving}>{saving ? <Spinner size="sm" animation="border" /> : 'Chuyển tiền'}</Button>
          </Modal.Footer>
        </Form>
      </Modal>

      <ConfirmDialog
        show={!!deleting}
        title="Xoá ví"
        message={deleting ? `Xoá ví "${deleting.AccountName}"?\nToàn bộ giao dịch thuộc ví này cũng sẽ bị xoá và không thể khôi phục.` : ''}
        loading={deleteLoading}
        onConfirm={doDelete}
        onClose={() => setDeleting(null)}
      />
    </>
  );
}
