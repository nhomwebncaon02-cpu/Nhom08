import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe, HttpCode, HttpStatus } from '@nestjs/common';
import { BudgetService } from './budget.service';
import { CreateBudgetDto } from './dto/create-budget.dto';
import { UpdateBudgetDto } from './dto/update-budget.dto';
import { CheckExpenseDto } from './dto/check-expense.dto';
import { CurrentUser, JwtUser } from '../auth/decorators/current-user.decorator';

/** CRUD Ngân sách (Budget) + Cảnh báo vượt hạn mức */
@Controller('budgets')
export class BudgetController {
  constructor(private readonly budgetService: BudgetService) {}

  @Get()
  findAll(@CurrentUser() user: JwtUser) {
    return this.budgetService.findAll(user.userId);
  }

  /** GET /budgets/alerts — ngân sách đang hiệu lực đã >= 80% hoặc vượt hạn mức */
  @Get('alerts')
  alerts(@CurrentUser() user: JwtUser) {
    return this.budgetService.getAlerts(user.userId);
  }

  /** POST /budgets/check — kiểm tra 1 khoản chi có vượt hạn mức không (không lưu gì) */
  @Post('check')
  @HttpCode(HttpStatus.OK)
  check(@CurrentUser() user: JwtUser, @Body() dto: CheckExpenseDto) {
    return this.budgetService.checkExpense(user.userId, dto);
  }

  @Get(':id')
  findOne(@CurrentUser() user: JwtUser, @Param('id', ParseIntPipe) id: number) {
    return this.budgetService.findOne(user.userId, id);
  }

  @Post()
  create(@CurrentUser() user: JwtUser, @Body() dto: CreateBudgetDto) {
    return this.budgetService.create(user.userId, dto);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: JwtUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateBudgetDto,
  ) {
    return this.budgetService.update(user.userId, id, dto);
  }

  @Delete(':id')
  remove(@CurrentUser() user: JwtUser, @Param('id', ParseIntPipe) id: number) {
    return this.budgetService.remove(user.userId, id);
  }
}
