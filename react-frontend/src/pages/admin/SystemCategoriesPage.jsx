import { useCallback, useEffect, useState } from 'react';
import { Alert, Badge, Button, ButtonGroup, Card, Table } from 'react-bootstrap';
import { categoryApi } from '../../api/categoryApi';
import { getErrorMessage } from '../../api/axiosClient';
import { useToast } from '../../context/ToastContext';
import PageHeader from '../../components/PageHeader';
import ConfirmDialog from '../../components/ConfirmDialog';
import EmptyState from '../../components/EmptyState';
import Loading from '../../components/Loading';
import { CategoryFormModal } from '../user/CategoriesPage';
import { categoryIcon } from '../../utils/format';

/** [Admin] Danh mục hệ thống: danh mục mặc định dùng chung cho mọi người dùng */
export default function SystemCategoriesPage() {
  const toast = useToast();
  const [items, setItems] = useState(null);
  const [error, setError] = useState('');
  const [type, setType] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const load = useCallback(async () => {
    setError('');
    try {
      setItems(await categoryApi.system());
    } catch (e) {
      setError(getErrorMessage(e, 'Không tải được danh mục'));
      setItems([]);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const doDelete = async () => {
    setDeleteLoading(true);
    try {
      await categoryApi.remove(deleting.categoryId);
      toast.success(`Đã xoá "${deleting.categoryName}"`);
      setDeleting(null);
      load();
    } catch (e) {
      toast.error(getErrorMessage(e, 'Không thể xoá danh mục'));
      setDeleting(null);
    } finally {
      setDeleteLoading(false);
    }
  };

  const visible = (items ?? []).filter((c) => !type || c.type === type);

  return (
    <>
      <PageHeader title="Danh mục hệ thống" icon="fa-tags" subtitle="Danh mục mặc định mọi người dùng đều thấy và sử dụng được.">
        <Button variant="admin" onClick={() => { setEditing(null); setShowForm(true); }}><i className="fa-solid fa-plus me-1"></i> Thêm danh mục</Button>
      </PageHeader>
      {error && <Alert variant="danger">{error}</Alert>}

      <ButtonGroup size="sm" className="mb-3">
        {[['', 'Tất cả'], ['Expense', 'Khoản chi'], ['Income', 'Khoản thu']].map(([v, l]) => (
          <Button key={v} variant={type === v ? 'dark' : 'outline-secondary'} onClick={() => setType(v)}>{l}</Button>
        ))}
      </ButtonGroup>

      <Card className="border-0 shadow-sm">
        {items === null ? (
          <Loading />
        ) : visible.length === 0 ? (
          <EmptyState icon="fa-tags" title="Chưa có danh mục hệ thống" />
        ) : (
          <Table hover responsive className="mb-0 align-middle">
            <thead className="table-light">
              <tr><th>Danh mục</th><th>Loại</th><th className="text-center">Số giao dịch đã dùng</th><th className="text-end">Thao tác</th></tr>
            </thead>
            <tbody>
              {visible.map((c) => (
                <tr key={c.categoryId}>
                  <td>
                    <span className={`sm-stat-icon me-2 bg-${c.type === 'Income' ? 'success' : 'danger'}-subtle text-${c.type === 'Income' ? 'success' : 'danger'}`} style={{ width: 34, height: 34, fontSize: 14 }}>
                      <i className={`fa-solid ${categoryIcon(c.icon)}`}></i>
                    </span>
                    <span className="fw-semibold">{c.categoryName}</span>
                  </td>
                  <td><Badge bg={c.type === 'Income' ? 'success' : 'danger'}>{c.type === 'Income' ? 'Thu' : 'Chi'}</Badge></td>
                  <td className="text-center">{c.usageCount}</td>
                  <td className="text-end text-nowrap">
                    <Button variant="link" size="sm" className="text-secondary" onClick={() => { setEditing(c); setShowForm(true); }} title="Sửa"><i className="fa-solid fa-pen"></i></Button>
                    <Button
                      variant="link" size="sm" className="text-danger" onClick={() => setDeleting(c)}
                      disabled={c.usageCount > 0} title={c.usageCount > 0 ? 'Đang được dùng, không thể xoá' : 'Xoá'}
                    >
                      <i className="fa-solid fa-trash"></i>
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>

      <CategoryFormModal admin show={showForm} onHide={() => setShowForm(false)} editing={editing} onSaved={(m) => { toast.success(m); load(); }} />
      <ConfirmDialog
        show={!!deleting}
        title="Xoá danh mục hệ thống"
        message={deleting ? `Xoá danh mục "${deleting.categoryName}"? Mọi người dùng sẽ không còn thấy danh mục này.` : ''}
        loading={deleteLoading}
        onConfirm={doDelete}
        onClose={() => setDeleting(null)}
      />
    </>
  );
}
