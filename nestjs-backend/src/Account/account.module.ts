import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AccountController } from './account.controller';
import { AccountService } from './account.service';
import { Account } from './Entity/account.entity';

// Trước đây dùng provider 'DATA_SOURCE' (không tồn tại) -> module sẽ crash nếu được import.
// Đổi sang TypeOrmModule.forFeature giống các module khác.
@Module({
  imports: [TypeOrmModule.forFeature([Account])],
  controllers: [AccountController],
  providers: [AccountService],
})
export class AccountModule {}
