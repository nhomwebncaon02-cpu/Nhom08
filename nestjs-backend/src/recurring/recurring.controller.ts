import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, ParseIntPipe, Patch, Post } from '@nestjs/common';
import { RecurringService } from './recurring.service';
import { CreateRecurringDto } from './dto/create-recurring.dto';
import { UpdateRecurringDto } from './dto/update-recurring.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtUser } from '../auth/decorators/current-user.decorator';

/** Giao dịch định kỳ: tiền nhà, lương, tiền điện... */
@Controller('recurring')
export class RecurringController {
  constructor(private readonly recurringService: RecurringService) {}

  @Get()
  findAll(@CurrentUser() user: JwtUser) {
    return this.recurringService.findAll(user.userId);
  }

  /** POST /recurring/process — tạo các giao dịch đã đến hạn */
  @Post('process')
  @HttpCode(HttpStatus.OK)
  process(@CurrentUser() user: JwtUser) {
    return this.recurringService.processDue(user);
  }

  @Post()
  create(@CurrentUser() user: JwtUser, @Body() dto: CreateRecurringDto) {
    return this.recurringService.create(user.userId, dto);
  }

  @Patch(':id')
  update(@CurrentUser() user: JwtUser, @Param('id', ParseIntPipe) id: number, @Body() dto: UpdateRecurringDto) {
    return this.recurringService.update(user.userId, id, dto);
  }

  @Delete(':id')
  remove(@CurrentUser() user: JwtUser, @Param('id', ParseIntPipe) id: number) {
    return this.recurringService.remove(user.userId, id);
  }
}
