import { IsIn, IsNotEmpty, IsNumber, IsOptional, IsString, Length, Min } from 'class-validator';

// KHÔNG có UserId: UserId luôn lấy từ JWT để user không tạo ví cho người khác
export class CreateAccountDto {
  @IsString()
  @IsNotEmpty({ message: 'Tên ví không được để trống' })
  @Length(1, 100)
  AccountName: string;

  @IsOptional()
  @IsIn(['Cash', 'Bank', 'Credit', 'E-Wallet', 'Other'], { message: 'Loại ví không hợp lệ' })
  AccountType?: string;

  @IsOptional()
  @IsNumber({}, { message: 'Số dư phải là số' })
  @Min(0)
  Balance?: number;

  @IsOptional()
  @IsString()
  @Length(3, 10)
  Currency?: string;
}
