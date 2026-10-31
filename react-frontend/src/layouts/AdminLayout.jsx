import AppShell from './AppShell';
import { DataRefreshProvider } from '../context/DataRefreshContext';

const SECTIONS = [
  {
    title: 'Quản trị',
    items: [
      { to: '/admin', icon: 'fa-gauge-high', label: 'Tổng quan hệ thống', end: true },
      { to: '/admin/users', icon: 'fa-users', label: 'Người dùng' },
      { to: '/admin/categories', icon: 'fa-tags', label: 'Danh mục hệ thống' },
      { to: '/admin/audit-logs', icon: 'fa-clock-rotate-left', label: 'Nhật ký hoạt động' },
    ],
  },
  {
    title: 'Tài khoản',
    items: [{ to: '/admin/profile', icon: 'fa-user-gear', label: 'Hồ sơ cá nhân' }],
  },
];

export default function AdminLayout() {
  return (
    <DataRefreshProvider>
      <AppShell variant="admin" sections={SECTIONS} homePath="/admin" />
    </DataRefreshProvider>
  );
}
