import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

/** Nhật ký hoạt động — bảng AuditLog (tạo bằng sql/upgrade-v2.sql) */
@Entity('AuditLog')
export class AuditLog {
  @PrimaryGeneratedColumn()
  LogId: number;

  /** Người thực hiện (NULL nếu đăng nhập thất bại với tài khoản không tồn tại) */
  @Column({ type: 'int', nullable: true })
  UserId: number | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  Username: string | null;

  /** VD: LOGIN_SUCCESS, LOGIN_FAILED, REGISTER, USER_LOCK, USER_ROLE, CATEGORY_CREATE... */
  @Column({ length: 50 })
  Action: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  Detail: string | null;

  @Column({ type: 'varchar', length: 64, nullable: true })
  IpAddress: string | null;

  @CreateDateColumn()
  CreatedAt: Date;
}
