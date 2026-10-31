import { Controller, DefaultValuePipe, Get, ParseIntPipe, Query } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtUser } from '../auth/decorators/current-user.decorator';

/**
 * Trước đây: GET /dashboard/summary?userId=5 -> ai cũng xem được dữ liệu người khác (lỗ hổng IDOR).
 * Nay: userId luôn lấy từ JWT.
 */
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('summary')
  getSummary(@CurrentUser() user: JwtUser) {
    return this.dashboardService.getSummary(user.userId);
  }

  /** GET /dashboard/monthly?months=6 */
  @Get('monthly')
  getMonthly(
    @CurrentUser() user: JwtUser,
    @Query('months', new DefaultValuePipe(6), ParseIntPipe) months: number,
  ) {
    return this.dashboardService.getMonthly(user.userId, months);
  }

  /** GET /dashboard/by-category?month=2026-10 */
  @Get('by-category')
  getByCategory(@CurrentUser() user: JwtUser, @Query('month') month?: string) {
    return this.dashboardService.getExpenseByCategory(user.userId, month);
  }

  @Get('recent')
  getRecent(@CurrentUser() user: JwtUser) {
    return this.dashboardService.getRecent(user.userId);
  }
}
