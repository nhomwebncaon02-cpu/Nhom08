import {
  BadRequestException, ConflictException, Injectable, NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Budget } from './budget.entity';
import { Category } from '../category/category.entity';
import { CreateBudgetDto } from './dto/create-budget.dto';
import { UpdateBudgetDto } from './dto/update-budget.dto';
import { CheckExpenseDto } from './dto/check-expense.dto';
import { todayYMD, toYMD, ymdToDateTime } from '../common/utils/date.util';

/** Đã chi >= 80% hạn mức thì cảnh báo */
export const WARNING_PERCENT = 80;

export type BudgetStatus = 'ok' | 'warning' | 'exceeded';

/** Dữ liệu ngân sách trả về cho FE (kèm số đã chi & trạng thái) */
export interface BudgetView {
  BudgetId: number;
  CategoryId: number;
  CategoryName: string;
  CategoryIcon: string | null;
  AmountLimit: number;
  StartDate: string;
  EndDate: string;
  Spent: number;
  Remaining: number;
  Percent: number;
  Status: BudgetStatus;
  IsActive: boolean; // hôm nay nằm trong khoảng thời gian của ngân sách
}

export interface ExpenseCheckResult {
  allowed: boolean;
  status: BudgetStatus | 'no-budget';
  message: string;
  budget: BudgetView | null;
  spentAfter?: number;
  percentAfter?: number;
}

@Injectable()
export class BudgetService {
  constructor(
    @InjectRepository(Budget) private readonly budgetRepo: Repository<Budget>,
    @InjectRepository(Category) private readonly categoryRepo: Repository<Category>,
  ) {}

  // ======================= CRUD =======================

  async findAll(userId: number): Promise<BudgetView[]> {
    const budgets = await this.budgetRepo.find({
      where: { UserId: userId },
      relations: { category: true },
      order: { StartDate: 'DESC' },
    });
    return Promise.all(budgets.map((b) => this.toView(userId, b)));
  }

  async findOne(userId: number, id: number): Promise<BudgetView> {
    return this.toView(userId, await this.getOwned(userId, id));
  }

  async create(userId: number, dto: CreateBudgetDto): Promise<BudgetView> {
    await this.validateBudget(userId, dto.CategoryId, dto.StartDate, dto.EndDate);
    const budget = this.budgetRepo.create({
      UserId: userId,
      CategoryId: dto.CategoryId,
      AmountLimit: dto.AmountLimit,
      StartDate: ymdToDateTime(dto.StartDate) as unknown as Date,
      EndDate: ymdToDateTime(dto.EndDate) as unknown as Date,
    });
    const saved = await this.budgetRepo.save(budget);
    return this.findOne(userId, saved.BudgetId);
  }

  async update(userId: number, id: number, dto: UpdateBudgetDto): Promise<BudgetView> {
    const budget = await this.getOwned(userId, id);
    const categoryId = dto.CategoryId ?? budget.CategoryId;
    const start = dto.StartDate ?? toYMD(budget.StartDate);
    const end = dto.EndDate ?? toYMD(budget.EndDate);
    await this.validateBudget(userId, categoryId, start, end, id);

    await this.budgetRepo.update(id, {
      CategoryId: categoryId,
      AmountLimit: dto.AmountLimit ?? budget.AmountLimit,
      StartDate: ymdToDateTime(start) as unknown as Date,
      EndDate: ymdToDateTime(end) as unknown as Date,
    });
    return this.findOne(userId, id);
  }

  async remove(userId: number, id: number) {
    const budget = await this.getOwned(userId, id);
    await this.budgetRepo.remove(budget);
    return { message: 'Đã xoá ngân sách' };
  }

  // ======================= BUDGET ALERTS =======================

  /** Các ngân sách đang hiệu lực đã chạm ngưỡng cảnh báo hoặc vượt hạn mức */
  async getAlerts(userId: number): Promise<BudgetView[]> {
    const all = await this.findAll(userId);
    return all
      .filter((b) => b.IsActive && b.Status !== 'ok')
      .sort((a, b) => b.Percent - a.Percent);
  }

