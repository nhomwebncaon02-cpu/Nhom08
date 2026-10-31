import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { GoalService } from './goal.service';
import { Goal } from './entities/goal.entity';

describe('GoalService', () => {
  let service: GoalService;
  const repo = {
    create: jest.fn((x) => x),
    save: jest.fn(async (x) => ({ id: 1, ...x })),
    findOne: jest.fn(),
    find: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GoalService,
        { provide: getRepositoryToken(Goal), useValue: repo },
        { provide: DataSource, useValue: { transaction: jest.fn() } },
      ],
    }).compile();
    service = module.get(GoalService);
  });

  it('create: gán userId từ token, số đã tích luỹ bắt đầu = 0', async () => {
    const goal = await service.create(9, { name: 'Laptop', targetAmount: 30_000_000, deadline: '2027-01-01' });
    expect(goal.userId).toBe(9);
    expect(goal.currentAmount).toBe(0);
  });

  it('findOne: mục tiêu của người khác -> 404', async () => {
    repo.findOne.mockResolvedValue(null);
    await expect(service.findOne(1, 99)).rejects.toBeInstanceOf(NotFoundException);
  });
});
