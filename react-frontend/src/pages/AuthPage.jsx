import React, { useEffect, useState } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { getErrorMessage } from '../api/axiosClient';
import { homePathFor, useAuth } from '../auth/AuthContext';

// Luật kiểm tra giống hệt DTO bên backend (RegisterDto) để báo lỗi sớm cho người dùng
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

const STRENGTH_LEVELS = [
  { label: 'Rất yếu', color: 'bg-rose-500' },
  { label: 'Yếu', color: 'bg-rose-400' },
  { label: 'Trung bình', color: 'bg-amber-400' },
  { label: 'Khá', color: 'bg-emerald-400' },
  { label: 'Mạnh', color: 'bg-emerald-600' },
];

function passwordStrength(pw) {
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
  if (/\d/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  return { score, ...STRENGTH_LEVELS[score] };
}

const inputCls = (hasError) =>
  `w-full px-4 py-2.5 bg-slate-50 border rounded-xl text-sm focus:outline-none focus:ring-2 ${
    hasError ? 'border-rose-400 focus:ring-rose-400' : 'border-slate-200 focus:ring-emerald-500'
  }`;

const FieldError = ({ msg }) => (msg ? <p className="text-xs text-rose-600 mt-1">{msg}</p> : null);

const AuthPage = () => {
  const { user, login, register } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [activeTab, setActiveTab] = useState('login');
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState(null); // { type: 'error' | 'success' | 'info', text }
  const [showPw, setShowPw] = useState(false);

  const [loginData, setLoginData] = useState({ username: '', password: '', remember: false });
  const [registerData, setRegisterData] = useState({
    fullName: '', username: '', email: '', password: '', confirmPassword: '',
  });
  const [regErrors, setRegErrors] = useState({});

  useEffect(() => {
    if (searchParams.get('expired')) {
      setAlert({ type: 'info', text: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.' });
    }
  }, [searchParams]);

  // Đã đăng nhập rồi thì không cần ở trang /auth
  if (user) return <Navigate to={homePathFor(user)} replace />;

  const switchTab = (tab) => {
    setActiveTab(tab);
    setAlert(null);
    setShowPw(false);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setAlert(null);
    setLoading(true);
    try {
      const loggedIn = await login({
        username: loginData.username.trim(),
        password: loginData.password,
        remember: loginData.remember,
      });
      navigate(homePathFor(loggedIn), { replace: true });
    } catch (error) {
      setAlert({ type: 'error', text: getErrorMessage(error, 'Đăng nhập thất bại.') });
      setLoginData((d) => ({ ...d, password: '' }));
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setAlert(null);
    const errors = validateRegister(registerData);
    setRegErrors(errors);
    if (Object.keys(errors).length) return;

    setLoading(true);
    try {
      const res = await register({
        fullName: registerData.fullName.trim(),
        username: registerData.username.trim(),
        email: registerData.email.trim(),
        password: registerData.password,
      });
      setLoginData({ username: registerData.username.trim(), password: '', remember: false });
      setRegisterData({ fullName: '', username: '', email: '', password: '', confirmPassword: '' });
      setActiveTab('login');
      setAlert({ type: 'success', text: res.message || 'Đăng ký thành công! Hãy đăng nhập.' });
    } catch (error) {
      setAlert({ type: 'error', text: getErrorMessage(error, 'Đăng ký thất bại.') });
    } finally {
      setLoading(false);
    }
  };

  const setReg = (field) => (e) => {
    setRegisterData({ ...registerData, [field]: e.target.value });
    if (regErrors[field]) setRegErrors({ ...regErrors, [field]: undefined });
  };

  const strength = passwordStrength(registerData.password);
  const alertStyles = {
    error: 'bg-rose-50 text-rose-700 border-rose-200',
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    info: 'bg-sky-50 text-sky-700 border-sky-200',
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-emerald-900 via-slate-900 to-slate-950">
      <div className="bg-white/95 backdrop-blur-md w-full max-w-md rounded-2xl shadow-2xl p-8 border border-white/20">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-500 text-white text-3xl mb-3 shadow-lg shadow-emerald-500/30">
            <i className="fa-solid fa-wallet"></i>
          </div>
          <h1 className="text-2xl font-bold text-slate-800">SmartMoney</h1>
          <p className="text-sm text-slate-500 mt-1">Hệ thống quản lý chi tiêu cá nhân thông minh</p>
        </div>

        {/* Nút chuyển đổi Tab */}
        <div className="flex bg-slate-100 p-1 rounded-xl mb-5 font-medium text-sm" role="tablist">
          {[['login', 'Đăng Nhập'], ['register', 'Đăng Ký']].map(([key, label]) => (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={activeTab === key}
              onClick={() => switchTab(key)}
              className={`flex-1 py-2.5 rounded-lg ${activeTab === key ? 'text-slate-700 bg-white shadow-sm font-semibold' : 'text-slate-500 hover:text-slate-800'}`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Thông báo — React tự escape nội dung nên không bị XSS */}
        {alert && (
          <div role="alert" className={`mb-4 px-4 py-3 rounded-xl border text-sm whitespace-pre-line ${alertStyles[alert.type]}`}>
            {alert.text}
          </div>
        )}

        {/* Form Đăng Nhập */}
        {activeTab === 'login' && (
          <form onSubmit={handleLogin} className="space-y-4" noValidate>
            <div>
              <label htmlFor="login-username" className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">Tên đăng nhập hoặc Email</label>
              <input
                id="login-username"
                type="text"
                autoComplete="username"
                value={loginData.username}
                onChange={(e) => setLoginData({ ...loginData, username: e.target.value })}
                required
                maxLength={100}
                placeholder="user@smartmoney.vn"
                className={inputCls(false)}
              />
            </div>
            <div>
              <label htmlFor="login-password" className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">Mật khẩu</label>
              <div className="relative">
                <input
                  id="login-password"
                  type={showPw ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={loginData.password}
                  onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                  required
                  maxLength={72}
                  placeholder="Mật khẩu"
                  className={`${inputCls(false)} pr-11`}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  aria-label={showPw ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                  className="absolute inset-y-0 right-0 px-3.5 text-slate-400 hover:text-slate-700"
                >
                  <i className={`fa-solid ${showPw ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                </button>
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm text-slate-600 select-none">
              <input
                type="checkbox"
                checked={loginData.remember}
                onChange={(e) => setLoginData({ ...loginData, remember: e.target.checked })}
                className="w-4 h-4 accent-emerald-600"
              />
              Ghi nhớ đăng nhập trên thiết bị này
            </label>
            <button
              type="submit"
              disabled={loading || !loginData.username || !loginData.password}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold rounded-xl shadow-lg shadow-emerald-600/30 transition"
            >
              {loading ? <><i className="fa-solid fa-spinner fa-spin mr-2"></i>Đang đăng nhập...</> : 'Đăng Nhập Hệ Thống'}
            </button>
          </form>
        )}

        {/* Form Đăng Ký */}
        {activeTab === 'register' && (
          <form onSubmit={handleRegister} className="space-y-3" noValidate>
            <div>
              <input type="text" autoComplete="name" maxLength={100} placeholder="Họ và tên"
                value={registerData.fullName} onChange={setReg('fullName')} className={inputCls(regErrors.fullName)} />
              <FieldError msg={regErrors.fullName} />
            </div>
            <div>
              <input type="text" autoComplete="username" maxLength={50} placeholder="Tên đăng nhập"
                value={registerData.username} onChange={setReg('username')} className={inputCls(regErrors.username)} />
              <FieldError msg={regErrors.username} />
            </div>
            <div>
              <input type="email" autoComplete="email" maxLength={100} placeholder="Email"
                value={registerData.email} onChange={setReg('email')} className={inputCls(regErrors.email)} />
              <FieldError msg={regErrors.email} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <input type={showPw ? 'text' : 'password'} autoComplete="new-password" maxLength={72} placeholder="Mật khẩu"
                  value={registerData.password} onChange={setReg('password')} className={inputCls(regErrors.password)} />
              </div>
              <div>
                <input type={showPw ? 'text' : 'password'} autoComplete="new-password" maxLength={72} placeholder="Nhập lại mật khẩu"
                  value={registerData.confirmPassword} onChange={setReg('confirmPassword')} className={inputCls(regErrors.confirmPassword)} />
              </div>
            </div>
            <FieldError msg={regErrors.password || regErrors.confirmPassword} />

            {registerData.password && (
              <div>
                <div className="flex gap-1">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className={`h-1.5 flex-1 rounded-full ${i <= strength.score ? strength.color : 'bg-slate-200'}`} />
                  ))}
                </div>
                <p className="text-[11px] text-slate-500 mt-1">Độ mạnh mật khẩu: <b>{strength.label}</b></p>
              </div>
            )}

            <label className="flex items-center gap-2 text-xs text-slate-500 select-none">
              <input type="checkbox" checked={showPw} onChange={(e) => setShowPw(e.target.checked)} className="w-4 h-4 accent-emerald-600" />
              Hiện mật khẩu
            </label>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 mt-1 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-semibold rounded-xl"
            >
              {loading ? <><i className="fa-solid fa-spinner fa-spin mr-2"></i>Đang tạo tài khoản...</> : 'Đăng Ký Tài Khoản'}
            </button>
          </form>
        )}

        <Link to="/" className="mt-5 block text-center text-sm font-semibold text-emerald-700 hover:underline">
          Về trang chủ SmartMoney
        </Link>
      </div>
    </div>
  );
};

export default AuthPage;
