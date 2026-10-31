import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Account } from '../Account/Entity/account.entity';
import { Category } from '../category/category.entity';
import { decimalTransformer } from '../common/utils/decimal.transformer';

export type RecurringFrequency = 'daily' | 'weekly' | 'monthly' | 'yearly';

/** Giao dịch định kỳ (tiền nhà, lương...) — bảng RecurringTransaction (sql/upgrade-v2.sql) */
@Entity('RecurringTransaction')
export class RecurringTransaction {
  @PrimaryGeneratedColumn()
  RecurringId: number;

  @Column()
  UserId: number;

  @Column()
  AccountId: number;

  @ManyToOne(() => Account, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'AccountId' })
  account: Account;

  @Column()
  CategoryId: number;

  @ManyToOne(() => Category)
  @JoinColumn({ name: 'CategoryId' })
  category: Category;

  @Column('decimal', { precision: 15, scale: 2, transformer: decimalTransformer })
  Amount: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  Note: string | null;

  @Column({ type: 'enum', enum: ['daily', 'weekly', 'monthly', 'yearly'], default: 'monthly' })
  Frequency: RecurringFrequency;

  /** Ngày sẽ tạo giao dịch tiếp theo ('YYYY-MM-DD') */
  @Column({ type: 'date' })
  NextDate: string;

  @Column({ type: 'boolean', default: true })
  IsActive: boolean;

  @CreateDateColumn()
  CreatedAt: Date;
}
