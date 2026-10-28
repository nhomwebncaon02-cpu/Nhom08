import { ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

/**
 * Guard toàn cục: mọi route đều yêu cầu header
 *   Authorization: Bearer <access_token>
 * trừ những route gắn @Public().
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;
    return super.canActivate(context);
  }

  handleRequest<TUser = any>(err: any, user: any, info: any): TUser {
    if (err || !user) {
      const expired = info?.name === 'TokenExpiredError';
      throw err ?? new UnauthorizedException(
        expired ? 'Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại' : 'Bạn cần đăng nhập để truy cập',
      );
    }
    return user as TUser;
  }
}
