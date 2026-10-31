import { Type } from 'class-transformer';
import { IsDateString, IsIn, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

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

  /** Tìm theo ghi chú */
  @IsOptional()
  @IsString()
  @MaxLength(100)
  Search?: string;

  /** Có truyền Page -> trả về dạng phân trang { items, total, page, limit } */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  Page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  Limit?: number;
}
