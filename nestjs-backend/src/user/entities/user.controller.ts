import {
  Controller, Get, Body, Param, Put, Patch, Delete, ParseIntPipe, ForbiddenException, Query, Ip,
} from '@nestjs/common';
import { UserService } from './user.service';
import { UpdateUserDto } from '../dto/update-user.dto';
import { QueryUsersDto } from '../dto/query-users.dto';
import { SetStatusDto } from '../dto/set-status.dto';
import { ResetPasswordDto } from '../dto/reset-password.dto';
import { Roles } from '../../auth/decorators/roles.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import type { JwtUser } from '../../auth/decorators/current-user.decorator';
import { AuditService } from '../../audit/audit.service';

/** [Admin] Quản lý người dùng — CHỈ ADMIN */
@Roles('admin')
@Controller('users')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly audit: AuditService,
  ) {}

  /** GET /users?search=&role=&status=active|locked&page=1&limit=10 */
  @Get()
  findPaged(@Query() query: QueryUsersDto) {
    return this.userService.findPaged(query);
  }

  /** Chi tiết + thống kê của 1 người dùng */
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.userService.getDetail(id);
  }

  /** Sửa họ tên / email / vai trò */
  @Put(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateUserDto,
    @CurrentUser() me: JwtUser,
    @Ip() ip: string,
  ) {
    if (me.userId === id && dto.Role && dto.Role !== 'admin') {
      throw new ForbiddenException('Không thể tự hạ quyền admin của chính mình');
    }
    const before = await this.userService.getOrFail(id);
    const user = await this.userService.update(id, dto);
    const roleChanged = dto.Role && dto.Role !== before.Role;
    await this.audit.log({
      userId: me.userId,
      username: me.username,
      action: roleChanged ? 'USER_ROLE' : 'USER_UPDATE',
      detail: roleChanged
        ? `Đổi vai trò "${user.Username}": ${before.Role} -> ${user.Role}`
        : `Cập nhật thông tin "${user.Username}"`,
      ip,
    });
    return user;
  }

  /** Khoá / mở khoá tài khoản */
  @Patch(':id/status')
  async setStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: SetStatusDto,
    @CurrentUser() me: JwtUser,
    @Ip() ip: string,
  ) {
    if (me.userId === id) throw new ForbiddenException('Không thể tự khoá tài khoản của chính mình');
    const user = await this.userService.setActive(id, dto.IsActive);
    await this.audit.log({
      userId: me.userId,
      username: me.username,
      action: dto.IsActive ? 'USER_UNLOCK' : 'USER_LOCK',
      detail: `${dto.IsActive ? 'Mở khoá' : 'Khoá'} tài khoản "${user.Username}"`,
      ip,
    });
    return user;
  }

  /** Đặt lại mật khẩu cho người dùng */
  @Patch(':id/reset-password')
  async resetPassword(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ResetPasswordDto,
    @CurrentUser() me: JwtUser,
    @Ip() ip: string,
  ) {
    const user = await this.userService.getOrFail(id);
    await this.userService.setPassword(id, dto.newPassword);
    await this.audit.log({
      userId: me.userId,
      username: me.username,
      action: 'USER_RESET_PASSWORD',
      detail: `Đặt lại mật khẩu cho "${user.Username}"`,
      ip,
    });
    return { message: `Đã đặt lại mật khẩu cho ${user.Username}` };
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number, @CurrentUser() me: JwtUser, @Ip() ip: string) {
    if (me.userId === id) throw new ForbiddenException('Không thể tự xóa tài khoản admin đang đăng nhập');
    const user = await this.userService.getOrFail(id);
    await this.userService.remove(id);
    await this.audit.log({
      userId: me.userId,
      username: me.username,
      action: 'USER_DELETE',
      detail: `Xoá tài khoản "${user.Username}" (${user.Email})`,
      ip,
    });
    return { message: 'Đã xóa người dùng' };
  }
}
