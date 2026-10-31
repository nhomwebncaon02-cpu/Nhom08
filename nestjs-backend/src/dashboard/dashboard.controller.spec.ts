import { Test, TestingModule } from '@nestjs/testing';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';

describe('DashboardController', () => {
  let controller: DashboardController;
  const service = { getSummary: jest.fn(), getMonthly: jest.fn(), getExpenseByCategory: jest.fn(), getRecent: jest.fn() };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DashboardController],
      providers: [{ provide: DashboardService, useValue: service }],
    }).compile();
    controller = module.get(DashboardController);
  });

  it('lấy userId từ JWT, không lấy từ query string (chống IDOR)', async () => {
    service.getSummary.mockResolvedValue({ totalBalance: 1 });
    await controller.getSummary({ userId: 7, username: 'a', role: 'user' });
    expect(service.getSummary).toHaveBeenCalledWith(7);
  });
});
