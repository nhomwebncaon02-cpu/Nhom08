import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UserService } from '../../user/entities/user.service';
import type { JwtUser } from '../decorators/current-user.decorator';
import type { UserRole } from '../../user/entities/user.entity';

export interface JwtPayload {
  sub: number;
  username: string;
  role: UserRole;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly userService: UserService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET as string,
    });
  }

  // Được gọi sau khi chữ ký + hạn token hợp lệ. Giá trị trả về gắn vào req.user
  async validate(payload: JwtPayload): Promise<JwtUser> {
    // Kiểm tra user còn tồn tại (token của user đã bị xóa sẽ không dùng được nữa)
    const user = await this.userService.findOne(payload.sub);
    if (!user) throw new UnauthorizedException('Tài khoản không còn tồn tại');
    return { userId: user.UserId, username: user.Username, role: user.Role };
  }
}
