import { BadRequestException, Body, Controller, Get, Ip, Patch } from '@nestjs/common';
import { UserService } from './entities/user.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtUser } from '../auth/decorators/current-user.decorator';
import { AuditService } from '../audit/audit.service';

/** Hồ sơ cá nhân của người đang đăng nhập (user hoặc admin) */
@Controller('profile')
export class ProfileController {
  constructor(
    private readonly userService: UserService,
    private readonly audit: AuditService,
  ) {}

  @Get()
  me(@CurrentUser() me: JwtUser) {
    return this.userService.getOrFail(me.userId);
  }

  @Patch()
  update(@CurrentUser() me: JwtUser, @Body() dto: UpdateProfileDto) {
    return this.userService.updateProfile(me.userId, dto);
  }

  @Patch('password')
  async changePassword(@CurrentUser() me: JwtUser, @Body() dto: ChangePasswordDto, @Ip() ip: string) {
    if (!(await this.userService.verifyPassword(me.userId, dto.currentPassword))) {
      throw new BadRequestException('Mật khẩu hiện tại không đúng');
    }
    if (dto.currentPassword === dto.newPassword) {
      throw new BadRequestException('Mật khẩu mới phải khác mật khẩu hiện tại');
    }
    await this.userService.setPassword(me.userId, dto.newPassword);
    await this.audit.log({ userId: me.userId, username: me.username, action: 'PASSWORD_CHANGE', detail: 'Tự đổi mật khẩu', ip });
    return { message: 'Đổi mật khẩu thành công' };
  }
}
