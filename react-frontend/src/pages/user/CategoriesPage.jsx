import { useCallback, useEffect, useState } from 'react';
import { Alert, Badge, Button, ButtonGroup, Card, Col, Form, Modal, Row, Spinner } from 'react-bootstrap';
import { categoryApi } from '../../api/categoryApi';
import { getErrorMessage } from '../../api/axiosClient';
import { useAuth } from '../../auth/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useDataRefresh } from '../../context/DataRefreshContext';
import PageHeader from '../../components/PageHeader';
import ConfirmDialog from '../../components/ConfirmDialog';
import Loading from '../../components/Loading';
import { CATEGORY_ICONS, categoryIcon } from '../../utils/format';

const EMPTY = { categoryName: '', type: 'Expense', icon: 'fa-tag' };

/** Form tạo / sửa danh mục — dùng chung cho người dùng và admin (danh mục hệ thống) */
export function CategoryFormModal({ show, onHide, editing, onSaved, admin = false }) {
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!show) return;
    setError('');
    setForm(editing ? { categoryName: editing.categoryName, type: editing.type, icon: editing.icon?.startsWith('fa-') ? editing.icon : 'fa-tag' } : EMPTY);
  }, [show, editing]);

  const submit = async (e) => {
    e.preventDefault();
    if (!form.categoryName.trim()) return setError('Vui lòng nhập tên danh mục');
    setSaving(true);
    setError('');
    try {
      const payload = { categoryName: form.categoryName.trim(), type: form.type, icon: form.icon };
      if (editing) await categoryApi.update(editing.categoryId, payload);
      else await categoryApi.create(payload);
      onSaved(editing ? 'Đã cập nhật danh mục' : 'Đã tạo danh mục');
      onHide();
    } catch (err) {
      setError(getErrorMessage(err, 'Lưu danh mục thất bại'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal show={show} onHide={onHide} centered>
      <Form onSubmit={submit} noValidate>
        <Modal.Header closeButton>
          <Modal.Title as="h5">{editing ? 'Sửa danh mục' : admin ? 'Thêm danh mục hệ thống' : 'Thêm danh mục'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {error && <Alert variant="danger" className="py-2 small">{error}</Alert>}
          <ButtonGroup className="w-100 mb-3">
            <Button variant={form.type === 'Expense' ? 'danger' : 'outline-danger'} onClick={() => setForm({ ...form, type: 'Expense' })}>Khoản chi</Button>
            <Button variant={form.type === 'Income' ? 'success' : 'outline-success'} onClick={() => setForm({ ...form, type: 'Income' })}>Khoản thu</Button>
          </ButtonGroup>
          <Form.Group className="mb-3">
            <Form.Label className="small fw-semibold">Tên danh mục</Form.Label>
            <Form.Control autoFocus maxLength={100} placeholder="VD: Cà phê, Học phí..." value={form.categoryName} onChange={(e) => setForm({ ...form, categoryName: e.target.value })} />
          </Form.Group>
          <Form.Label className="small fw-semibold">Biểu tượng</Form.Label>
          <div className="d-flex flex-wrap gap-2">
            {CATEGORY_ICONS.map((ic) => (
              <Button
                key={ic} size="sm" title={ic}
                variant={form.icon === ic ? (form.type === 'Expense' ? 'danger' : 'success') : 'outline-secondary'}
                style={{ width: 40, height: 40 }}
                onClick={() => setForm({ ...form, icon: ic })}
              >
                <i className={`fa-solid ${ic}`}></i>
              </Button>
            ))}
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="light" onClick={onHide}>Huỷ</Button>
          <Button type="submit" variant={admin ? 'admin' : 'success'} disabled={saving}>{saving ? <Spinner size="sm" animation="border" /> : 'Lưu'}</Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
}

function CategoryGrid({ title, items, own, onEdit, onDelete }) {
  return (
    <Card className="border-0 shadow-sm h-100">
      <Card.Header className="bg-white border-0 pt-3 fw-bold">{title} <Badge bg="light" text="dark">{items.length}</Badge></Card.Header>
      <Card.Body>
        {items.length === 0 && <div className="text-secondary small">Chưa có danh mục.</div>}
        <Row className="g-2">
          {items.map((c) => (
            <Col xs={6} md={4} key={c.categoryId}>
              <div className="border rounded-3 p-2 d-flex align-items-center gap-2 h-100">
                <span className={`sm-stat-icon bg-${c.type === 'Income' ? 'success' : 'danger'}-subtle text-${c.type === 'Income' ? 'success' : 'danger'}`} style={{ width: 34, height: 34, fontSize: 14 }}>
                  <i className={`fa-solid ${categoryIcon(c.icon)}`}></i>
                </span>
                <span className="small fw-semibold flex-grow-1 text-truncate">{c.categoryName}</span>
                {own ? (
                  <span className="text-nowrap">
                    <Button variant="link" size="sm" className="p-1 text-secondary" title="Sửa" onClick={() => onEdit(c)}><i className="fa-solid fa-pen"></i></Button>
                    <Button variant="link" size="sm" className="p-1 text-danger" title="Xoá" onClick={() => onDelete(c)}><i className="fa-solid fa-trash"></i></Button>
                  </span>
                ) : (
                  <i className="fa-solid fa-lock text-secondary small" title="Danh mục hệ thống"></i>
                )}
              </div>
            </Col>
          ))}
        </Row>
      </Card.Body>
    </Card>
  );
}

/** [Thành viên 3] Danh mục thu/chi: danh mục hệ thống (chỉ xem) + danh mục riêng của bạn (thêm/sửa/xoá) */
export default function CategoriesPage() {
  const { user } = useAuth();
  const toast = useToast();
  const { version, refresh } = useDataRefresh();
  const [categories, setCategories] = useState(null);
  const [error, setError] = useState('');
  const [type, setType] = useState('Expense');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const load = useCallback(async () => {
    try {
      setCategories(await categoryApi.list());
    } catch (e) {
      setError(getErrorMessage(e));
      setCategories([]);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load, version]);

  const doDelete = async () => {
    setDeleteLoading(true);
    try {
      await categoryApi.remove(deleting.categoryId);
      toast.success('Đã xoá danh mục');
      setDeleting(null);
      refresh();
    } catch (e) {
      toast.error(getErrorMessage(e, 'Không thể xoá danh mục'));
      setDeleting(null);
    } finally {
      setDeleteLoading(false);
    }
  };

  const ofType = (categories ?? []).filter((c) => c.type === type);
  const system = ofType.filter((c) => c.userId == null);
  const mine = ofType.filter((c) => c.userId === user?.UserId);

  return (
    <>
      <PageHeader title="Danh mục" icon="fa-tags" subtitle="Danh mục hệ thống dùng chung + danh mục riêng do bạn tạo.">
        <Button variant="success" onClick={() => { setEditing(null); setShowForm(true); }}><i className="fa-solid fa-plus me-1"></i> Thêm danh mục</Button>
      </PageHeader>
      {error && <Alert variant="danger">{error}</Alert>}
      <ButtonGroup className="mb-3">
        <Button variant={type === 'Expense' ? 'danger' : 'outline-danger'} onClick={() => setType('Expense')}>Khoản chi</Button>
        <Button variant={type === 'Income' ? 'success' : 'outline-success'} onClick={() => setType('Income')}>Khoản thu</Button>
      </ButtonGroup>
      {categories === null ? (
        <Loading />
      ) : (
        <Row className="g-3">
          <Col lg={6}><CategoryGrid title="Của bạn" items={mine} own onEdit={(c) => { setEditing(c); setShowForm(true); }} onDelete={setDeleting} /></Col>
          <Col lg={6}><CategoryGrid title="Hệ thống" items={system} /></Col>
        </Row>
      )}
      <CategoryFormModal show={showForm} onHide={() => setShowForm(false)} editing={editing} onSaved={(m) => { toast.success(m); refresh(); }} />
      <ConfirmDialog
        show={!!deleting}
        title="Xoá danh mục"
        message={deleting ? `Xoá danh mục "${deleting.categoryName}"?\n(Không xoá được nếu đã có giao dịch hoặc ngân sách dùng danh mục này.)` : ''}
        loading={deleteLoading}
        onConfirm={doDelete}
        onClose={() => setDeleting(null)}
      />
    </>
  );
}