  /**
   * Kiểm tra 1 khoản chi trước khi tạo giao dịch.
   * - Không có ngân sách cho danh mục/ngày đó  -> cho phép
   * - Sau khi chi mà vượt hạn mức               -> CHẶN (allowed = false)
   * - Sau khi chi mà >= 80% hạn mức              -> cho phép nhưng cảnh báo
   */
  async checkExpense(userId: number, dto: CheckExpenseDto, excludeTransactionId?: number): Promise<ExpenseCheckResult> {
    const date = dto.Date ?? todayYMD();
    const category = await this.categoryRepo.findOne({ where: { categoryId: dto.CategoryId } });
    if (!category || (category.userId != null && category.userId !== userId)) {
      throw new NotFoundException('Không tìm thấy danh mục');
    }
    if (category.type !== 'Expense') {
      return { allowed: true, status: 'no-budget', message: 'Danh mục thu nhập không áp dụng hạn mức', budget: null };
    }

    const budget = await this.budgetRepo
      .createQueryBuilder('b')
      .leftJoinAndSelect('b.category', 'c')
      .where('b.UserId = :userId AND b.CategoryId = :cid', { userId, cid: dto.CategoryId })
      .andWhere('DATE(b.StartDate) <= :date AND DATE(b.EndDate) >= :date', { date })
      .getOne();

    if (!budget) {
      return { allowed: true, status: 'no-budget', message: 'Danh mục này chưa đặt hạn mức', budget: null };
    }

    const view = await this.toView(userId, budget, excludeTransactionId);
    const spentAfter = view.Spent + dto.Amount;
    const percentAfter = this.percent(spentAfter, view.AmountLimit);
    const fmt = (n: number) => n.toLocaleString('vi-VN') + 'đ';

    if (spentAfter > view.AmountLimit) {
      return {
        allowed: false,
        status: 'exceeded',
        message:
          `Vượt hạn mức "${view.CategoryName}": đã chi ${fmt(view.Spent)}/${fmt(view.AmountLimit)}, ` +
          `chỉ còn ${fmt(Math.max(view.Remaining, 0))} nhưng khoản chi là ${fmt(dto.Amount)}.`,
        budget: view,
        spentAfter,
        percentAfter,
      };
    }
    if (percentAfter >= WARNING_PERCENT) {
      return {
        allowed: true,
        status: 'warning',
        message: `Cảnh báo: sau khoản chi này bạn đã dùng ${percentAfter}% hạn mức "${view.CategoryName}".`,
        budget: view,
        spentAfter,
        percentAfter,
      };
    }
    return {
      allowed: true,
      status: 'ok',
      message: `Trong hạn mức: sau khoản chi này đã dùng ${percentAfter}% ngân sách "${view.CategoryName}".`,
      budget: view,
      spentAfter,
      percentAfter,
    };
  }

  /**
   * Dùng trong TransactionService khi tạo/sửa khoản chi:
   *   await this.budgetService.assertWithinBudget(userId, { CategoryId, Amount, Date });
   * Ném lỗi 400 nếu vượt hạn mức -> giao dịch không được lưu.
   */
  async assertWithinBudget(
    userId: number,
    dto: CheckExpenseDto,
    excludeTransactionId?: number, // khi SỬA giao dịch: không tính số tiền cũ của chính nó
  ): Promise<ExpenseCheckResult> {
    const result = await this.checkExpense(userId, dto, excludeTransactionId);
    if (!result.allowed) {
      throw new BadRequestException({ statusCode: 400, error: 'BUDGET_EXCEEDED', message: result.message, budget: result.budget });
    }
    return result;
  }

  // ======================= HELPERS =======================

