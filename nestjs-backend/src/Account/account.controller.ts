import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe } from '@nestjs/common';
import { AccountService } from './account.service';
import { CreateAccountDto } from './dto/create-account.dto';
import { UpdateAccountDto } from './dto/update-account.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtUser } from '../auth/decorators/current-user.decorator';

/** CRUD Ví (Wallet) — mọi thao tác chỉ áp dụng cho ví của user đang đăng nhập */
@Controller('accounts')
export class AccountController {
  constructor(private readonly accountService: AccountService) {}

  @Get()
  findMine(@CurrentUser() user: JwtUser) {
    return this.accountService.findAllByUser(user.userId);
  }

  @Get('summary')
  summary(@CurrentUser() user: JwtUser) {
    return this.accountService.summary(user.userId);
  }

  @Get(':id')
  findOne(@CurrentUser() user: JwtUser, @Param('id', ParseIntPipe) id: number) {
    return this.accountService.findOneForUser(user.userId, id);
  }

  @Post()
  create(@CurrentUser() user: JwtUser, @Body() dto: CreateAccountDto) {
    return this.accountService.create(user.userId, dto);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: JwtUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateAccountDto,
  ) {
    return this.accountService.update(user.userId, id, dto);
  }

  @Delete(':id')
  remove(@CurrentUser() user: JwtUser, @Param('id', ParseIntPipe) id: number) {
    return this.accountService.remove(user.userId, id);
  }
}
