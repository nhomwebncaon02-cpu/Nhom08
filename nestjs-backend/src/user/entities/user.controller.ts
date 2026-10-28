import {
  Controller, Get, Body, Param, Put, Delete, ParseIntPipe, NotFoundException, ForbiddenException,
} from '@nestjs/common';
import { UserService } from './user.service';
import { UpdateUserDto } from '../dto/update-user.dto';
import { Roles } from '../../auth/decorators/roles.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import type { JwtUser } from '../../auth/decorators/current-user.decorator';

/**
 * Quản lý người dùng — CHỈ ADMIN.
 * (Đã bỏ POST /users vì cho phép tạo user với PasswordHash tùy ý.
 *  Người dùng mới phải đi qua POST /auth/register để mật khẩu được băm.)
 */
@Roles('admin')
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  findAll() {
    return this.userService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const user = await this.userService.findOne(id);
    if (!user) throw new NotFoundException(`Không tìm thấy người dùng ID: ${id}`);
    return user;
  }

  @Put(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateUserDto) {
    return this.userService.update(id, dto);
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number, @CurrentUser() me: JwtUser) {
    if (me.userId === id) throw new ForbiddenException('Không thể tự xóa tài khoản admin đang đăng nhập');
    await this.userService.remove(id);
    return { message: 'Đã xóa người dùng' };
  }
}
