import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../user/entities/user.entity';
import { Category } from '../category/category.entity';
import { decimalTransformer } from '../common/utils/decimal.transformer';

// Khớp bảng `Budget` trong file XayDungUngDungChiTieuCaNhanThongMinh.sql
@Entity('Budget')
export class Budget {
  @PrimaryGeneratedColumn()
  BudgetId: number;

  @Column()
  UserId: number;

  @Column()
  CategoryId: number;

  @Column('decimal', { precision: 15, scale: 2, transformer: decimalTransformer })
  AmountLimit: number;

  @Column({ type: 'datetime' })
  StartDate: Date;

  @Column({ type: 'datetime' })
  EndDate: Date;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'UserId' })
  user: User;

  @ManyToOne(() => Category)
  @JoinColumn({ name: 'CategoryId' })
  category: Category;
}
