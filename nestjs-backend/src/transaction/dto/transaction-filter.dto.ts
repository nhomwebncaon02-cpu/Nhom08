import { Type } from 'class-transformer';
import { IsDateString, IsIn, IsInt, IsOptional, Min } from 'class-validator';

export class TransactionFilterDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  AccountId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  CategoryId?: number;

  @IsOptional()
  @IsIn(['Income', 'Expense'])
  Type?: 'Income' | 'Expense';

  @IsOptional()
  @IsDateString({ strict: true })
  FromDate?: string;

  @IsOptional()
  @IsDateString({ strict: true })
  ToDate?: string;
}
