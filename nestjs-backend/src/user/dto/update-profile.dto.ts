import { IsEmail, IsOptional, IsString, Length, MaxLength } from 'class-validator';

/** Người dùng tự sửa hồ sơ (không sửa được Username / Role) */
export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @Length(2, 100, { message: 'Họ tên phải từ 2 đến 100 ký tự' })
  FullName?: string;

  @IsOptional()
  @IsEmail({}, { message: 'Email không hợp lệ' })
  @MaxLength(100)
  Email?: string;
}
