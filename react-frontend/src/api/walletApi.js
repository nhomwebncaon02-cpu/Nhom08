import api from './axiosClient';

// [Thành viên 2] Ví (Wallet) = bảng Account ở backend
export const walletApi = {
  list: () => api.get('/accounts').then((r) => r.data),
  get: (id) => api.get(`/accounts/${id}`).then((r) => r.data),
  create: (data) => api.post('/accounts', data).then((r) => r.data),
  update: (id, data) => api.patch(`/accounts/${id}`, data).then((r) => r.data),
  remove: (id) => api.delete(`/accounts/${id}`).then((r) => r.data),
  /** Chuyển tiền giữa 2 ví: { FromAccountId, ToAccountId, Amount, Note? } */
  transfer: (data) => api.post('/accounts/transfer', data).then((r) => r.data),
};

export const WALLET_TYPES = [
  { value: 'Cash', label: 'Tiền mặt', icon: 'fa-money-bill-wave', color: 'success' },
  { value: 'Bank', label: 'Ngân hàng', icon: 'fa-building-columns', color: 'primary' },
  { value: 'Credit', label: 'Thẻ tín dụng', icon: 'fa-credit-card', color: 'danger' },
  { value: 'E-Wallet', label: 'Ví điện tử', icon: 'fa-mobile-screen', color: 'info' },
  { value: 'Saving', label: 'Tiết kiệm', icon: 'fa-piggy-bank', color: 'warning' },
  { value: 'Other', label: 'Khác', icon: 'fa-wallet', color: 'secondary' },
];

export const walletTypeOf = (value) => WALLET_TYPES.find((t) => t.value === value) ?? WALLET_TYPES[5];
