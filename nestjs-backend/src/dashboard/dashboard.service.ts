import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { toYMD } from '../common/utils/date.util';

/**
 * [Thành viên 4] API thống kê cho trang Tổng quan.
 * Mọi số liệu đều chỉ tính cho user đang đăng nhập (userId lấy từ JWT).
 * Chỉ tính các ví VND để không cộng lẫn nhiều loại tiền.
 */
@Injectable()
export class DashboardService {
  constructor(private readonly dataSource: DataSource) {}

  /** Thẻ số liệu: tổng số dư ví, thu/chi tháng này, tiền đã tích luỹ cho mục tiêu */
  async getSummary(userId: number) {
    const now = new Date();
    const monthStart = toYMD(new Date(now.getFullYear(), now.getMonth(), 1));
    const nextMonthStart = toYMD(new Date(now.getFullYear(), now.getMonth() + 1, 1));

    const [balanceRow] = await this.dataSource.query(
      `SELECT COALESCE(SUM(Balance), 0) AS totalBalance, COUNT(*) AS walletCount
         FROM \`Account\` WHERE UserId = ? AND COALESCE(Currency, 'VND') = 'VND'`,
      [userId],
    );

    const [monthRow] = await this.dataSource.query(
      `SELECT
         COALESCE(SUM(CASE WHEN c.Type = 'Income'  THEN t.Amount END), 0) AS totalIncome,
         COALESCE(SUM(CASE WHEN c.Type = 'Expense' THEN t.Amount END), 0) AS totalExpense,
         COUNT(*) AS transactionCount
         FROM \`Transaction\` t
         JOIN \`Account\` a  ON a.AccountId = t.AccountId
         JOIN \`Category\` c ON c.CategoryId = t.CategoryId
        WHERE a.UserId = ? AND COALESCE(a.Currency, 'VND') = 'VND'
          AND t.TransactionDate >= ? AND t.TransactionDate < ?`,
      [userId, monthStart, nextMonthStart],
    );

    const [goalRow] = await this.dataSource.query(
      `SELECT COALESCE(SUM(CurrentAmount), 0) AS totalSaved,
              COALESCE(SUM(TargetAmount), 0)  AS totalTarget,
              COUNT(*) AS goalCount
         FROM \`SavingGoal\` WHERE UserId = ?`,
      [userId],
    );

    const income = Number(monthRow?.totalIncome ?? 0);
    const expense = Number(monthRow?.totalExpense ?? 0);
    return {
      totalBalance: Number(balanceRow?.totalBalance ?? 0), // = tổng số dư các ví (không phải thu - chi)
      walletCount: Number(balanceRow?.walletCount ?? 0),
      totalIncome: income, // thu trong tháng này
      totalExpense: expense, // chi trong tháng này
      netThisMonth: income - expense,
      transactionCount: Number(monthRow?.transactionCount ?? 0),
      totalSaved: Number(goalRow?.totalSaved ?? 0),
      totalTarget: Number(goalRow?.totalTarget ?? 0),
      goalCount: Number(goalRow?.goalCount ?? 0),
      month: monthStart.slice(0, 7),
    };
  }

  /** Biểu đồ cột: thu/chi theo từng tháng trong N tháng gần nhất (kể cả tháng có 0đ) */
  async getMonthly(userId: number, months = 6) {
    const n = Math.min(Math.max(months, 1), 24);
    const now = new Date();
    const from = toYMD(new Date(now.getFullYear(), now.getMonth() - n + 1, 1));

    const rows: { ym: string; income: string; expense: string }[] = await this.dataSource.query(
      `SELECT DATE_FORMAT(t.TransactionDate, '%Y-%m') AS ym,
              COALESCE(SUM(CASE WHEN c.Type = 'Income'  THEN t.Amount END), 0) AS income,
              COALESCE(SUM(CASE WHEN c.Type = 'Expense' THEN t.Amount END), 0) AS expense
         FROM \`Transaction\` t
         JOIN \`Account\` a  ON a.AccountId = t.AccountId
         JOIN \`Category\` c ON c.CategoryId = t.CategoryId
        WHERE a.UserId = ? AND COALESCE(a.Currency, 'VND') = 'VND' AND t.TransactionDate >= ?
        GROUP BY ym`,
      [userId, from],
    );

    const map = new Map(rows.map((r) => [r.ym, r]));
    const result: { month: string; label: string; income: number; expense: number }[] = [];
    for (let i = n - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const ym = toYMD(d).slice(0, 7);
      const r = map.get(ym);
      result.push({
        month: ym,
        label: `T${d.getMonth() + 1}/${String(d.getFullYear()).slice(2)}`,
        income: Number(r?.income ?? 0),
        expense: Number(r?.expense ?? 0),
      });
    }
    return result;
  }

  /** Biểu đồ tròn: tổng chi theo danh mục trong 1 tháng (mặc định tháng này), dạng 'YYYY-MM' */
  async getExpenseByCategory(userId: number, month?: string) {
    const now = new Date();
    const ym = month && /^\d{4}-\d{2}$/.test(month) ? month : toYMD(now).slice(0, 7);
    const [y, m] = ym.split('-').map(Number);
    const start = toYMD(new Date(y, m - 1, 1));
    const end = toYMD(new Date(y, m, 1));

    const rows: { categoryId: number; name: string; icon: string | null; total: string }[] = await this.dataSource.query(
      `SELECT c.CategoryId AS categoryId, c.CategoryName AS name, c.Icon AS icon, SUM(t.Amount) AS total
         FROM \`Transaction\` t
         JOIN \`Account\` a  ON a.AccountId = t.AccountId
         JOIN \`Category\` c ON c.CategoryId = t.CategoryId
        WHERE a.UserId = ? AND c.Type = 'Expense' AND COALESCE(a.Currency, 'VND') = 'VND'
          AND t.TransactionDate >= ? AND t.TransactionDate < ?
        GROUP BY c.CategoryId, c.CategoryName, c.Icon
        ORDER BY total DESC`,
      [userId, start, end],
    );
    return rows.map((r) => ({ ...r, total: Number(r.total) }));
  }

  /** 5 giao dịch gần nhất */
  async getRecent(userId: number, limit = 5) {
    const rows = await this.dataSource.query(
      `SELECT t.TransactionId, t.Amount, t.TransactionDate, t.Note,
              c.CategoryName, c.Type, c.Icon, a.AccountName, a.Currency
         FROM \`Transaction\` t
         JOIN \`Account\` a  ON a.AccountId = t.AccountId
         JOIN \`Category\` c ON c.CategoryId = t.CategoryId
        WHERE a.UserId = ?
        ORDER BY t.TransactionDate DESC, t.TransactionId DESC
        LIMIT ?`,
      [userId, Math.min(Math.max(limit, 1), 20)],
    );
    return rows.map((r: Record<string, unknown>) => ({
      ...r,
      Amount: Number(r.Amount),
      TransactionDate: toYMD(r.TransactionDate as Date),
    }));
  }
}
