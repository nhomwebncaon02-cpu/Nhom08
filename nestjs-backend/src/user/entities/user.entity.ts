import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

export type UserRole = 'user' | 'admin';

// Khớp với bảng `User` trong file XayDungUngDungChiTieuCaNhanThongMinh.sql
// (trước đây entity trỏ tới bảng 'users' + UserId kiểu uuid -> không khớp DB)
@Entity('User')
export class User {
  @PrimaryGeneratedColumn()
  UserId: number;

  @Column({ length: 50, unique: true })
  Username: string;

  // select: false -> mặc định KHÔNG bao giờ trả PasswordHash ra API
  @Column({ length: 255, select: false })
  PasswordHash: string;

  @Column({ length: 100, unique: true })
  Email: string;

  @Column({ length: 100 })
  FullName: string;

  // Cột mới — chạy file sql/auth-migration.sql để thêm vào DB
  @Column({ type: 'enum', enum: ['user', 'admin'], default: 'user' })
  Role: UserRole;

  @CreateDateColumn()
  CreatedAt: Date;
}
