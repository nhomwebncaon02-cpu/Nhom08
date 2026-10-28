import { Type } from 'class-transformer';
import {
  IsDateString,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Length,
  Min,
} from 'class-validator';

export class CreateTransactionDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  AccountId: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  CategoryId: number;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  Amount: number;

  @IsOptional()
  @IsDateString({ strict: true })
  TransactionDate?: string;

  @IsOptional()
  @IsString()
  @Length(0, 255)
  Note?: string;
}
