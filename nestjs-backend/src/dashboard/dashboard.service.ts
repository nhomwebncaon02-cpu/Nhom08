import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Transaction } from '../transaction/transaction.entity';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(Transaction)
    private transactionRepository: Repository<Transaction>,
  ) {}

  async getSummary(userId: number) {
    // 1. Tính Tổng Thu
    const incomeResult = await this.transactionRepository
      .createQueryBuilder('transaction')
      .leftJoin('transaction.account', 'account')
      .leftJoin('transaction.category', 'category')
      .select('SUM(transaction.Amount)', 'totalIncome')
      .where('account.UserId = :userId', { userId })
      .andWhere('category.Type = :type', { type: 'Income' }) // Đã sửa andHtml thành andWhere
      .getRawOne();

    // 2. Tính Tổng Chi
    const expenseResult = await this.transactionRepository
      .createQueryBuilder('transaction')
      .leftJoin('transaction.account', 'account')
      .leftJoin('transaction.category', 'category')
      .select('SUM(transaction.Amount)', 'totalExpense')
      .where('account.UserId = :userId', { userId })
      .andWhere('category.Type = :type', { type: 'Expense' })
      .getRawOne();

    const income = parseFloat(incomeResult?.totalIncome) || 0;
    const expense = parseFloat(expenseResult?.totalExpense) || 0;

    return {
      totalBalance: income - expense,
      totalIncome: income,
      totalExpense: expense,
    };
  }
}