import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { CreateGoalDto } from './dto/create-goal.dto';
import { UpdateGoalDto } from './dto/update-goal.dto';
import { GoalMoneyDto } from './dto/goal-money.dto';
import { Goal } from './entities/goal.entity';
import { Account } from '../Account/Entity/account.entity';
import { ymdToDateTime } from '../common/utils/date.util';

@Injectable()
export class GoalService {
  constructor(
    @InjectRepository(Goal)
    private readonly goalRepository: Repository<Goal>,
    private readonly dataSource: DataSource,
  ) {}

  async create(userId: number, dto: CreateGoalDto) {
    const goal = this.goalRepository.create({
      userId, // lấy từ token, không tin dữ liệu FE gửi lên
      name: dto.name,
      targetAmount: dto.targetAmount,
      currentAmount: 0,
      deadline: ymdToDateTime(dto.deadline) as unknown as Date,
    });
    return this.goalRepository.save(goal);
  }

  findAll(userId: number) {
    return this.goalRepository.find({ where: { userId }, order: { deadline: 'ASC' } });
  }

  /** Mục tiêu của người khác coi như không tồn tại (404) */
  async findOne(userId: number, id: number) {
    const goal = await this.goalRepository.findOne({ where: { id, userId } });
    if (!goal) throw new NotFoundException(`Không tìm thấy mục tiêu có ID: ${id}`);
    return goal;
  }

  async update(userId: number, id: number, dto: UpdateGoalDto) {
    const goal = await this.findOne(userId, id);
    if (dto.name !== undefined) goal.name = dto.name;
    if (dto.targetAmount !== undefined) goal.targetAmount = dto.targetAmount;
    if (dto.deadline !== undefined) goal.deadline = ymdToDateTime(dto.deadline) as unknown as Date;
    return this.goalRepository.save(goal);
  }

  async remove(userId: number, id: number) {
    const goal = await this.findOne(userId, id);
    if (Number(goal.currentAmount) > 0) {
      throw new BadRequestException('Mục tiêu còn tiền — hãy rút tiền về ví trước khi xoá');
    }
    await this.goalRepository.remove(goal);
    return { message: 'Đã xoá mục tiêu' };
  }

  /** Nạp tiền: trừ số dư ví, cộng vào mục tiêu (trong 1 DB transaction) */
  deposit(userId: number, id: number, dto: GoalMoneyDto) {
    return this.moveMoney(userId, id, dto, 'deposit');
  }

  /** Rút tiền: trừ mục tiêu, cộng lại vào ví */
  withdraw(userId: number, id: number, dto: GoalMoneyDto) {
    return this.moveMoney(userId, id, dto, 'withdraw');
  }

  private async moveMoney(userId: number, id: number, dto: GoalMoneyDto, kind: 'deposit' | 'withdraw') {
    await this.dataSource.transaction(async (manager) => {
      const goal = await manager
        .getRepository(Goal)
        .createQueryBuilder('g')
        .setLock('pessimistic_write')
        .where('g.id = :id AND g.userId = :userId', { id, userId })
        .getOne();
      if (!goal) throw new NotFoundException('Không tìm thấy mục tiêu');

      const account = await manager
        .getRepository(Account)
        .createQueryBuilder('a')
        .setLock('pessimistic_write')
        .where('a.AccountId = :aid AND a.UserId = :userId', { aid: dto.AccountId, userId })
        .getOne();
      if (!account) throw new NotFoundException('Không tìm thấy ví');
      if ((account.Currency || 'VND') !== 'VND') {
        throw new BadRequestException('Chỉ nạp/rút với ví VND');
      }

      const amount = Number(dto.Amount);
      if (kind === 'deposit') {
        if (Number(account.Balance) < amount) throw new BadRequestException('Số dư ví không đủ để nạp');
        account.Balance = Number(account.Balance) - amount;
        goal.currentAmount = Number(goal.currentAmount) + amount;
      } else {
        if (Number(goal.currentAmount) < amount) throw new BadRequestException('Số tiền rút vượt quá số đã tích luỹ');
        goal.currentAmount = Number(goal.currentAmount) - amount;
        account.Balance = Number(account.Balance) + amount;
      }
      await manager.getRepository(Account).save(account);
      await manager.getRepository(Goal).save(goal);
    });
    return this.findOne(userId, id);
  }
}
