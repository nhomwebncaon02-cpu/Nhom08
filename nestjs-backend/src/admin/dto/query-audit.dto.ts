import { Type } from 'class-transformer';
import { IsDateString, IsIn, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';
import { AUDIT_ACTIONS } from '../../audit/audit.service';

export class QueryAuditDto {
  @IsOptional()
  @IsIn(AUDIT_ACTIONS as unknown as string[], { message: 'Loại hành động không hợp lệ' })
  action?: string;

  /** Tìm theo username / nội dung */
  @IsOptional()
  @IsString()
  @MaxLength(100)
  search?: string;

  @IsOptional()
  @IsDateString({ strict: true })
  from?: string;

  @IsOptional()
  @IsDateString({ strict: true })
  to?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}
