import { Navigate, useLocation } from 'react-router-dom';
import { homePathFor, useAuth } from './AuthContext';

/**
 * Bảo vệ route: chưa đăng nhập -> về /auth; sai vai trò -> về trang của vai trò đó.
 *   <ProtectedRoute roles={['admin']}><AdminDashboard /></ProtectedRoute>
 */
export default function ProtectedRoute({ roles, children }) {
  const { user, checking } = useAuth();
  const location = useLocation();

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-500 text-sm">
        <i className="fa-solid fa-spinner fa-spin mr-2"></i> Đang kiểm tra phiên đăng nhập...
      </div>
    );
  }
  if (!user) return <Navigate to="/auth" replace state={{ from: location.pathname }} />;
  if (roles && !roles.includes(user.Role)) return <Navigate to={homePathFor(user)} replace />;
  return children;
}
