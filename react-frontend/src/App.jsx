import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './auth/AuthContext';
import ProtectedRoute from './auth/ProtectedRoute';
import { ToastProvider } from './context/ToastContext';

import LandingPage from './pages/LandingPage';
import AuthPage from './pages/AuthPage';
import UserLayout from './layouts/UserLayout';
import AdminLayout from './layouts/AdminLayout';

import OverviewPage from './pages/user/OverviewPage';
import WalletsPage from './pages/user/WalletsPage';
import TransactionsPage from './pages/user/TransactionsPage';
import BudgetsPage from './pages/user/BudgetsPage';
import GoalsPage from './pages/user/GoalsPage';
import CategoriesPage from './pages/user/CategoriesPage';
import RecurringPage from './pages/user/RecurringPage';
import ProfilePage from './pages/ProfilePage';

import AdminOverviewPage from './pages/admin/AdminOverviewPage';
import UsersPage from './pages/admin/UsersPage';
import SystemCategoriesPage from './pages/admin/SystemCategoriesPage';
import AuditLogsPage from './pages/admin/AuditLogsPage';

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/auth" element={<AuthPage />} />

            {/* Người dùng */}
            <Route
              path="/user"
              element={
                <ProtectedRoute roles={['user']}>
                  <UserLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<OverviewPage />} />
              <Route path="wallets" element={<WalletsPage />} />
              <Route path="transactions" element={<TransactionsPage />} />
              <Route path="budgets" element={<BudgetsPage />} />
              <Route path="goals" element={<GoalsPage />} />
              <Route path="categories" element={<CategoriesPage />} />
              <Route path="recurring" element={<RecurringPage />} />
              <Route path="profile" element={<ProfilePage />} />
            </Route>

            {/* Quản trị */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute roles={['admin']}>
                  <AdminLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<AdminOverviewPage />} />
              <Route path="users" element={<UsersPage />} />
              <Route path="categories" element={<SystemCategoriesPage />} />
              <Route path="audit-logs" element={<AuditLogsPage />} />
              <Route path="profile" element={<ProfilePage />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ToastProvider>
  );
}
