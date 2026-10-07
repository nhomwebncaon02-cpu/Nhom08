import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(private jwtService: JwtService) {}

  login(userDto: any) {
    if (userDto.username === 'admin' && userDto.password === '123456') {
      const payload = { username: userDto.username, role: 'quantrivien' };
      
      return {
        message: 'Đăng nhập thành công!',
        access_token: this.jwtService.sign(payload), 
      };
    }
    throw new UnauthorizedException('Sai tài khoản hoặc mật khẩu');
  }
}