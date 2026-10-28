import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { TransactionService } from './transaction.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtUser } from '../auth/decorators/current-user.decorator';
import { TransactionFilterDto } from './dto/transaction-filter.dto';

@Controller('transactions')
export class TransactionController {
  constructor(private readonly transactionService: TransactionService) {}

  @Post()
  create(
    @CurrentUser() user: JwtUser,
    @Body() createTransactionDto: CreateTransactionDto,
  ) {
    return this.transactionService.create(user, createTransactionDto);
  }

  @Get()
  findAll(@CurrentUser() user: JwtUser, @Query() filters: TransactionFilterDto) {
    return this.transactionService.findAll(user, filters);
  }

  @Get(':id')
  findOne(@CurrentUser() user: JwtUser, @Param('id', ParseIntPipe) id: number) {
    return this.transactionService.findOne(user, id);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: JwtUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() updateTransactionDto: UpdateTransactionDto,
  ) {
    return this.transactionService.update(user, id, updateTransactionDto);
  }

  @Delete(':id')
  remove(@CurrentUser() user: JwtUser, @Param('id', ParseIntPipe) id: number) {
    return this.transactionService.remove(user, id);
  }
}
