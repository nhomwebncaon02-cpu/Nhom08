import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { UserRole } from '../../user/entities/user.entity';

/** Thông tin user lấy từ JWT (do JwtStrategy.validate trả về) */
export interface JwtUser {
  userId: number;
  username: string;
  role: UserRole;
}

/** Lấy user đang đăng nhập: method(@CurrentUser() user: JwtUser) */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): JwtUser => ctx.switchToHttp().getRequest().user,
);
