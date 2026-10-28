import api from './axiosClient';

// Ví (Wallet) = bảng Account ở backend
export const walletApi = {
  list: () => api.get('/accounts').then((r) => r.data),
  get: (id) => api.get(`/accounts/${id}`).then((r) => r.data),
  create: (data) => api.post('/accounts', data).then((r) => r.data),
  update: (id, data) => api.patch(`/accounts/${id}`, data).then((r) => r.data),
  remove: (id) => api.delete(`/accounts/${id}`).then((r) => r.data),
};

export const WALLET_TYPES = [
  { value: 'Cash', label: 'Tiền mặt', icon: 'fa-money-bill-wave', color: 'bg-emerald-100 text-emerald-700' },
  { value: 'Bank', label: 'Ngân hàng', icon: 'fa-building-columns', color: 'bg-blue-100 text-blue-700' },
  { value: 'Credit', label: 'Thẻ tín dụng', icon: 'fa-credit-card', color: 'bg-purple-100 text-purple-700' },
  { value: 'E-Wallet', label: 'Ví điện tử', icon: 'fa-mobile-screen', color: 'bg-pink-100 text-pink-700' },
  { value: 'Saving', label: 'Tiết kiệm', icon: 'fa-piggy-bank', color: 'bg-amber-100 text-amber-700' },
  { value: 'Other', label: 'Khác', icon: 'fa-wallet', color: 'bg-slate-100 text-slate-700' },
];

export const walletTypeOf = (value) => WALLET_TYPES.find((t) => t.value === value) ?? WALLET_TYPES[5];
