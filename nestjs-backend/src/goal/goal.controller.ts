import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe, UseGuards } from '@nestjs/common';
import { GoalService } from './goal.service';
import { CreateGoalDto } from './dto/create-goal.dto';
import { UpdateGoalDto } from './dto/update-goal.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser, type JwtUser } from '../auth/decorators/current-user.decorator';

@UseGuards(JwtAuthGuard)
@Controller('goal')
export class GoalController {
  constructor(private readonly goalService: GoalService) {}

  @Post()
  create(@CurrentUser() user: JwtUser, @Body() createGoalDto: CreateGoalDto) {
    return this.goalService.create(user.userId, createGoalDto);
  }

  @Get()
  findAll(@CurrentUser() user: JwtUser) {
    // Không dùng @Query('userId') nữa, lấy trực tiếp từ token
    return this.goalService.findAll(user.userId);
  }

  @Get(':id')
  findOne(@CurrentUser() user: JwtUser, @Param('id', ParseIntPipe) id: number) {
    return this.goalService.findOne(user.userId, id);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: JwtUser, 
    @Param('id', ParseIntPipe) id: number, 
    @Body() updateGoalDto: UpdateGoalDto
  ) {
    return this.goalService.update(user.userId, id, updateGoalDto);
  }

  @Delete(':id')
  remove(@CurrentUser() user: JwtUser, @Param('id', ParseIntPipe) id: number) {
    return this.goalService.remove(user.userId, id);
  }
}