import { Navigate, useLocation } from 'react-router-dom';
import { homePathFor, useAuth } from './AuthContext';
import Loading from '../components/Loading';

/**
 * [Thành viên 1] Bảo vệ route: chưa đăng nhập -> về /auth; sai vai trò -> về trang của vai trò đó.
 *   <ProtectedRoute roles={['admin']}><AdminLayout /></ProtectedRoute>
 */
export default function ProtectedRoute({ roles, children }) {
  const { user, checking } = useAuth();
  const location = useLocation();

  if (checking) return <Loading text="Đang kiểm tra phiên đăng nhập..." className="py-5 mt-5" />;
  if (!user) return <Navigate to="/auth" replace state={{ from: location.pathname }} />;
  if (roles && !roles.includes(user.Role)) return <Navigate to={homePathFor(user)} replace />;
  return children;
}
