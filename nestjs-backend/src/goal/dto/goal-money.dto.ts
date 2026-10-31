import { IsInt, IsNumber, Min } from 'class-validator';

/** Nạp tiền từ ví vào mục tiêu, hoặc rút tiền từ mục tiêu về ví */
export class GoalMoneyDto {
  @IsInt({ message: 'Ví không hợp lệ' })
  @Min(1)
  AccountId: number;

  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'Số tiền phải là số' })
  @Min(1, { message: 'Số tiền phải lớn hơn 0' })
  Amount: number;
}
