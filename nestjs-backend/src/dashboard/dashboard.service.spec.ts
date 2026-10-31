import { Test, TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { DashboardService } from './dashboard.service';

describe('DashboardService', () => {
  let service: DashboardService;
  const dataSource = { query: jest.fn() };

  beforeEach(async () => {
    dataSource.query.mockReset();
    const module: TestingModule = await Test.createTestingModule({
      providers: [DashboardService, { provide: DataSource, useValue: dataSource }],
    }).compile();
    service = module.get(DashboardService);
  });

  it('getSummary: số dư = tổng số dư ví, thu/chi là của tháng này', async () => {
    dataSource.query
      .mockResolvedValueOnce([{ totalBalance: '17000000.00', walletCount: '2' }])
      .mockResolvedValueOnce([{ totalIncome: '20000000', totalExpense: '3500000', transactionCount: '5' }])
      .mockResolvedValueOnce([{ totalSaved: '5000000', totalTarget: '30000000', goalCount: '1' }]);

    const s = await service.getSummary(1);
    expect(s.totalBalance).toBe(17_000_000);
    expect(s.totalIncome).toBe(20_000_000);
    expect(s.totalExpense).toBe(3_500_000);
    expect(s.netThisMonth).toBe(16_500_000);
    expect(s.totalSaved).toBe(5_000_000);
  });

  it('getMonthly: luôn trả đủ N tháng, tháng không có giao dịch = 0', async () => {
    dataSource.query.mockResolvedValueOnce([]);
    const rows = await service.getMonthly(1, 6);
    expect(rows).toHaveLength(6);
    expect(rows.every((r) => r.income === 0 && r.expense === 0)).toBe(true);
  });
});
