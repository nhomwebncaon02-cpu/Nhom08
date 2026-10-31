import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Transaction } from './transaction.entity';
import { TransactionService } from './transaction.service';
import { TransactionController } from './transaction.controller';
import { Account } from '../Account/Entity/account.entity';
import { Category } from '../category/category.entity';
import { BudgetModule } from '../budget/budget.module';

@Module({
  imports: [TypeOrmModule.forFeature([Transaction, Account, Category]), BudgetModule],
  controllers: [TransactionController],
  providers: [TransactionService],
  exports: [TransactionService], // dùng cho giao dịch định kỳ (RecurringModule)
})
export class TransactionModule {}
