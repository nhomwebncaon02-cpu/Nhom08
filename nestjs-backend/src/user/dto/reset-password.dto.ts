import { IsString, Length, Matches } from 'class-validator';

/** Admin đặt mật khẩu mới cho người dùng */
export class ResetPasswordDto {
  @IsString()
  @Length(8, 72, { message: 'Mật khẩu phải từ 8 đến 72 ký tự' })
  @Matches(/^(?=.*[A-Za-z])(?=.*\d).+$/, { message: 'Mật khẩu phải có ít nhất 1 chữ cái và 1 chữ số' })
  newPassword: string;
}
