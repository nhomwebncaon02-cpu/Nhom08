import { IsInt, IsNumber, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class TransferDto {
  @IsInt({ message: 'Ví nguồn không hợp lệ' })
  @Min(1)
  FromAccountId: number;

  @IsInt({ message: 'Ví đích không hợp lệ' })
  @Min(1)
  ToAccountId: number;

  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'Số tiền phải là số' })
  @Min(1, { message: 'Số tiền phải lớn hơn 0' })
  Amount: number;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  Note?: string;
}
