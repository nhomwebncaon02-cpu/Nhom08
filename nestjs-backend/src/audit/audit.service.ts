import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from './audit-log.entity';

export const AUDIT_ACTIONS = [
  'LOGIN_SUCCESS',
  'LOGIN_FAILED',
  'LOGIN_BLOCKED',
  'REGISTER',
  'PASSWORD_CHANGE',
  'USER_UPDATE',
  'USER_ROLE',
  'USER_LOCK',
  'USER_UNLOCK',
  'USER_RESET_PASSWORD',
  'USER_DELETE',
  'CATEGORY_CREATE',
  'CATEGORY_UPDATE',
  'CATEGORY_DELETE',
] as const;
export type AuditAction = (typeof AUDIT_ACTIONS)[number];

export interface AuditEntry {
  userId?: number | null;
  username?: string | null;
  action: AuditAction;
  detail?: string;
  ip?: string | null;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(@InjectRepository(AuditLog) private readonly repo: Repository<AuditLog>) {}

  /** Ghi log — lỗi ghi log KHÔNG được làm hỏng nghiệp vụ chính nên chỉ cảnh báo */
  async log(entry: AuditEntry): Promise<void> {
    try {
      await this.repo.insert({
        UserId: entry.userId ?? null,
        Username: entry.username?.slice(0, 50) ?? null,
        Action: entry.action,
        Detail: entry.detail?.slice(0, 255) ?? null,
        IpAddress: entry.ip?.slice(0, 64) ?? null,
      });
    } catch (e) {
      this.logger.warn(`Không ghi được audit log (đã chạy sql/upgrade-v2.sql chưa?): ${(e as Error).message}`);
    }
  }
}
