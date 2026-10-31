import { IsDateString, IsIn, IsInt, IsNumber, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class CreateRecurringDto {
  @IsInt({ message: 'Ví không hợp lệ' })
  @Min(1)
  AccountId: number;

  @IsInt({ message: 'Danh mục không hợp lệ' })
  @Min(1)
  CategoryId: number;

  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'Số tiền phải là số' })
  @Min(1, { message: 'Số tiền phải lớn hơn 0' })
  Amount: number;

  @IsIn(['daily', 'weekly', 'monthly', 'yearly'], { message: 'Chu kỳ không hợp lệ' })
  Frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';

  /** Ngày bắt đầu (lần đầu tạo giao dịch) */
  @IsDateString({ strict: true }, { message: 'Ngày bắt đầu không hợp lệ (YYYY-MM-DD)' })
  NextDate: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  Note?: string;
}
