import { IsDateString, IsInt, IsNumber, IsOptional, Min } from 'class-validator';

/** Dữ liệu của 1 khoản chi sắp tạo — dùng để kiểm tra có vượt hạn mức không */
export class CheckExpenseDto {
  @IsInt({ message: 'Danh mục không hợp lệ' })
  @Min(1)
  CategoryId: number;

  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'Số tiền phải là số' })
  @Min(1, { message: 'Số tiền phải lớn hơn 0' })
  Amount: number;

  /** Ngày giao dịch, mặc định hôm nay */
  @IsOptional()
  @IsDateString({ strict: true }, { message: 'Ngày không hợp lệ (YYYY-MM-DD)' })
  Date?: string;
}
