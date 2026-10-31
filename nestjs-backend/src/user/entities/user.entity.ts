import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, OneToMany } from 'typeorm';
import { Category } from '../../category/category.entity';
import { Goal } from '../../goal/entities/goal.entity';

export type UserRole = 'user' | 'admin';

// Khớp với bảng `User` trong file XayDungUngDungChiTieuCaNhanThongMinh.sql
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

  @Column({ type: 'enum', enum: ['user', 'admin'], default: 'user' })
  Role: UserRole;

  // Admin khoá tài khoản -> IsActive = false -> không đăng nhập được (sql/upgrade-v2.sql)
  @Column({ type: 'boolean', default: true })
  IsActive: boolean;

  @CreateDateColumn()
  CreatedAt: Date;

  @OneToMany(() => Category, (category) => category.user)
  categories: Category[];

  // Sửa lỗi build: goal.entity.ts tham chiếu user.goals nhưng User chưa khai báo
  @OneToMany(() => Goal, (goal) => goal.user)
  goals: Goal[];
}
