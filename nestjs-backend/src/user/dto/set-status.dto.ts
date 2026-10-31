import { IsBoolean } from 'class-validator';

export class SetStatusDto {
  @IsBoolean({ message: 'IsActive phải là true hoặc false' })
  IsActive: boolean;
}
