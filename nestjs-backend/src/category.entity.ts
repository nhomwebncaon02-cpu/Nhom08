import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { User } from './user.entity';
import { Transaction } from './transaction/entities/transaction.entity';

@Entity('categories')
export class Category {
  @PrimaryGeneratedColumn()
  categoryId: number;

  @Column({ nullable: true })
  userId: number;

  @Column({ length: 100 })
  categoryName: string;

  @Column({ enum: ['Income', 'Expense'] })
  type: string;

  @Column({ length: 50, nullable: true })
  icon: string;

  @ManyToOne(() => User, (user: any) => user.categories, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'userId' })
  user: User;

  @OneToMany(() => Transaction, (transaction: any) => transaction.category)
  transactions: Transaction[];
}