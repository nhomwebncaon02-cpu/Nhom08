import { Test, TestingModule } from '@nestjs/testing';
import { GoalController } from './goal.controller';
import { GoalService } from './goal.service';

describe('GoalController', () => {
  let controller: GoalController;
  const service = { findAll: jest.fn(), create: jest.fn(), deposit: jest.fn() };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GoalController],
      providers: [{ provide: GoalService, useValue: service }],
    }).compile();
    controller = module.get(GoalController);
  });

  it('findAll dùng userId trong token', async () => {
    service.findAll.mockResolvedValue([]);
    await controller.findAll({ userId: 3, username: 'u', role: 'user' });
    expect(service.findAll).toHaveBeenCalledWith(3);
  });
});
