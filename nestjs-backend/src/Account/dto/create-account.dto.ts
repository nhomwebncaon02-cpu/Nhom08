import { IsIn, IsNotEmpty, IsNumber, IsOptional, IsString, Length, Max, Min } from 'class-validator';

export const ACCOUNT_TYPES = ['Cash', 'Bank', 'Credit', 'E-Wallet', 'Saving', 'Other'] as const;

// KHÔNG có UserId: UserId luôn lấy từ JWT để user không tạo ví cho người khác
export class CreateAccountDto {
  @IsString()
  @IsNotEmpty({ message: 'Tên ví không được để trống' })
  @Length(1, 100, { message: 'Tên ví tối đa 100 ký tự' })
  AccountName: string;

  @IsOptional()
  @IsIn(ACCOUNT_TYPES as unknown as string[], { message: 'Loại ví không hợp lệ' })
  AccountType?: string;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'Số dư phải là số' })
  @Min(0, { message: 'Số dư không được âm' })
  @Max(9_999_999_999_999, { message: 'Số dư quá lớn' })
  Balance?: number;

  @IsOptional()
  @IsIn(['VND', 'USD', 'EUR'], { message: 'Đơn vị tiền chỉ hỗ trợ VND, USD, EUR' })
  Currency?: string;
}
