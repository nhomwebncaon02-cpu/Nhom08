import { Controller, Get, Post, Body } from '@nestjs/common';
import { AccountService } from './account.service';
import { CreateAccountDto } from './dto/create-account.dto';
import { CurrentUser, JwtUser } from '../auth/decorators/current-user.decorator';

@Controller('accounts')
export class AccountController {
  constructor(private readonly accountService: AccountService) {}

  @Get()
  findMine(@CurrentUser() user: JwtUser) {
    return this.accountService.findAllByUser(user.userId);
  }

  @Post()
  create(@CurrentUser() user: JwtUser, @Body() dto: CreateAccountDto) {
    return this.accountService.create(user.userId, dto);
  }
}
