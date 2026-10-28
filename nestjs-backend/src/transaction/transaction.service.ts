import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { Account } from '../Account/Entity/account.entity';
import type { JwtUser } from '../auth/decorators/current-user.decorator';
import { Category } from '../category/category.entity';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { TransactionFilterDto } from './dto/transaction-filter.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { Transaction } from './transaction.entity';

@Injectable()
export class TransactionService {
  constructor(
    @InjectRepository(Transaction)
    private readonly transactionRepository: Repository<Transaction>,
    private readonly dataSource: DataSource,
  ) {}

  async create(user: JwtUser, dto: CreateTransactionDto): Promise<Transaction> {
    const transactionId = await this.dataSource.transaction(async (manager) => {
      const account = await this.lockAccounts(manager, user.userId, [dto.AccountId]).then(
        (accounts) => accounts[0],
      );
      if (!account) throw new NotFoundException('Không tìm thấy ví');

      const category = await this.getVisibleCategory(manager, user, dto.CategoryId);
      const transaction = manager.getRepository(Transaction).create({
        AccountId: dto.AccountId,
        CategoryId: dto.CategoryId,
        Amount: dto.Amount,
        TransactionDate: dto.TransactionDate ? new Date(dto.TransactionDate) : new Date(),
        Note: dto.Note ?? null,
      });
      const saved = await manager.getRepository(Transaction).save(transaction);
      this.applyBalanceChange(account, category.type, Number(dto.Amount));
      await manager.getRepository(Account).save(account);
      return saved.TransactionId;
    });

    return this.findOne(user, transactionId);
  }

  async findAll(user: JwtUser, filters: TransactionFilterDto): Promise<Transaction[]> {
    if (filters.FromDate && filters.ToDate && filters.FromDate > filters.ToDate) {
      throw new BadRequestException('Ngày bắt đầu không được sau ngày kết thúc');
    }

    const query = this.transactionRepository
      .createQueryBuilder('transaction')
      .innerJoinAndSelect('transaction.account', 'account')
      .innerJoinAndSelect('transaction.category', 'category')
      .where('account.UserId = :userId', { userId: user.userId });

    if (filters.AccountId) {
      query.andWhere('transaction.AccountId = :accountId', { accountId: filters.AccountId });
    }
    if (filters.CategoryId) {
      query.andWhere('transaction.CategoryId = :categoryId', {
        categoryId: filters.CategoryId,
      });
    }
    if (filters.Type) {
      query.andWhere('category.type = :type', { type: filters.Type });
    }
    if (filters.FromDate) {
      query.andWhere('transaction.TransactionDate >= :fromDate', {
        fromDate: `${filters.FromDate} 00:00:00`,
      });
    }
    if (filters.ToDate) {
      query.andWhere('transaction.TransactionDate < DATE_ADD(:toDate, INTERVAL 1 DAY)', {
        toDate: filters.ToDate,
      });
    }

    return query
      .orderBy('transaction.TransactionDate', 'DESC')
      .addOrderBy('transaction.TransactionId', 'DESC')
      .getMany();
  }

  async findOne(user: JwtUser, id: number): Promise<Transaction> {
    const transaction = await this.transactionRepository
      .createQueryBuilder('transaction')
      .innerJoinAndSelect('transaction.account', 'account')
      .innerJoinAndSelect('transaction.category', 'category')
      .where('transaction.TransactionId = :id', { id })
      .andWhere('account.UserId = :userId', { userId: user.userId })
      .getOne();

    if (!transaction) throw new NotFoundException('Không tìm thấy giao dịch');
    return transaction;
  }

  async update(user: JwtUser, id: number, dto: UpdateTransactionDto): Promise<Transaction> {
    await this.dataSource.transaction(async (manager) => {
      const repository = manager.getRepository(Transaction);
      const current = await repository
        .createQueryBuilder('transaction')
        .setLock('pessimistic_write')
        .where('transaction.TransactionId = :id', { id })
        .getOne();
      if (!current) throw new NotFoundException('Không tìm thấy giao dịch');

      const nextAccountId = dto.AccountId ?? current.AccountId;
      const accounts = await this.lockAccounts(manager, user.userId, [
        current.AccountId,
        nextAccountId,
      ]);
      const currentAccount = accounts.find((account) => account.AccountId === current.AccountId);
      const nextAccount = accounts.find((account) => account.AccountId === nextAccountId);
      if (!currentAccount || !nextAccount) throw new NotFoundException('Không tìm thấy giao dịch');

      const currentCategory = await manager.getRepository(Category).findOne({
        where: { categoryId: current.CategoryId },
      });
      if (!currentCategory) throw new NotFoundException('Không tìm thấy danh mục giao dịch');
      const nextCategory = await this.getVisibleCategory(
        manager,
        user,
        dto.CategoryId ?? current.CategoryId,
      );

      const nextAmount = dto.Amount ?? Number(current.Amount);
      this.applyBalanceChange(currentAccount, currentCategory.type, -Number(current.Amount));
      this.applyBalanceChange(nextAccount, nextCategory.type, nextAmount);

      Object.assign(current, dto, {
        TransactionDate: dto.TransactionDate
          ? new Date(dto.TransactionDate)
          : current.TransactionDate,
      });
      await repository.save(current);
      await manager.getRepository(Account).save(accounts);
    });

    return this.findOne(user, id);
  }

  async remove(user: JwtUser, id: number): Promise<{ message: string }> {
    await this.dataSource.transaction(async (manager) => {
      const repository = manager.getRepository(Transaction);
      const transaction = await repository
        .createQueryBuilder('transaction')
        .setLock('pessimistic_write')
        .where('transaction.TransactionId = :id', { id })
        .getOne();
      if (!transaction) throw new NotFoundException('Không tìm thấy giao dịch');

      const accounts = await this.lockAccounts(manager, user.userId, [transaction.AccountId]);
      const account = accounts[0];
      if (!account) throw new NotFoundException('Không tìm thấy giao dịch');

      const category = await manager.getRepository(Category).findOne({
        where: { categoryId: transaction.CategoryId },
      });
      if (!category) throw new NotFoundException('Không tìm thấy danh mục giao dịch');

      this.applyBalanceChange(account, category.type, -Number(transaction.Amount));
      await manager.getRepository(Account).save(account);
      await repository.remove(transaction);
    });

    return { message: 'Đã xóa giao dịch' };
  }

  private async lockAccounts(
    manager: EntityManager,
    userId: number,
    accountIds: number[],
  ): Promise<Account[]> {
    const ids = [...new Set(accountIds)].sort((first, second) => first - second);
    return manager
      .getRepository(Account)
      .createQueryBuilder('account')
      .setLock('pessimistic_write')
      .where('account.AccountId IN (:...ids)', { ids })
      .andWhere('account.UserId = :userId', { userId })
      .orderBy('account.AccountId', 'ASC')
      .getMany();
  }

  private async getVisibleCategory(
    manager: EntityManager,
    user: JwtUser,
    categoryId: number,
  ): Promise<Category> {
    const category = await manager.getRepository(Category).findOne({ where: { categoryId } });
    if (
      !category ||
      (user.role !== 'admin' && category.userId !== null && category.userId !== user.userId)
    ) {
      throw new NotFoundException('Không tìm thấy danh mục');
    }
    return category;
  }

  private applyBalanceChange(account: Account, type: Category['type'], amount: number): void {
    account.Balance = Number(account.Balance) + (type === 'Income' ? amount : -amount);
  }
}
