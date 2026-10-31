import { IsDateString, IsNotEmpty, IsNumber, IsString, Length, Max, Min } from 'class-validator';

// Không nhận user/UserId từ client: backend lấy từ JWT
export class CreateGoalDto {
  @IsString()
  @IsNotEmpty({ message: 'Tên mục tiêu không được để trống' })
  @Length(1, 100, { message: 'Tên mục tiêu tối đa 100 ký tự' })
  name: string;

  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'Số tiền mục tiêu phải là số' })
  @Min(1000, { message: 'Số tiền mục tiêu tối thiểu 1.000đ' })
  @Max(9_999_999_999_999, { message: 'Số tiền mục tiêu quá lớn' })
  targetAmount: number;

  @IsDateString({ strict: true }, { message: 'Hạn chót không hợp lệ (YYYY-MM-DD)' })
  deadline: string;
}
