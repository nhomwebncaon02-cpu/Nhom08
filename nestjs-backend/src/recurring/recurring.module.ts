import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RecurringTransaction } from './recurring.entity';
import { RecurringService } from './recurring.service';
import { RecurringController } from './recurring.controller';
import { Account } from '../Account/Entity/account.entity';
import { Category } from '../category/category.entity';
import { TransactionModule } from '../transaction/transaction.module';

@Module({
  imports: [TypeOrmModule.forFeature([RecurringTransaction, Account, Category]), TransactionModule],
  controllers: [RecurringController],
  providers: [RecurringService],
})
export class RecurringModule {}
