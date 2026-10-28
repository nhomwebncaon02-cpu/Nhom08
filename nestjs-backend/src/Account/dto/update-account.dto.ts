import { PartialType } from '@nestjs/mapped-types';
import { CreateAccountDto } from './create-account.dto';

// Mọi field đều tuỳ chọn khi cập nhật (PATCH)
export class UpdateAccountDto extends PartialType(CreateAccountDto) {}
