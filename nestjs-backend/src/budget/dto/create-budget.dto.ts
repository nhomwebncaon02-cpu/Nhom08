import { IsDateString, IsInt, IsNumber, Max, Min } from 'class-validator';

export class CreateBudgetDto {
  @IsInt({ message: 'Danh mục không hợp lệ' })
  @Min(1, { message: 'Danh mục không hợp lệ' })
  CategoryId: number;

  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'Hạn mức phải là số' })
  @Min(1000, { message: 'Hạn mức tối thiểu 1.000đ' })
  @Max(9_999_999_999_999, { message: 'Hạn mức quá lớn' })
  AmountLimit: number;

  @IsDateString({ strict: true }, { message: 'Ngày bắt đầu không hợp lệ (YYYY-MM-DD)' })
  StartDate: string;

  @IsDateString({ strict: true }, { message: 'Ngày kết thúc không hợp lệ (YYYY-MM-DD)' })
  EndDate: string;
}
