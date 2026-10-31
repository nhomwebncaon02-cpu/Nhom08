import { useEffect, useMemo, useState } from 'react';
import { Alert, Button, ButtonGroup, Col, Form, InputGroup, Modal, Row, Spinner } from 'react-bootstrap';
import { transactionApi } from '../api/transactionApi';
import { getErrorMessage } from '../api/axiosClient';
import { dateOnly, formatVND, todayYMD } from '../utils/format';

const emptyForm = () => ({ type: 'Expense', AccountId: '', CategoryId: '', Amount: '', TransactionDate: todayYMD(), Note: '' });

/**
 * [Thành viên 3] Form thêm / sửa giao dịch đầy đủ.
 * Backend tự cộng/trừ số dư ví và CHẶN nếu khoản chi vượt hạn mức ngân sách (lỗi hiện ngay trong form).
 */
export default function TransactionFormModal({ show, onHide, onSaved, transaction, wallets, categories }) {
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const editing = !!transaction;

  useEffect(() => {
    if (!show) return;
    setError('');
    if (transaction) {
      setForm({
        type: transaction.category?.type ?? 'Expense',
        AccountId: String(transaction.AccountId),
        CategoryId: String(transaction.CategoryId),
        Amount: String(transaction.Amount),
        TransactionDate: dateOnly(transaction.TransactionDate),
        Note: transaction.Note ?? '',
      });
    } else {
      setForm({ ...emptyForm(), AccountId: String(wallets[0]?.AccountId ?? '') });
    }
  }, [show, transaction, wallets]);

  const typeCategories = useMemo(() => categories.filter((c) => c.type === form.type), [categories, form.type]);

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    const amount = Number(form.Amount);
    if (!form.AccountId) return setError('Vui lòng chọn ví');
    if (!form.CategoryId) return setError('Vui lòng chọn danh mục');
    if (!amount || amount <= 0) return setError('Số tiền phải lớn hơn 0');
    const payload = {
      AccountId: Number(form.AccountId),
      CategoryId: Number(form.CategoryId),
      Amount: amount,
      TransactionDate: form.TransactionDate,
      Note: form.Note.trim() || undefined,
    };
    setSaving(true);
    setError('');
    try {
      if (editing) await transactionApi.update(transaction.TransactionId, payload);
      else await transactionApi.create(payload);
      onSaved?.(editing ? 'Đã cập nhật giao dịch' : 'Đã thêm giao dịch');
      onHide();
    } catch (err) {
      setError(getErrorMessage(err, 'Không thể lưu giao dịch'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal show={show} onHide={onHide} centered>
      <Form onSubmit={submit} noValidate>
        <Modal.Header closeButton>
          <Modal.Title as="h5">{editing ? 'Sửa giao dịch' : 'Thêm giao dịch'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {error && <Alert variant="danger" className="py-2 small">{error}</Alert>}
          <ButtonGroup className="w-100 mb-3">
            <Button
              variant={form.type === 'Expense' ? 'danger' : 'outline-danger'}
              onClick={() => setForm((f) => ({ ...f, type: 'Expense', CategoryId: '' }))}
            >
              <i className="fa-solid fa-arrow-trend-down me-1"></i> Khoản chi
            </Button>
            <Button
              variant={form.type === 'Income' ? 'success' : 'outline-success'}
              onClick={() => setForm((f) => ({ ...f, type: 'Income', CategoryId: '' }))}
            >
              <i className="fa-solid fa-arrow-trend-up me-1"></i> Khoản thu
            </Button>
          </ButtonGroup>
          <Form.Group className="mb-3">
            <Form.Label className="small fw-semibold">Số tiền</Form.Label>
            <InputGroup>
              <Form.Control type="number" min="1" step="1000" value={form.Amount} onChange={set('Amount')} placeholder="0" autoFocus />
              <InputGroup.Text>VND</InputGroup.Text>
            </InputGroup>
            {Number(form.Amount) > 0 && <Form.Text>= {formatVND(form.Amount)}</Form.Text>}
          </Form.Group>
          <Row className="g-3 mb-3">
            <Col sm={6}>
              <Form.Label className="small fw-semibold">Ví</Form.Label>
              <Form.Select value={form.AccountId} onChange={set('AccountId')}>
                <option value="">— Chọn ví —</option>
                {wallets.map((w) => (
                  <option key={w.AccountId} value={w.AccountId}>{w.AccountName} ({formatVND(w.Balance)})</option>
                ))}
              </Form.Select>
            </Col>
            <Col sm={6}>
              <Form.Label className="small fw-semibold">Danh mục</Form.Label>
              <Form.Select value={form.CategoryId} onChange={set('CategoryId')}>
                <option value="">— Chọn danh mục —</option>
                {typeCategories.map((c) => (
                  <option key={c.categoryId} value={c.categoryId}>{c.categoryName}</option>
                ))}
              </Form.Select>
            </Col>
          </Row>
          <Row className="g-3">
            <Col sm={5}>
              <Form.Label className="small fw-semibold">Ngày</Form.Label>
              <Form.Control type="date" value={form.TransactionDate} onChange={set('TransactionDate')} />
            </Col>
            <Col sm={7}>
              <Form.Label className="small fw-semibold">Ghi chú</Form.Label>
              <Form.Control maxLength={255} value={form.Note} onChange={set('Note')} placeholder="Không bắt buộc" />
            </Col>
          </Row>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="light" onClick={onHide}>Huỷ</Button>
          <Button type="submit" variant="success" disabled={saving}>
            {saving ? <Spinner size="sm" animation="border" /> : editing ? 'Lưu thay đổi' : 'Thêm giao dịch'}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
}
