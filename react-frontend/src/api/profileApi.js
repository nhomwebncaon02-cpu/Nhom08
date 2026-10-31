import api from './axiosClient';

export const profileApi = {
  get: () => api.get('/profile').then((r) => r.data),
  update: (data) => api.patch('/profile', data).then((r) => r.data),
  changePassword: (data) => api.patch('/profile/password', data).then((r) => r.data),
};
