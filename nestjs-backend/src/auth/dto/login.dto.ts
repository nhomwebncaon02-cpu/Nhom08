import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class LoginDto {
  // Cho phép nhập username HOẶC email
  @IsString()
  @IsNotEmpty({ message: 'Vui lòng nhập tên đăng nhập hoặc email' })
  @MaxLength(100)
  username: string;

  @IsString()
  @IsNotEmpty({ message: 'Vui lòng nhập mật khẩu' })
  @MaxLength(72)
  password: string;
}
