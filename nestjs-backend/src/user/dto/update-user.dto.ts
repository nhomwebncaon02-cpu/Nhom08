import { IsEmail, IsIn, IsOptional, IsString, Length, MaxLength } from 'class-validator';

// Chỉ cho phép admin sửa các field này (không thể sửa PasswordHash / UserId qua API)
export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @Length(2, 100, { message: 'Họ tên phải từ 2 đến 100 ký tự' })
  FullName?: string;

  @IsOptional()
  @IsEmail({}, { message: 'Email không hợp lệ' })
  @MaxLength(100)
  Email?: string;

  @IsOptional()
  @IsIn(['user', 'admin'], { message: 'Role chỉ được là user hoặc admin' })
  Role?: 'user' | 'admin';
}
