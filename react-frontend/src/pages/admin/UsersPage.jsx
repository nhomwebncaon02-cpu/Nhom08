import { useCallback, useEffect, useState } from 'react';
import { Alert, Badge, Button, Card, Col, Dropdown, Form, InputGroup, ListGroup, Modal, Offcanvas, Row, Spinner, Table } from 'react-bootstrap';
import { adminApi } from '../../api/adminApi';
import { getErrorMessage } from '../../api/axiosClient';
import { useAuth } from '../../auth/AuthContext';
import { useToast } from '../../context/ToastContext';
import PageHeader from '../../components/PageHeader';
import ConfirmDialog from '../../components/ConfirmDialog';
import EmptyState from '../../components/EmptyState';
import Loading from '../../components/Loading';
import PaginationBar from '../../components/PaginationBar';
import { formatDateTime, formatVND } from '../../utils/format';

const LIMIT = 10;
const PASSWORD_RE = /^(?=.*[A-Za-z])(?=.*\d).{8,72}$/;

/** Sinh mật khẩu ngẫu nhiên đủ mạnh (có chữ hoa, chữ thường, số) */
function randomPassword() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
  const arr = new Uint32Array(10);
  crypto.getRandomValues(arr);
  const body = Array.from(arr, (n) => chars[n % chars.length]).join('');
  return `${body}A7`;
}

