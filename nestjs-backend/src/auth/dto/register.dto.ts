import { IsEmail, IsNotEmpty, IsString, Length, Matches, MaxLength } from 'class-validator';

export class RegisterDto {
  @IsString()
  @IsNotEmpty({ message: 'Họ tên không được để trống' })
  @Length(2, 100, { message: 'Họ tên phải từ 2 đến 100 ký tự' })
  fullName: string;

  @IsString()
  @Length(3, 50, { message: 'Tên đăng nhập phải từ 3 đến 50 ký tự' })
  @Matches(/^[a-zA-Z0-9_.]+$/, {
    message: 'Tên đăng nhập chỉ gồm chữ không dấu, số, dấu _ và dấu .',
  })
  username: string;

  @IsEmail({}, { message: 'Email không hợp lệ' })
  @MaxLength(100, { message: 'Email tối đa 100 ký tự' })
  email: string;

  @IsString()
  @Length(8, 72, { message: 'Mật khẩu phải từ 8 đến 72 ký tự' })
  @Matches(/^(?=.*[A-Za-z])(?=.*\d).+$/, {
    message: 'Mật khẩu phải có ít nhất 1 chữ cái và 1 chữ số',
  })
  password: string;
}
