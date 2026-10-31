import { useEffect, useState } from 'react';
import { Alert, Badge, Button, Card, Col, Form, Row, Spinner } from 'react-bootstrap';
import { profileApi } from '../api/profileApi';
import { getErrorMessage } from '../api/axiosClient';
import { useAuth } from '../auth/AuthContext';
import { useToast } from '../context/ToastContext';
import PageHeader from '../components/PageHeader';
import Loading from '../components/Loading';
import { formatDateTime } from '../utils/format';

const PASSWORD_RE = /^(?=.*[A-Za-z])(?=.*\d).{8,72}$/;

/** Hồ sơ cá nhân (dùng chung cho user và admin): đổi họ tên, email, mật khẩu */
export default function ProfilePage() {
  const { logout, updateUser } = useAuth();
  const toast = useToast();
  const [profile, setProfile] = useState(null);
  const [info, setInfo] = useState({ FullName: '', Email: '' });
  const [infoError, setInfoError] = useState('');
  const [savingInfo, setSavingInfo] = useState(false);
  const [pw, setPw] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [pwError, setPwError] = useState('');
  const [savingPw, setSavingPw] = useState(false);

  useEffect(() => {
    profileApi
      .get()
      .then((p) => {
        setProfile(p);
        setInfo({ FullName: p.FullName, Email: p.Email });
      })
      .catch((e) => setInfoError(getErrorMessage(e)));
  }, []);

  const saveInfo = async (e) => {
    e.preventDefault();
    if (info.FullName.trim().length < 2) return setInfoError('Họ tên phải có ít nhất 2 ký tự');
    setSavingInfo(true);
    setInfoError('');
    try {
      const updated = await profileApi.update({ FullName: info.FullName.trim(), Email: info.Email.trim() });
      setProfile(updated);
      updateUser({ FullName: updated.FullName, Email: updated.Email });
      toast.success('Đã cập nhật hồ sơ');
    } catch (err) {
      setInfoError(getErrorMessage(err, 'Cập nhật thất bại'));
    } finally {
      setSavingInfo(false);
    }
  };

  const savePw = async (e) => {
    e.preventDefault();
    if (!pw.currentPassword) return setPwError('Nhập mật khẩu hiện tại');
    if (!PASSWORD_RE.test(pw.newPassword)) return setPwError('Mật khẩu mới tối thiểu 8 ký tự, có cả chữ và số');
    if (pw.newPassword !== pw.confirm) return setPwError('Mật khẩu nhập lại không khớp');
    setSavingPw(true);
    setPwError('');
    try {
      await profileApi.changePassword({ currentPassword: pw.currentPassword, newPassword: pw.newPassword });
      setPw({ currentPassword: '', newPassword: '', confirm: '' });
      toast.success('Đổi mật khẩu thành công');
    } catch (err) {
      setPwError(getErrorMessage(err, 'Đổi mật khẩu thất bại'));
    } finally {
      setSavingPw(false);
    }
  };

  if (!profile && !infoError) return <Loading />;
  const isAdmin = profile?.Role === 'admin';

  return (
    <>
      <PageHeader title="Hồ sơ cá nhân" icon="fa-user-gear" subtitle="Quản lý thông tin tài khoản và mật khẩu." />
      <Row className="g-3">
        <Col lg={4}>
          <Card className="border-0 shadow-sm text-center h-100">
            <Card.Body className="p-4">
              <span className="sm-avatar mb-3" style={{ width: 80, height: 80, borderRadius: 24, fontSize: 32, background: isAdmin ? 'var(--sm-admin)' : 'var(--sm-brand)' }}>
                {(profile?.FullName || '?').charAt(0).toUpperCase()}
              </span>
              <h2 className="h5 fw-bold mb-1">{profile?.FullName}</h2>
              <div className="text-secondary mb-2">@{profile?.Username}</div>
              <Badge bg={isAdmin ? 'dark' : 'success'}>{isAdmin ? 'Quản trị viên' : 'Người dùng'}</Badge>
              <hr />
              <div className="small text-secondary">Ngày tạo: {formatDateTime(profile?.CreatedAt)}</div>
              <Button variant="outline-danger" size="sm" className="mt-3" onClick={logout}>
                <i className="fa-solid fa-arrow-right-from-bracket me-1"></i>Đăng xuất
              </Button>
            </Card.Body>
          </Card>
        </Col>
        <Col lg={8}>
          <Card className="border-0 shadow-sm mb-3">
            <Card.Header className="bg-white border-0 pt-3 fw-bold">Thông tin cá nhân</Card.Header>
            <Card.Body>
              <Form onSubmit={saveInfo} noValidate>
                {infoError && <Alert variant="danger" className="py-2 small">{infoError}</Alert>}
                <Row className="g-3">
                  <Col md={6}>
                    <Form.Label className="small fw-semibold">Tên đăng nhập</Form.Label>
                    <Form.Control value={profile?.Username ?? ''} disabled readOnly />
                  </Col>
                  <Col md={6}>
                    <Form.Label className="small fw-semibold">Họ và tên</Form.Label>
                    <Form.Control maxLength={100} value={info.FullName} onChange={(e) => setInfo({ ...info, FullName: e.target.value })} />
                  </Col>
                  <Col md={12}>
                    <Form.Label className="small fw-semibold">Email</Form.Label>
                    <Form.Control type="email" maxLength={100} value={info.Email} onChange={(e) => setInfo({ ...info, Email: e.target.value })} />
                  </Col>
                </Row>
                <Button type="submit" variant={isAdmin ? 'admin' : 'success'} className="mt-3" disabled={savingInfo}>
                  {savingInfo ? <Spinner size="sm" animation="border" /> : 'Lưu thông tin'}
                </Button>
              </Form>
            </Card.Body>
          </Card>
          <Card className="border-0 shadow-sm">
            <Card.Header className="bg-white border-0 pt-3 fw-bold">Đổi mật khẩu</Card.Header>
            <Card.Body>
              <Form onSubmit={savePw} noValidate>
                {pwError && <Alert variant="danger" className="py-2 small">{pwError}</Alert>}
                <Row className="g-3">
                  <Col md={4}>
                    <Form.Label className="small fw-semibold">Mật khẩu hiện tại</Form.Label>
                    <Form.Control type="password" autoComplete="current-password" value={pw.currentPassword} onChange={(e) => setPw({ ...pw, currentPassword: e.target.value })} />
                  </Col>
                  <Col md={4}>
                    <Form.Label className="small fw-semibold">Mật khẩu mới</Form.Label>
                    <Form.Control type="password" autoComplete="new-password" value={pw.newPassword} onChange={(e) => setPw({ ...pw, newPassword: e.target.value })} />
                  </Col>
                  <Col md={4}>
                    <Form.Label className="small fw-semibold">Nhập lại mật khẩu mới</Form.Label>
                    <Form.Control type="password" autoComplete="new-password" value={pw.confirm} onChange={(e) => setPw({ ...pw, confirm: e.target.value })} />
                  </Col>
                </Row>
                <Button type="submit" variant="outline-dark" className="mt-3" disabled={savingPw}>
                  {savingPw ? <Spinner size="sm" animation="border" /> : 'Đổi mật khẩu'}
                </Button>
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </>
  );
}
