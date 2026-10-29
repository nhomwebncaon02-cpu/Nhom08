import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateGoalDto } from './dto/create-goal.dto';
import { UpdateGoalDto } from './dto/update-goal.dto';
import { Goal } from './entities/goal.entity';

@Injectable()
export class GoalService {
  constructor(
    @InjectRepository(Goal)
    private goalRepository: Repository<Goal>,
  ) {}

  async create(userId: number, createGoalDto: CreateGoalDto) {
    // Ép cứng userId từ token, không lấy từ DTO do FE truyền lên
    const newGoal = this.goalRepository.create({
      ...createGoalDto,
      user: { UserId: userId }
    });
    return await this.goalRepository.save(newGoal);
  }

  async findAll(userId: number) {
    return await this.goalRepository.find({
      where: { user: { UserId: userId } },
    });
  }

  async findOne(userId: number, id: number) {
    const goal = await this.goalRepository.findOne({ 
      where: { id: id },
      relations: { user: true } 
    });
    
    if (!goal) {
      throw new NotFoundException(`Không tìm thấy mục tiêu có ID: ${id}`);
    }

    // Chỉ dùng duy nhất UserId theo đúng chuẩn entity của bạn
    if (goal.user.UserId !== userId) {
      throw new ForbiddenException('Bạn không có quyền truy cập mục tiêu này');
    }
    
    return goal;
  }

  async update(userId: number, id: number, updateGoalDto: UpdateGoalDto) {
    // Hàm findOne đã bao gồm check quyền ở trên
    const goal = await this.findOne(userId, id);
    Object.assign(goal, updateGoalDto);
    return await this.goalRepository.save(goal);
  }

  async remove(userId: number, id: number) {
    // Hàm findOne đã bao gồm check quyền ở trên
    const goal = await this.findOne(userId, id);
    return await this.goalRepository.remove(goal);
  }
}