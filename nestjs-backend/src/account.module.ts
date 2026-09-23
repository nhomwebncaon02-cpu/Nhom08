import { Module } from '@nestjs/common';
import { AccountController } from './account.controller';
import { AccountService } from './account.service';
import { accountProviders } from './account.provider';
import { DatabaseModule } from './database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [AccountController],
  providers: [...accountProviders, AccountService],
})
export class AccountModule {} 
