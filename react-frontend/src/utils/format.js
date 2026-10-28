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
