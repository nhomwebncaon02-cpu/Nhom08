import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe, HttpCode, HttpStatus } from '@nestjs/common';
import { GoalService } from './goal.service';
import { CreateGoalDto } from './dto/create-goal.dto';
import { UpdateGoalDto } from './dto/update-goal.dto';
import { GoalMoneyDto } from './dto/goal-money.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtUser } from '../auth/decorators/current-user.decorator';

/** Mục tiêu tiết kiệm — guard JWT đã bật toàn cục nên không cần @UseGuards */
@Controller('goal')
export class GoalController {
  constructor(private readonly goalService: GoalService) {}

  @Post()
  create(@CurrentUser() user: JwtUser, @Body() dto: CreateGoalDto) {
    return this.goalService.create(user.userId, dto);
  }

  @Get()
  findAll(@CurrentUser() user: JwtUser) {
    return this.goalService.findAll(user.userId);
  }

  @Get(':id')
  findOne(@CurrentUser() user: JwtUser, @Param('id', ParseIntPipe) id: number) {
    return this.goalService.findOne(user.userId, id);
  }

  @Patch(':id')
  update(@CurrentUser() user: JwtUser, @Param('id', ParseIntPipe) id: number, @Body() dto: UpdateGoalDto) {
    return this.goalService.update(user.userId, id, dto);
  }

  @Post(':id/deposit')
  @HttpCode(HttpStatus.OK)
  deposit(@CurrentUser() user: JwtUser, @Param('id', ParseIntPipe) id: number, @Body() dto: GoalMoneyDto) {
    return this.goalService.deposit(user.userId, id, dto);
  }

  @Post(':id/withdraw')
  @HttpCode(HttpStatus.OK)
  withdraw(@CurrentUser() user: JwtUser, @Param('id', ParseIntPipe) id: number, @Body() dto: GoalMoneyDto) {
    return this.goalService.withdraw(user.userId, id, dto);
  }

  @Delete(':id')
  remove(@CurrentUser() user: JwtUser, @Param('id', ParseIntPipe) id: number) {
    return this.goalService.remove(user.userId, id);
  }
}