/** [Admin] Quản lý người dùng: tìm kiếm, lọc, phân trang, sửa, đổi vai trò, khoá/mở khoá, đặt lại mật khẩu, xoá */
export default function UsersPage() {
  const { user: me } = useAuth();
  const toast = useToast();
  const [query, setQuery] = useState({ search: '', role: '', status: '' });
  const [searchInput, setSearchInput] = useState('');
  const [page, setPage] = useState(1);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  const [detail, setDetail] = useState(null);
  const [editing, setEditing] = useState(null);
  const [editForm, setEditForm] = useState({ FullName: '', Email: '', Role: 'user' });
  const [editError, setEditError] = useState('');
  const [resetting, setResetting] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [resetError, setResetError] = useState('');
  const [saving, setSaving] = useState(false);
  const [confirm, setConfirm] = useState(null); // { type: 'lock'|'unlock'|'delete', user }

  // Tìm kiếm có độ trễ 400ms (debounce) để không gọi API mỗi lần gõ phím
  useEffect(() => {
    const t = setTimeout(() => {
      setPage(1);
      setQuery((q) => ({ ...q, search: searchInput.trim() }));
    }, 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  const load = useCallback(async () => {
    setError('');
    try {
      const params = { page, limit: LIMIT };
      if (query.search) params.search = query.search;
      if (query.role) params.role = query.role;
      if (query.status) params.status = query.status;
      setResult(await adminApi.users(params));
    } catch (e) {
      setError(getErrorMessage(e, 'Không tải được danh sách người dùng'));
      setResult({ items: [], total: 0, page: 1, limit: LIMIT });
    }
  }, [query, page]);

  useEffect(() => {
    load();
  }, [load, reloadKey]);

  const reload = () => setReloadKey((k) => k + 1);

  const openDetail = async (u) => {
    setDetail({ ...u, loading: true });
    try {
      setDetail(await adminApi.user(u.UserId));
    } catch (e) {
      toast.error(getErrorMessage(e));
      setDetail(null);
    }
  };

  const openEdit = (u) => {
    setEditing(u);
    setEditForm({ FullName: u.FullName, Email: u.Email, Role: u.Role });
    setEditError('');
  };
  const saveEdit = async (e) => {
    e.preventDefault();
    if (editForm.FullName.trim().length < 2) return setEditError('Họ tên phải có ít nhất 2 ký tự');
    setSaving(true);
    setEditError('');
    try {
      await adminApi.updateUser(editing.UserId, { FullName: editForm.FullName.trim(), Email: editForm.Email.trim(), Role: editForm.Role });
      toast.success(`Đã cập nhật ${editing.Username}`);
      setEditing(null);
      reload();
    } catch (err) {
      setEditError(getErrorMessage(err, 'Cập nhật thất bại'));
    } finally {
      setSaving(false);
    }
  };

  const openReset = (u) => {
    setResetting(u);
    setNewPassword(randomPassword());
    setResetError('');
  };
  const saveReset = async (e) => {
    e.preventDefault();
    if (!PASSWORD_RE.test(newPassword)) return setResetError('Tối thiểu 8 ký tự, có cả chữ và số');
    setSaving(true);
    setResetError('');
    try {
      const res = await adminApi.resetPassword(resetting.UserId, newPassword);
      toast.success(`${res.message}. Hãy gửi mật khẩu mới cho người dùng.`);
      setResetting(null);
    } catch (err) {
      setResetError(getErrorMessage(err, 'Đặt lại mật khẩu thất bại'));
    } finally {
      setSaving(false);
    }
  };

  const doConfirm = async () => {
    const { type, user: u } = confirm;
    setSaving(true);
    try {
      if (type === 'delete') {
        await adminApi.deleteUser(u.UserId);
        toast.success(`Đã xoá ${u.Username}`);
      } else {
        await adminApi.setStatus(u.UserId, type === 'unlock');
        toast.success(type === 'lock' ? `Đã khoá ${u.Username}` : `Đã mở khoá ${u.Username}`);
      }
      setConfirm(null);
      setDetail(null);
      reload();
    } catch (err) {
      toast.error(getErrorMessage(err));
      setConfirm(null);
    } finally {
      setSaving(false);
    }
  };

  const copy = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.info('Đã sao chép mật khẩu');
    } catch {
      toast.warning('Không sao chép được, hãy chép thủ công');
    }
  };

  const confirmText = {
    lock: { title: 'Khoá tài khoản', msg: (u) => `Khoá tài khoản "${u.Username}"?\nNgười này sẽ bị đăng xuất và không đăng nhập được nữa.`, btn: 'Khoá', variant: 'danger' },
    unlock: { title: 'Mở khoá tài khoản', msg: (u) => `Mở khoá tài khoản "${u.Username}"?`, btn: 'Mở khoá', variant: 'success' },
    delete: { title: 'Xoá người dùng', msg: (u) => `Xoá vĩnh viễn "${u.Username}" (${u.Email})?\nToàn bộ ví, giao dịch, ngân sách, mục tiêu của người này sẽ bị xoá.`, btn: 'Xoá vĩnh viễn', variant: 'danger' },
  };

  return (
    <>
      <PageHeader title="Quản lý người dùng" icon="fa-users" subtitle="Tìm kiếm, phân quyền, khoá tài khoản và đặt lại mật khẩu." />

      <Card className="border-0 shadow-sm mb-3">
        <Card.Body>
          <Row className="g-2">
            <Col md={6}>
              <InputGroup>
                <InputGroup.Text><i className="fa-solid fa-magnifying-glass"></i></InputGroup.Text>
                <Form.Control placeholder="Tìm theo username, email, họ tên..." value={searchInput} onChange={(e) => setSearchInput(e.target.value)} maxLength={100} />
              </InputGroup>
            </Col>
            <Col xs={6} md={3}>
              <Form.Select value={query.role} onChange={(e) => { setPage(1); setQuery({ ...query, role: e.target.value }); }} aria-label="Vai trò">
                <option value="">Mọi vai trò</option>
                <option value="user">Người dùng</option>
                <option value="admin">Admin</option>
              </Form.Select>
            </Col>
            <Col xs={6} md={3}>
              <Form.Select value={query.status} onChange={(e) => { setPage(1); setQuery({ ...query, status: e.target.value }); }} aria-label="Trạng thái">
                <option value="">Mọi trạng thái</option>
                <option value="active">Đang hoạt động</option>
                <option value="locked">Bị khoá</option>
              </Form.Select>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {error && <Alert variant="danger">{error}</Alert>}

      <Card className="border-0 shadow-sm">
        {result === null ? (
          <Loading />
        ) : result.items.length === 0 ? (
          <EmptyState icon="fa-user-slash" title="Không tìm thấy người dùng" text="Thử từ khoá hoặc bộ lọc khác." />
        ) : (
          <>
            <Table hover responsive className="mb-0 align-middle">
              <thead className="table-light">
                <tr><th>Người dùng</th><th>Email</th><th>Vai trò</th><th>Trạng thái</th><th>Ngày tạo</th><th className="text-end">Thao tác</th></tr>
              </thead>
              <tbody>
                {result.items.map((u) => {
                  const self = u.UserId === me?.UserId;
                  return (
                    <tr key={u.UserId}>
                      <td>
                        <div className="d-flex align-items-center gap-2 cursor-pointer" onClick={() => openDetail(u)}>
                          <span className="sm-avatar" style={{ background: u.Role === 'admin' ? 'var(--sm-admin)' : 'var(--sm-brand)', width: 34, height: 34 }}>
                            {u.FullName.charAt(0).toUpperCase()}
                          </span>
                          <div>
                            <div className="fw-semibold">{u.FullName} {self && <Badge bg="secondary">Bạn</Badge>}</div>
                            <div className="small text-secondary">@{u.Username} · #{u.UserId}</div>
                          </div>
                        </div>
                      </td>
                      <td className="small">{u.Email}</td>
                      <td><Badge bg={u.Role === 'admin' ? 'dark' : 'light'} text={u.Role === 'admin' ? undefined : 'dark'}>{u.Role === 'admin' ? 'Admin' : 'User'}</Badge></td>
                      <td>{u.IsActive ? <Badge bg="success-subtle" text="success">Hoạt động</Badge> : <Badge bg="danger">Bị khoá</Badge>}</td>
                      <td className="small text-secondary text-nowrap">{formatDateTime(u.CreatedAt)}</td>
                      <td className="text-end">
                        <Dropdown align="end">
                          <Dropdown.Toggle variant="light" size="sm">Thao tác</Dropdown.Toggle>
                          <Dropdown.Menu>
                            <Dropdown.Item onClick={() => openDetail(u)}><i className="fa-solid fa-eye me-2"></i>Xem chi tiết</Dropdown.Item>
                            <Dropdown.Item onClick={() => openEdit(u)}><i className="fa-solid fa-pen me-2"></i>Sửa / đổi vai trò</Dropdown.Item>
                            <Dropdown.Item onClick={() => openReset(u)}><i className="fa-solid fa-key me-2"></i>Đặt lại mật khẩu</Dropdown.Item>
                            <Dropdown.Divider />
                            {u.IsActive ? (
                              <Dropdown.Item disabled={self} onClick={() => setConfirm({ type: 'lock', user: u })}><i className="fa-solid fa-lock me-2"></i>Khoá tài khoản</Dropdown.Item>
                            ) : (
                              <Dropdown.Item onClick={() => setConfirm({ type: 'unlock', user: u })}><i className="fa-solid fa-lock-open me-2"></i>Mở khoá</Dropdown.Item>
                            )}
                            <Dropdown.Item disabled={self} className="text-danger" onClick={() => setConfirm({ type: 'delete', user: u })}><i className="fa-solid fa-trash me-2"></i>Xoá</Dropdown.Item>
                          </Dropdown.Menu>
                        </Dropdown>
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

      {/* Chi tiết người dùng */}
      <Offcanvas show={!!detail} onHide={() => setDetail(null)} placement="end">
        <Offcanvas.Header closeButton><Offcanvas.Title className="fw-bold">Chi tiết người dùng</Offcanvas.Title></Offcanvas.Header>
        <Offcanvas.Body>
          {detail?.loading ? <Loading /> : detail && (
            <>
              <div className="text-center mb-3">
                <span className="sm-avatar mb-2" style={{ width: 64, height: 64, borderRadius: 18, fontSize: 26, background: detail.Role === 'admin' ? 'var(--sm-admin)' : 'var(--sm-brand)' }}>
                  {detail.FullName.charAt(0).toUpperCase()}
                </span>
                <h5 className="fw-bold mb-0">{detail.FullName}</h5>
                <div className="text-secondary">@{detail.Username}</div>
                <div className="mt-2">
                  <Badge bg={detail.Role === 'admin' ? 'dark' : 'success'} className="me-1">{detail.Role}</Badge>
                  {detail.IsActive ? <Badge bg="success-subtle" text="success">Hoạt động</Badge> : <Badge bg="danger">Bị khoá</Badge>}
                </div>
              </div>
              <ListGroup variant="flush" className="mb-3">
                <ListGroup.Item className="d-flex justify-content-between"><span className="text-secondary">Email</span><span>{detail.Email}</span></ListGroup.Item>
                <ListGroup.Item className="d-flex justify-content-between"><span className="text-secondary">Ngày tạo</span><span>{formatDateTime(detail.CreatedAt)}</span></ListGroup.Item>
                <ListGroup.Item className="d-flex justify-content-between"><span className="text-secondary">Số ví</span><b>{detail.stats?.walletCount}</b></ListGroup.Item>
                <ListGroup.Item className="d-flex justify-content-between"><span className="text-secondary">Tổng số dư (VND)</span><b>{formatVND(detail.stats?.totalBalance)}</b></ListGroup.Item>
                <ListGroup.Item className="d-flex justify-content-between"><span className="text-secondary">Giao dịch</span><b>{detail.stats?.transactionCount}</b></ListGroup.Item>
                <ListGroup.Item className="d-flex justify-content-between"><span className="text-secondary">Ngân sách</span><b>{detail.stats?.budgetCount}</b></ListGroup.Item>
                <ListGroup.Item className="d-flex justify-content-between"><span className="text-secondary">Mục tiêu</span><b>{detail.stats?.goalCount}</b></ListGroup.Item>
              </ListGroup>
              <div className="d-grid gap-2">
                <Button variant="outline-dark" onClick={() => { openEdit(detail); setDetail(null); }}><i className="fa-solid fa-pen me-1"></i>Sửa / đổi vai trò</Button>
                <Button variant="outline-warning" onClick={() => { openReset(detail); setDetail(null); }}><i className="fa-solid fa-key me-1"></i>Đặt lại mật khẩu</Button>
                {detail.UserId !== me?.UserId && (
                  <Button variant={detail.IsActive ? 'danger' : 'success'} onClick={() => setConfirm({ type: detail.IsActive ? 'lock' : 'unlock', user: detail })}>
                    <i className={`fa-solid ${detail.IsActive ? 'fa-lock' : 'fa-lock-open'} me-1`}></i>{detail.IsActive ? 'Khoá tài khoản' : 'Mở khoá'}
                  </Button>
                )}
              </div>
            </>
          )}
        </Offcanvas.Body>
      </Offcanvas>

      {/* Sửa người dùng */}
      <Modal show={!!editing} onHide={() => setEditing(null)} centered>
        <Form onSubmit={saveEdit} noValidate>
          <Modal.Header closeButton><Modal.Title as="h5">Sửa người dùng {editing && `@${editing.Username}`}</Modal.Title></Modal.Header>
          <Modal.Body>
            {editError && <Alert variant="danger" className="py-2 small">{editError}</Alert>}
            <Form.Group className="mb-3">
              <Form.Label className="small fw-semibold">Họ và tên</Form.Label>
              <Form.Control maxLength={100} value={editForm.FullName} onChange={(e) => setEditForm({ ...editForm, FullName: e.target.value })} />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label className="small fw-semibold">Email</Form.Label>
              <Form.Control type="email" maxLength={100} value={editForm.Email} onChange={(e) => setEditForm({ ...editForm, Email: e.target.value })} />
            </Form.Group>
            <Form.Group>
              <Form.Label className="small fw-semibold">Vai trò</Form.Label>
              <Form.Select value={editForm.Role} onChange={(e) => setEditForm({ ...editForm, Role: e.target.value })} disabled={editing?.UserId === me?.UserId}>
                <option value="user">Người dùng</option>
                <option value="admin">Quản trị viên</option>
              </Form.Select>
              {editing?.UserId === me?.UserId && <Form.Text>Không thể tự đổi vai trò của chính mình.</Form.Text>}
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="light" onClick={() => setEditing(null)}>Huỷ</Button>
            <Button type="submit" variant="admin" disabled={saving}>{saving ? <Spinner size="sm" animation="border" /> : 'Lưu'}</Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Đặt lại mật khẩu */}
      <Modal show={!!resetting} onHide={() => setResetting(null)} centered>
        <Form onSubmit={saveReset} noValidate>
          <Modal.Header closeButton><Modal.Title as="h5">Đặt lại mật khẩu {resetting && `@${resetting.Username}`}</Modal.Title></Modal.Header>
          <Modal.Body>
            {resetError && <Alert variant="danger" className="py-2 small">{resetError}</Alert>}
            <Form.Label className="small fw-semibold">Mật khẩu mới</Form.Label>
            <InputGroup>
              <Form.Control className="font-monospace" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} maxLength={72} />
              <Button variant="outline-secondary" onClick={() => setNewPassword(randomPassword())} title="Tạo ngẫu nhiên"><i className="fa-solid fa-dice"></i></Button>
              <Button variant="outline-secondary" onClick={() => copy(newPassword)} title="Sao chép"><i className="fa-solid fa-copy"></i></Button>
            </InputGroup>
            <Form.Text>Sao chép và gửi mật khẩu này cho người dùng. Họ nên đổi lại trong trang Hồ sơ.</Form.Text>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="light" onClick={() => setResetting(null)}>Huỷ</Button>
            <Button type="submit" variant="warning" disabled={saving}>{saving ? <Spinner size="sm" animation="border" /> : 'Đặt lại mật khẩu'}</Button>
          </Modal.Footer>
        </Form>
      </Modal>

      <ConfirmDialog
        show={!!confirm}
        title={confirm ? confirmText[confirm.type].title : ''}
        message={confirm ? confirmText[confirm.type].msg(confirm.user) : ''}
        confirmText={confirm ? confirmText[confirm.type].btn : ''}
        variant={confirm ? confirmText[confirm.type].variant : 'danger'}
        loading={saving}
        onConfirm={doConfirm}
        onClose={() => setConfirm(null)}
      />
    </>
  );
}
