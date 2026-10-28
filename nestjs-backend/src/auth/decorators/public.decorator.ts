import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';
/** Đánh dấu route KHÔNG cần đăng nhập (vd: /auth/login, /auth/register) */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
