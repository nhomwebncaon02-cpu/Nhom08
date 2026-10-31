import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { AuditLog } from '../audit/audit-log.entity';
import { QueryAuditDto } from './dto/query-audit.dto';
import { toYMD } from '../common/utils/date.util';

@Injectable()
export class AdminService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(AuditLog) private readonly auditRepo: Repository<AuditLog>,
  ) {}

  /** Số liệu tổng quan toàn hệ thống cho trang Admin */
  async getStats() {
    const now = new Date();
    const monthStart = toYMD(new Date(now.getFullYear(), now.getMonth(), 1));
    const sixMonthsAgo = toYMD(new Date(now.getFullYear(), now.getMonth() - 5, 1));

    const [users] = await this.dataSource.query(
      `SELECT COUNT(*) AS total,
              SUM(CASE WHEN Role = 'admin' THEN 1 ELSE 0 END) AS admins,
              SUM(CASE WHEN IsActive = 0 THEN 1 ELSE 0 END) AS locked,
              SUM(CASE WHEN CreatedAt >= ? THEN 1 ELSE 0 END) AS newThisMonth
         FROM \`User\``,
      [monthStart],
    );

    const [tx] = await this.dataSource.query(
      `SELECT COUNT(*) AS total,
              SUM(CASE WHEN t.TransactionDate >= ? THEN 1 ELSE 0 END) AS thisMonth,
              COALESCE(SUM(CASE WHEN c.Type = 'Income'  AND t.TransactionDate >= ? THEN t.Amount END), 0) AS incomeThisMonth,
              COALESCE(SUM(CASE WHEN c.Type = 'Expense' AND t.TransactionDate >= ? THEN t.Amount END), 0) AS expenseThisMonth
         FROM \`Transaction\` t JOIN \`Category\` c ON c.CategoryId = t.CategoryId`,
      [monthStart, monthStart, monthStart],
    );

    const [misc] = await this.dataSource.query(
      `SELECT (SELECT COUNT(*) FROM \`Account\`) AS wallets,
              (SELECT COUNT(*) FROM \`Budget\`) AS budgets,
              (SELECT COUNT(*) FROM \`SavingGoal\`) AS goals,
              (SELECT COUNT(*) FROM \`Category\` WHERE UserId IS NULL) AS systemCategories`,
    );

    const userRows: { ym: string; cnt: string }[] = await this.dataSource.query(
      `SELECT DATE_FORMAT(CreatedAt, '%Y-%m') AS ym, COUNT(*) AS cnt FROM \`User\`
        WHERE CreatedAt >= ? GROUP BY ym`,
      [sixMonthsAgo],
    );
    const txRows: { ym: string; cnt: string }[] = await this.dataSource.query(
      `SELECT DATE_FORMAT(TransactionDate, '%Y-%m') AS ym, COUNT(*) AS cnt FROM \`Transaction\`
        WHERE TransactionDate >= ? GROUP BY ym`,
      [sixMonthsAgo],
    );
    const usersMap = new Map(userRows.map((r) => [r.ym, Number(r.cnt)]));
    const txMap = new Map(txRows.map((r) => [r.ym, Number(r.cnt)]));
    const monthly: { month: string; label: string; newUsers: number; transactions: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const ym = toYMD(d).slice(0, 7);
      monthly.push({
        month: ym,
        label: `T${d.getMonth() + 1}/${String(d.getFullYear()).slice(2)}`,
        newUsers: usersMap.get(ym) ?? 0,
        transactions: txMap.get(ym) ?? 0,
      });
    }

    const topCategories: { name: string; total: string; count: string }[] = await this.dataSource.query(
      `SELECT c.CategoryName AS name, SUM(t.Amount) AS total, COUNT(*) AS count
         FROM \`Transaction\` t JOIN \`Category\` c ON c.CategoryId = t.CategoryId
        WHERE c.Type = 'Expense' AND t.TransactionDate >= ?
        GROUP BY c.CategoryName ORDER BY total DESC LIMIT 5`,
      [monthStart],
    );

    const n = (v: unknown) => Number(v ?? 0);
    return {
      users: { total: n(users?.total), admins: n(users?.admins), locked: n(users?.locked), newThisMonth: n(users?.newThisMonth) },
      transactions: {
        total: n(tx?.total),
        thisMonth: n(tx?.thisMonth),
        incomeThisMonth: n(tx?.incomeThisMonth),
        expenseThisMonth: n(tx?.expenseThisMonth),
      },
      wallets: n(misc?.wallets),
      budgets: n(misc?.budgets),
      goals: n(misc?.goals),
      systemCategories: n(misc?.systemCategories),
      monthly,
      topCategories: topCategories.map((c) => ({ name: c.name, total: n(c.total), count: n(c.count) })),
    };
  }

  /** Nhật ký hoạt động có lọc + phân trang */
  async getAuditLogs(q: QueryAuditDto) {
    if (q.from && q.to && q.from > q.to) throw new BadRequestException('Ngày bắt đầu phải trước ngày kết thúc');
    const page = q.page ?? 1;
    const limit = q.limit ?? 20;
    const qb = this.auditRepo.createQueryBuilder('l');
    if (q.action) qb.andWhere('l.Action = :action', { action: q.action });
    if (q.search) qb.andWhere('(l.Username LIKE :s OR l.Detail LIKE :s)', { s: `%${q.search}%` });
    if (q.from) qb.andWhere('l.CreatedAt >= :from', { from: `${q.from} 00:00:00` });
    if (q.to) qb.andWhere('l.CreatedAt < DATE_ADD(:to, INTERVAL 1 DAY)', { to: q.to });
    const [items, total] = await qb
      .orderBy('l.LogId', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();
    return { items, total, page, limit };
  }
}
