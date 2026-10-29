import { IsNotEmpty, IsNumber, IsString, IsObject, IsOptional } from 'class-validator';

export class CreateGoalDto {
  @IsNotEmpty({ message: 'Tên mục tiêu không được để trống' })
  @IsString()
  name: string;

  @IsNotEmpty({ message: 'Số tiền mục tiêu không được để trống' })
  @IsNumber()
  targetAmount: number;

  @IsNotEmpty({ message: 'Hạn chót không được để trống' })
  @IsString()
  deadline: string;

  @IsNotEmpty()
  @IsObject()
  user: { UserId: number };
}