  private async getOwned(userId: number, id: number): Promise<Budget> {
    const budget = await this.budgetRepo.findOne({
      where: { BudgetId: id, UserId: userId },
      relations: { category: true },
    });
    if (!budget) throw new NotFoundException(`Không tìm thấy ngân sách với ID: ${id}`);
    return budget;
  }

  /** Tổng tiền đã chi của user cho 1 danh mục trong khoảng ngày (tính cả ngày cuối) */
  private async getSpent(
    userId: number,
    categoryId: number,
    start: string,
    end: string,
    excludeTransactionId?: number,
  ): Promise<number> {
    const rows = await this.budgetRepo.query(
      `SELECT COALESCE(SUM(t.Amount), 0) AS spent
         FROM \`Transaction\` t
         JOIN \`Account\` a ON a.AccountId = t.AccountId
        WHERE a.UserId = ?
          AND t.CategoryId = ?
          AND t.TransactionDate >= ?
          AND t.TransactionDate < DATE_ADD(?, INTERVAL 1 DAY)
          AND t.TransactionId <> ?`,
      [userId, categoryId, start, end, excludeTransactionId ?? 0],
    );
    return Number(rows?.[0]?.spent ?? 0);
  }

  private percent(spent: number, limit: number) {
    return limit > 0 ? Math.round((spent / limit) * 100) : 0;
  }

  private async toView(userId: number, b: Budget, excludeTransactionId?: number): Promise<BudgetView> {
    const start = toYMD(b.StartDate);
    const end = toYMD(b.EndDate);
    const spent = await this.getSpent(userId, b.CategoryId, start, end, excludeTransactionId);
    const limit = Number(b.AmountLimit);
    const percent = this.percent(spent, limit);
    const today = todayYMD();
    return {
      BudgetId: b.BudgetId,
      CategoryId: b.CategoryId,
      CategoryName: b.category?.categoryName ?? `Danh mục #${b.CategoryId}`,
      CategoryIcon: b.category?.icon ?? null,
      AmountLimit: limit,
      StartDate: start,
      EndDate: end,
      Spent: spent,
      Remaining: limit - spent,
      Percent: percent,
      Status: spent > limit ? 'exceeded' : percent >= WARNING_PERCENT ? 'warning' : 'ok',
      IsActive: start <= today && today <= end,
    };
  }

  /**
   * Kiểm tra trước khi tạo/sửa ngân sách:
   *  - danh mục tồn tại, user được dùng, và là danh mục CHI (Expense)
   *  - ngày kết thúc >= ngày bắt đầu
   *  - không trùng thời gian với ngân sách khác của cùng danh mục
   */
  private async validateBudget(userId: number, categoryId: number, start: string, end: string, excludeId?: number) {
    const category = await this.categoryRepo.findOne({ where: { categoryId } });
    if (!category || (category.userId != null && category.userId !== userId)) {
      throw new NotFoundException('Không tìm thấy danh mục');
    }
    if (category.type !== 'Expense') {
      throw new BadRequestException('Chỉ đặt hạn mức cho danh mục chi tiêu (Expense)');
    }
    if (end.slice(0, 10) < start.slice(0, 10)) {
      throw new BadRequestException('Ngày kết thúc phải sau hoặc bằng ngày bắt đầu');
    }

    const qb = this.budgetRepo
      .createQueryBuilder('b')
      .where('b.UserId = :userId AND b.CategoryId = :categoryId', { userId, categoryId })
      .andWhere('DATE(b.StartDate) <= :end AND DATE(b.EndDate) >= :start', {
        start: start.slice(0, 10),
        end: end.slice(0, 10),
      });
    if (excludeId) qb.andWhere('b.BudgetId <> :excludeId', { excludeId });

    const overlap = await qb.getOne();
    if (overlap) {
      throw new ConflictException(
        `Danh mục "${category.categoryName}" đã có ngân sách từ ${toYMD(overlap.StartDate)} đến ${toYMD(overlap.EndDate)}`,
      );
    }
  }
}
