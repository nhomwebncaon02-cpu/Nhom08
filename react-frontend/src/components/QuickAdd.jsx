import { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Badge, Button, ButtonGroup, Form, InputGroup, Modal, Spinner } from 'react-bootstrap';
import { walletApi } from '../api/walletApi';
import { categoryApi } from '../api/categoryApi';
import { transactionApi } from '../api/transactionApi';
import { getErrorMessage } from '../api/axiosClient';
import { categoryIcon, formatVND, todayYMD } from '../utils/format';
import { useToast } from '../context/ToastContext';
import { useDataRefresh } from '../context/DataRefreshContext';

const PREF_KEY = 'SM_QUICK_ADD';
const loadPrefs = () => {
  try { return JSON.parse(localStorage.getItem(PREF_KEY)) ?? {}; } catch { return {}; }
};
const savePrefs = (p) => {
  try { localStorage.setItem(PREF_KEY, JSON.stringify(p)); } catch { /* bỏ qua */ }
};

/**
 * [Thành viên 4] Tối ưu UX "Thêm nhanh" (≤ 4 click):
 *   ① bấm nút + nổi  ② gõ số tiền  ③ bấm 1 danh mục  ④ Lưu (hoặc Enter)
 * Ví & danh mục dùng lần trước được chọn sẵn -> thường chỉ cần 2–3 click.
 */
export default function QuickAdd() {
  const toast = useToast();
  const { refresh } = useDataRefresh();
  const [show, setShow] = useState(false);
  const [wallets, setWallets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [type, setType] = useState('Expense');
  const [amount, setAmount] = useState('');
  const [accountId, setAccountId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const amountRef = useRef(null);

  const open = async () => {
    setShow(true);
    setError('');
    setAmount('');
    setNote('');
    try {
      const [w, c] = await Promise.all([walletApi.list(), categoryApi.list()]);
      setWallets(w);
      setCategories(c);
      const prefs = loadPrefs();
      const t = prefs.type ?? 'Expense';
      setType(t);
      setAccountId(String(w.find((x) => x.AccountId === prefs.accountId)?.AccountId ?? w[0]?.AccountId ?? ''));
      const lastCat = c.find((x) => x.categoryId === prefs.categoryId && x.type === t);
      setCategoryId(lastCat ? String(lastCat.categoryId) : '');
    } catch (e) {
      setError(getErrorMessage(e, 'Không tải được ví / danh mục'));
    }
  };

  useEffect(() => {
    if (show) setTimeout(() => amountRef.current?.focus(), 150);
  }, [show]);

  const chips = useMemo(() => {
    const prefs = loadPrefs();
    const recent = prefs.recent ?? [];
    return categories
      .filter((c) => c.type === type)
      .sort((a, b) => {
        const ia = recent.indexOf(a.categoryId);
        const ib = recent.indexOf(b.categoryId);
        return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
      })
      .slice(0, 8);
  }, [categories, type]);

  const submit = async (e) => {
    e?.preventDefault();
    const value = Number(amount);
    if (!value || value <= 0) return setError('Nhập số tiền lớn hơn 0');
    if (!accountId) return setError('Bạn chưa có ví nào — hãy tạo ví trước');
    if (!categoryId) return setError('Chọn một danh mục');
    setSaving(true);
    setError('');
    try {
      await transactionApi.create({
        AccountId: Number(accountId),
        CategoryId: Number(categoryId),
        Amount: value,
        TransactionDate: todayYMD(),
        Note: note.trim() || undefined,
      });
      const prefs = loadPrefs();
      const cid = Number(categoryId);
      savePrefs({
        type,
        accountId: Number(accountId),
        categoryId: cid,
        recent: [cid, ...(prefs.recent ?? []).filter((x) => x !== cid)].slice(0, 10),
      });
      toast.success(`Đã thêm ${type === 'Expense' ? 'khoản chi' : 'khoản thu'} ${formatVND(value)}`);
      refresh();
      setShow(false);
    } catch (err) {
      setError(getErrorMessage(err, 'Không thể lưu giao dịch'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Button variant="success" className="sm-fab" onClick={open} title="Thêm nhanh giao dịch" aria-label="Thêm nhanh giao dịch">
        <i className="fa-solid fa-plus"></i>
      </Button>

      <Modal show={show} onHide={() => setShow(false)} centered>
        <Form onSubmit={submit} noValidate>
          <Modal.Header closeButton>
            <Modal.Title as="h5"><i className="fa-solid fa-bolt text-warning me-2"></i>Thêm nhanh</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {error && <Alert variant="danger" className="py-2 small">{error}</Alert>}
            <ButtonGroup className="w-100 mb-3">
              <Button variant={type === 'Expense' ? 'danger' : 'outline-danger'} onClick={() => { setType('Expense'); setCategoryId(''); }}>Chi</Button>
              <Button variant={type === 'Income' ? 'success' : 'outline-success'} onClick={() => { setType('Income'); setCategoryId(''); }}>Thu</Button>
            </ButtonGroup>
            <InputGroup size="lg" className="mb-1">
              <Form.Control
                ref={amountRef}
                type="number" min="1" step="1000" inputMode="numeric"
                placeholder="Số tiền" value={amount} onChange={(e) => setAmount(e.target.value)}
                className="fw-bold"
              />
              <InputGroup.Text>đ</InputGroup.Text>
            </InputGroup>
            <div className="small text-secondary mb-3" style={{ minHeight: 20 }}>{Number(amount) > 0 && formatVND(amount)}</div>

            <div className="small fw-semibold mb-2">Danh mục</div>
            <div className="d-flex flex-wrap gap-2 mb-3">
              {chips.map((c) => {
                const active = String(c.categoryId) === categoryId;
                return (
                  <Button
                    key={c.categoryId} size="sm" className="sm-chip"
                    variant={active ? (type === 'Expense' ? 'danger' : 'success') : 'outline-secondary'}
                    onClick={() => setCategoryId(String(c.categoryId))}
                  >
                    <i className={`fa-solid ${categoryIcon(c.icon)} me-1`}></i>{c.categoryName}
                  </Button>
                );
              })}
              {chips.length === 0 && <span className="text-secondary small">Chưa có danh mục loại này</span>}
            </div>

            <div className="d-flex gap-2">
              <Form.Select size="sm" value={accountId} onChange={(e) => setAccountId(e.target.value)} aria-label="Ví">
                {wallets.map((w) => <option key={w.AccountId} value={w.AccountId}>{w.AccountName}</option>)}
              </Form.Select>
              <Form.Control size="sm" placeholder="Ghi chú (tuỳ chọn)" maxLength={255} value={note} onChange={(e) => setNote(e.target.value)} />
            </div>
            <div className="small text-secondary mt-2">
              <Badge bg="light" text="dark" className="me-1">Enter</Badge>để lưu · ngày: hôm nay
            </div>
          </Modal.Body>
          <Modal.Footer>
            <Button type="submit" variant="success" className="w-100" size="lg" disabled={saving}>
              {saving ? <Spinner size="sm" animation="border" /> : 'Lưu'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </>
  );
}
