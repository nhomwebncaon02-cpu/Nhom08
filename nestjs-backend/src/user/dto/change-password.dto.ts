import { IsNotEmpty, IsString, Length, Matches } from 'class-validator';

export class ChangePasswordDto {
  @IsString()
  @IsNotEmpty({ message: 'Vui lòng nhập mật khẩu hiện tại' })
  currentPassword: string;

  @IsString()
  @Length(8, 72, { message: 'Mật khẩu mới phải từ 8 đến 72 ký tự' })
  @Matches(/^(?=.*[A-Za-z])(?=.*\d).+$/, { message: 'Mật khẩu mới phải có ít nhất 1 chữ cái và 1 chữ số' })
  newPassword: string;
}
