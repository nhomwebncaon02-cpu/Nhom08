import { HttpException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { RecurringTransaction, RecurringFrequency } from './recurring.entity';
import { CreateRecurringDto } from './dto/create-recurring.dto';
import { UpdateRecurringDto } from './dto/update-recurring.dto';
import { Account } from '../Account/Entity/account.entity';
import { Category } from '../category/category.entity';
import { TransactionService } from '../transaction/transaction.service';
import type { JwtUser } from '../auth/decorators/current-user.decorator';
import { todayYMD, toYMD } from '../common/utils/date.util';

/** Tối đa số kỳ được bù cho 1 quy tắc trong 1 lần chạy (tránh tạo hàng trăm giao dịch) */
const MAX_RUNS_PER_RULE = 24;

/** Cộng 1 chu kỳ vào ngày 'YYYY-MM-DD' (31/1 + 1 tháng -> 28/2 hoặc 29/2) */
export function addPeriod(ymd: string, freq: RecurringFrequency): string {
  const [y, m, d] = ymd.slice(0, 10).split('-').map(Number);
  if (freq === 'daily') return toYMD(new Date(y, m - 1, d + 1));
  if (freq === 'weekly') return toYMD(new Date(y, m - 1, d + 7));
  const addMonths = freq === 'monthly' ? 1 : 12;
  const lastDay = new Date(y, m - 1 + addMonths + 1, 0).getDate();
  return toYMD(new Date(y, m - 1 + addMonths, Math.min(d, lastDay)));
}

@Injectable()
export class RecurringService {
  constructor(
    @InjectRepository(RecurringTransaction) private readonly repo: Repository<RecurringTransaction>,
    @InjectRepository(Account) private readonly accountRepo: Repository<Account>,
    @InjectRepository(Category) private readonly categoryRepo: Repository<Category>,
    private readonly transactionService: TransactionService,
  ) {}

  findAll(userId: number) {
    return this.repo.find({
      where: { UserId: userId },
      relations: { account: true, category: true },
      order: { NextDate: 'ASC' },
    });
  }

  async findOne(userId: number, id: number) {
    const rule = await this.repo.findOne({ where: { RecurringId: id, UserId: userId }, relations: { account: true, category: true } });
    if (!rule) throw new NotFoundException('Không tìm thấy giao dịch định kỳ');
    return rule;
  }

  async create(userId: number, dto: CreateRecurringDto) {
    await this.assertOwnership(userId, dto.AccountId, dto.CategoryId);
    const saved = await this.repo.save(
      this.repo.create({
        UserId: userId,
        AccountId: dto.AccountId,
        CategoryId: dto.CategoryId,
        Amount: dto.Amount,
        Frequency: dto.Frequency,
        NextDate: dto.NextDate.slice(0, 10),
        Note: dto.Note ?? null,
        IsActive: true,
      }),
    );
    return this.findOne(userId, saved.RecurringId);
  }

  async update(userId: number, id: number, dto: UpdateRecurringDto) {
    const rule = await this.findOne(userId, id);
    await this.assertOwnership(userId, dto.AccountId ?? rule.AccountId, dto.CategoryId ?? rule.CategoryId);
    await this.repo.update(id, {
      AccountId: dto.AccountId ?? rule.AccountId,
      CategoryId: dto.CategoryId ?? rule.CategoryId,
      Amount: dto.Amount ?? rule.Amount,
      Frequency: dto.Frequency ?? rule.Frequency,
      NextDate: dto.NextDate ? dto.NextDate.slice(0, 10) : rule.NextDate,
      Note: dto.Note ?? rule.Note,
      IsActive: dto.IsActive ?? rule.IsActive,
    });
    return this.findOne(userId, id);
  }

  async remove(userId: number, id: number) {
    const rule = await this.findOne(userId, id);
    await this.repo.remove(rule);
    return { message: 'Đã xoá giao dịch định kỳ' };
  }

  /**
   * Tạo các giao dịch đã đến hạn (NextDate <= hôm nay) rồi dời NextDate sang kỳ sau.
   * FE gọi khi mở trang Tổng quan / Giao dịch định kỳ.
   * Khoản chi vượt hạn mức sẽ bị chặn (do TransactionService kiểm tra ngân sách) -> bỏ qua và báo lại.
   */
  async processDue(user: JwtUser) {
    const today = todayYMD();
    const rules = await this.repo.find({ where: { UserId: user.userId, IsActive: true } });
    const created: { RecurringId: number; date: string; amount: number }[] = [];
    const skipped: { RecurringId: number; date: string; reason: string }[] = [];

    for (const rule of rules) {
      let next = String(rule.NextDate).slice(0, 10);
      let runs = 0;
      while (next <= today && runs < MAX_RUNS_PER_RULE) {
        try {
          await this.transactionService.create(user, {
            AccountId: rule.AccountId,
            CategoryId: rule.CategoryId,
            Amount: Number(rule.Amount),
            TransactionDate: next,
            Note: `[Định kỳ] ${rule.Note ?? ''}`.trim(),
          });
          created.push({ RecurringId: rule.RecurringId, date: next, amount: Number(rule.Amount) });
        } catch (e) {
          const reason = e instanceof HttpException ? String((e.getResponse() as { message?: unknown })?.message ?? e.message) : (e as Error).message;
          skipped.push({ RecurringId: rule.RecurringId, date: next, reason });
        }
        next = addPeriod(next, rule.Frequency);
        runs++;
      }
      if (runs > 0) await this.repo.update(rule.RecurringId, { NextDate: next });
    }
    return { created: created.length, skipped, details: created };
  }

  private async assertOwnership(userId: number, accountId: number, categoryId: number) {
    const account = await this.accountRepo.findOne({ where: { AccountId: accountId, UserId: userId } });
    if (!account) throw new NotFoundException('Không tìm thấy ví');
    const category = await this.categoryRepo.findOne({
      where: [
        { categoryId, userId: IsNull() },
        { categoryId, userId },
      ],
    });
    if (!category) throw new NotFoundException('Không tìm thấy danh mục');
  }
}
