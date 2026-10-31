import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { User } from '../user/entities/user.entity';
import { Transaction } from '../transaction/transaction.entity';

@Entity('Category') // khớp tên bảng trong file .sql (trước là 'categories')
export class Category {
  @PrimaryGeneratedColumn()
  categoryId: number;

  @Column({ type: 'int', nullable: true })
  userId: number | null;

  @Column({ length: 100 })
  categoryName: string;

  @Column({ type: 'enum', enum: ['Income', 'Expense'] })
  type: 'Income' | 'Expense';

  @Column({ length: 50, nullable: true })
  icon: string;

  @ManyToOne(() => User, (user: any) => user.categories, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'userId' })
  user: User;

  @OneToMany(() => Transaction, (transaction: any) => transaction.category)
  transactions: Transaction[];
} 