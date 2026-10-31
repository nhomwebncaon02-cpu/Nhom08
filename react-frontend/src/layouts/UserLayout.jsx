import AppShell from './AppShell';
import QuickAdd from '../components/QuickAdd';
import { DataRefreshProvider } from '../context/DataRefreshContext';

const SECTIONS = [
  {
    title: 'Tổng quan',
    items: [{ to: '/user', icon: 'fa-chart-pie', label: 'Tổng quan', end: true }], // [TV4]
  },
  {
    title: 'Quản lý tiền',
    items: [
      { to: '/user/wallets', icon: 'fa-wallet', label: 'Ví & Tài khoản' }, // [TV2]
      { to: '/user/transactions', icon: 'fa-receipt', label: 'Sổ giao dịch' }, // [TV3]
      { to: '/user/budgets', icon: 'fa-bullseye', label: 'Hạn mức ngân sách' }, // [TV2]
      { to: '/user/goals', icon: 'fa-piggy-bank', label: 'Mục tiêu tiết kiệm' }, // [TV4]
    ],
  },
  {
    title: 'Thiết lập',
    items: [
      { to: '/user/categories', icon: 'fa-tags', label: 'Danh mục' }, // [TV3]
      { to: '/user/recurring', icon: 'fa-rotate', label: 'Giao dịch định kỳ' },
      { to: '/user/profile', icon: 'fa-user-gear', label: 'Hồ sơ cá nhân' }, // [TV1]
    ],
  },
];

/** Layout phía người dùng: menu + nút "Thêm nhanh" nổi trên mọi trang */
export default function UserLayout() {
  return (
    <DataRefreshProvider>
      <AppShell variant="user" sections={SECTIONS} homePath="/user" />
      <QuickAdd />
    </DataRefreshProvider>
  );
}
