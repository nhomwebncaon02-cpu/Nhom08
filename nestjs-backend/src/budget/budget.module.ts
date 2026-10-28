import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Budget } from './budget.entity';
import { Category } from '../category/category.entity';
import { BudgetService } from './budget.service';
import { BudgetController } from './budget.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Budget, Category])],
  controllers: [BudgetController],
  providers: [BudgetService],
  // export để TransactionModule gọi budgetService.assertWithinBudget(...)
  exports: [BudgetService],
})
export class BudgetModule {}
