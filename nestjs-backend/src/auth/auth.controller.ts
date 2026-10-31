import { Controller, Post, Body, Get, HttpCode, HttpStatus, Ip } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { Public } from './decorators/public.decorator';
import { CurrentUser } from './decorators/current-user.decorator';
import type { JwtUser } from './decorators/current-user.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /** POST /auth/register  { fullName, username, email, password } */
  @Public()
  @Post('register')
  register(@Body() dto: RegisterDto, @Ip() ip: string) {
    return this.authService.register(dto, ip);
  }

  /** POST /auth/login  { username (hoặc email), password } -> { access_token, user } */
  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body() dto: LoginDto, @Ip() ip: string) {
    return this.authService.login(dto, ip);
  }

  /** GET /auth/me  (Header: Authorization: Bearer <token>) -> thông tin user hiện tại */
  @Get('me')
  me(@CurrentUser() user: JwtUser) {
    return this.authService.me(user.userId);
  }
}
