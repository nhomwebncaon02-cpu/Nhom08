import { useEffect, useState } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { Alert, Button, Card, Col, Form, InputGroup, Nav, ProgressBar, Row, Spinner } from 'react-bootstrap';
import { getErrorMessage } from '../api/axiosClient';
import { homePathFor, useAuth } from '../auth/AuthContext';

/**
 * [Thành viên 1] UI Xác thực: Đăng nhập / Đăng ký.
 * Luật kiểm tra giống hệt RegisterDto bên backend để báo lỗi sớm cho người dùng.
 */
const USERNAME_RE = /^[a-zA-Z0-9_.]{3,50}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_RE = /^(?=.*[A-Za-z])(?=.*\d).{8,72}$/;

function validateRegister(d) {
  const errors = {};
  if (d.fullName.trim().length < 2) errors.fullName = 'Họ tên phải có ít nhất 2 ký tự';
  if (/[<>]/.test(d.fullName)) errors.fullName = 'Họ tên không được chứa ký tự < >';
  if (!USERNAME_RE.test(d.username)) errors.username = '3–50 ký tự: chữ không dấu, số, dấu _ hoặc .';
  if (!EMAIL_RE.test(d.email)) errors.email = 'Email không hợp lệ';
  if (!PASSWORD_RE.test(d.password)) errors.password = 'Tối thiểu 8 ký tự, có cả chữ và số';
  if (d.password !== d.confirmPassword) errors.confirmPassword = 'Mật khẩu nhập lại không khớp';
  return errors;
}

