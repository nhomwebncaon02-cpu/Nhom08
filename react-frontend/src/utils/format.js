export const formatMoney = (amount, currency = 'VND') =>
  new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency,
    maximumFractionDigits: currency === 'VND' ? 0 : 2,
  }).format(Number(amount) || 0);

export const formatVND = (amount) => formatMoney(amount, 'VND');

/** 'YYYY-MM-DD' -> 'DD/MM/YYYY' */
export const formatDate = (ymd) => (ymd ? ymd.slice(0, 10).split('-').reverse().join('/') : '');

const pad = (n) => String(n).padStart(2, '0');
export const toYMD = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

/** Ngày đầu & cuối của tháng hiện tại (+offset tháng) */
export function monthRange(offset = 0) {
  const now = new Date();
  const first = new Date(now.getFullYear(), now.getMonth() + offset, 1);
  const last = new Date(now.getFullYear(), now.getMonth() + offset + 1, 0);
  return { start: toYMD(first), end: toYMD(last) };
}

/** Icon danh mục: chấp nhận 'fa-xxx', nếu không thì dùng icon mặc định */
export const categoryIcon = (icon) => (icon && icon.startsWith('fa-') ? icon : 'fa-tag');

/** ISO / Date -> 'DD/MM/YYYY HH:mm' theo giờ máy */
export const formatDateTime = (value) => {
  if (!value) return '';
  const d = new Date(value);
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

/** Ngày giao dịch từ API (ISO hoặc 'YYYY-MM-DD') -> 'YYYY-MM-DD' theo giờ máy */
export const dateOnly = (value) => {
  if (!value) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(String(value))) return String(value);
  return toYMD(new Date(value));
};

export const todayYMD = () => toYMD(new Date());

/** Số ngày từ hôm nay đến ngày ymd (âm nếu đã qua) */
export const daysUntil = (value) => {
  if (!value) return null;
  const target = new Date(`${dateOnly(value)}T00:00:00`);
  const today = new Date(`${todayYMD()}T00:00:00`);
  return Math.round((target - today) / 86_400_000);
};

/** Rút gọn số tiền cho trục biểu đồ: 1.500.000 -> 1,5tr */
export const compactVND = (n) => {
  const v = Number(n) || 0;
  if (Math.abs(v) >= 1e9) return `${(v / 1e9).toLocaleString('vi-VN', { maximumFractionDigits: 1 })}tỷ`;
  if (Math.abs(v) >= 1e6) return `${(v / 1e6).toLocaleString('vi-VN', { maximumFractionDigits: 1 })}tr`;
  if (Math.abs(v) >= 1e3) return `${(v / 1e3).toLocaleString('vi-VN', { maximumFractionDigits: 0 })}k`;
  return String(v);
};

/** Danh sách icon cho danh mục (Font Awesome) */
export const CATEGORY_ICONS = [
  'fa-utensils', 'fa-mug-hot', 'fa-cart-shopping', 'fa-bag-shopping', 'fa-house', 'fa-bolt',
  'fa-car', 'fa-motorcycle', 'fa-gas-pump', 'fa-bus', 'fa-plane', 'fa-heart-pulse',
  'fa-graduation-cap', 'fa-book', 'fa-gamepad', 'fa-film', 'fa-shirt', 'fa-gift',
  'fa-mobile-screen', 'fa-wifi', 'fa-dumbbell', 'fa-paw', 'fa-baby', 'fa-money-bill-wave',
  'fa-sack-dollar', 'fa-briefcase', 'fa-chart-line', 'fa-hand-holding-dollar', 'fa-piggy-bank', 'fa-tag',
];
