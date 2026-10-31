import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GoalService } from './goal.service';
import { GoalController } from './goal.controller';
import { Goal } from './entities/goal.entity';
import { Account } from '../Account/Entity/account.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Goal, Account])],
  controllers: [GoalController],
  providers: [GoalService],
})
export class GoalModule {}
