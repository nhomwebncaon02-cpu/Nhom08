import { Controller, Get, Post, Body } from '@nestjs/common';
import { AccountService } from './account.service';
import { Account } from './account.entity';

@Controller('accounts')
export class AccountController {
  constructor(private readonly accountService: AccountService) {}

  @Get()
  findAll(): Promise<Account[]> {
    return this.accountService.findAll();
  }

  @Post()
  create(@Body() accountData: Partial<Account>): Promise<Account> {
    return this.accountService.create(accountData);
  }
}