const STRENGTH = [
  { label: 'Rất yếu', variant: 'danger' },
  { label: 'Yếu', variant: 'danger' },
  { label: 'Trung bình', variant: 'warning' },
  { label: 'Khá', variant: 'info' },
  { label: 'Mạnh', variant: 'success' },
];
function passwordStrength(pw) {
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
  if (/\d/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  return { score, ...STRENGTH[score] };
}

const EMPTY_REGISTER = { fullName: '', username: '', email: '', password: '', confirmPassword: '' };

export default function AuthPage() {
  const { user, login, register } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [tab, setTab] = useState(searchParams.get('tab') === 'register' ? 'register' : 'login');
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState(null); // { variant, text }
  const [showPw, setShowPw] = useState(false);
  const [loginData, setLoginData] = useState({ username: '', password: '', remember: false });
  const [reg, setReg] = useState(EMPTY_REGISTER);
  const [regErrors, setRegErrors] = useState({});

  useEffect(() => {
    if (searchParams.get('expired')) setAlert({ variant: 'info', text: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.' });
  }, [searchParams]);

  if (user) return <Navigate to={homePathFor(user)} replace />;

  const switchTab = (k) => {
    setTab(k);
    setAlert(null);
    setShowPw(false);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setAlert(null);
    setLoading(true);
    try {
      const me = await login({ username: loginData.username.trim(), password: loginData.password, remember: loginData.remember });
      navigate(homePathFor(me), { replace: true });
    } catch (err) {
      setAlert({ variant: 'danger', text: getErrorMessage(err, 'Đăng nhập thất bại.') });
      setLoginData((d) => ({ ...d, password: '' }));
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setAlert(null);
    const errors = validateRegister(reg);
    setRegErrors(errors);
    if (Object.keys(errors).length) return;
    setLoading(true);
    try {
      const res = await register({
        fullName: reg.fullName.trim(),
        username: reg.username.trim(),
        email: reg.email.trim(),
        password: reg.password,
      });
      setLoginData({ username: reg.username.trim(), password: '', remember: false });
      setReg(EMPTY_REGISTER);
      setTab('login');
      setAlert({ variant: 'success', text: res.message || 'Đăng ký thành công! Hãy đăng nhập.' });
    } catch (err) {
      setAlert({ variant: 'danger', text: getErrorMessage(err, 'Đăng ký thất bại.') });
    } finally {
      setLoading(false);
    }
  };

  const setRegField = (field) => (e) => {
    setReg({ ...reg, [field]: e.target.value });
    if (regErrors[field]) setRegErrors({ ...regErrors, [field]: undefined });
  };
  const strength = passwordStrength(reg.password);

  return (
    <div className="sm-auth-bg d-flex align-items-center justify-content-center p-3">
      <Card className="shadow-lg border-0 w-100" style={{ maxWidth: 440 }}>
        <Card.Body className="p-4 p-md-5">
          <div className="text-center mb-4">
            <Link to="/" className="text-decoration-none">
              <span className="sm-avatar mb-3" style={{ background: 'var(--sm-brand)', width: 60, height: 60, borderRadius: 18 }}>
                <i className="fa-solid fa-wallet fs-3"></i>
              </span>
            </Link>
            <h1 className="h4 fw-800 mb-1">SmartMoney</h1>
            <p className="text-secondary small mb-0">Hệ thống quản lý chi tiêu cá nhân thông minh</p>
          </div>

          <Nav variant="pills" fill activeKey={tab} onSelect={(k) => switchTab(k)} className="bg-light rounded-3 p-1 mb-4">
            <Nav.Item><Nav.Link eventKey="login">Đăng nhập</Nav.Link></Nav.Item>
            <Nav.Item><Nav.Link eventKey="register">Đăng ký</Nav.Link></Nav.Item>
          </Nav>

          {alert && <Alert variant={alert.variant} className="small" style={{ whiteSpace: 'pre-line' }}>{alert.text}</Alert>}

          {tab === 'login' ? (
            <Form onSubmit={handleLogin} noValidate>
              <Form.Group className="mb-3" controlId="login-username">
                <Form.Label className="small fw-semibold">Tên đăng nhập hoặc Email</Form.Label>
                <Form.Control
                  autoComplete="username" maxLength={100} placeholder="user@smartmoney.vn"
                  value={loginData.username} onChange={(e) => setLoginData({ ...loginData, username: e.target.value })}
                />
              </Form.Group>
              <Form.Group className="mb-3" controlId="login-password">
                <Form.Label className="small fw-semibold">Mật khẩu</Form.Label>
                <InputGroup>
                  <Form.Control
                    type={showPw ? 'text' : 'password'} autoComplete="current-password" maxLength={72} placeholder="Mật khẩu"
                    value={loginData.password} onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                  />
                  <Button variant="outline-secondary" onClick={() => setShowPw(!showPw)} aria-label={showPw ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}>
                    <i className={`fa-solid ${showPw ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                  </Button>
                </InputGroup>
              </Form.Group>
              <Form.Check
                id="remember" className="mb-4 small" label="Ghi nhớ đăng nhập trên thiết bị này"
                checked={loginData.remember} onChange={(e) => setLoginData({ ...loginData, remember: e.target.checked })}
              />
              <Button type="submit" variant="success" size="lg" className="w-100" disabled={loading || !loginData.username || !loginData.password}>
                {loading ? <><Spinner size="sm" animation="border" className="me-2" />Đang đăng nhập...</> : 'Đăng nhập'}
              </Button>
            </Form>
          ) : (
            <Form onSubmit={handleRegister} noValidate>
              <Form.Group className="mb-3">
                <Form.Control placeholder="Họ và tên" autoComplete="name" maxLength={100} value={reg.fullName} onChange={setRegField('fullName')} isInvalid={!!regErrors.fullName} />
                <Form.Control.Feedback type="invalid">{regErrors.fullName}</Form.Control.Feedback>
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Control placeholder="Tên đăng nhập" autoComplete="username" maxLength={50} value={reg.username} onChange={setRegField('username')} isInvalid={!!regErrors.username} />
                <Form.Control.Feedback type="invalid">{regErrors.username}</Form.Control.Feedback>
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Control type="email" placeholder="Email" autoComplete="email" maxLength={100} value={reg.email} onChange={setRegField('email')} isInvalid={!!regErrors.email} />
                <Form.Control.Feedback type="invalid">{regErrors.email}</Form.Control.Feedback>
              </Form.Group>
              <Row className="g-2 mb-2">
                <Col>
                  <Form.Control type={showPw ? 'text' : 'password'} placeholder="Mật khẩu" autoComplete="new-password" maxLength={72} value={reg.password} onChange={setRegField('password')} isInvalid={!!regErrors.password} />
                </Col>
                <Col>
                  <Form.Control type={showPw ? 'text' : 'password'} placeholder="Nhập lại mật khẩu" autoComplete="new-password" maxLength={72} value={reg.confirmPassword} onChange={setRegField('confirmPassword')} isInvalid={!!regErrors.confirmPassword} />
                </Col>
              </Row>
              {(regErrors.password || regErrors.confirmPassword) && (
                <div className="text-danger small mb-2">{regErrors.password || regErrors.confirmPassword}</div>
              )}
              {reg.password && (
                <div className="mb-2">
                  <ProgressBar now={(strength.score / 4) * 100} variant={strength.variant} style={{ height: 6 }} />
                  <div className="small text-secondary mt-1">Độ mạnh mật khẩu: <b>{strength.label}</b></div>
                </div>
              )}
              <Form.Check id="show-pw" className="mb-4 small" label="Hiện mật khẩu" checked={showPw} onChange={(e) => setShowPw(e.target.checked)} />
              <Button type="submit" variant="success" size="lg" className="w-100" disabled={loading}>
                {loading ? <><Spinner size="sm" animation="border" className="me-2" />Đang tạo tài khoản...</> : 'Tạo tài khoản'}
              </Button>
            </Form>
          )}

          <div className="text-center mt-4">
            <Link to="/" className="small fw-semibold"><i className="fa-solid fa-arrow-left me-1"></i>Về trang chủ</Link>
          </div>
        </Card.Body>
      </Card>
    </div>
  );
}
