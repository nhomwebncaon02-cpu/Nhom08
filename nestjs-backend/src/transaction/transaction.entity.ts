import { Entity, Column, PrimaryColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Category } from '../category/category.entity';

@Entity('Transaction')
export class Transaction {
  @PrimaryColumn()
  TransactionId: number;

  @Column({ length: 15 })
  AccountId: string;

  @Column()
  CategoryId: number;

  @ManyToOne(() => Category, (category: any) => category.transactions)
  @JoinColumn({ name: 'CategoryId' }) 
  category: Category; 

  @Column('decimal')
  Amount: number;

  @Column({ type: 'date' })
  TransactionDate: string;

  @Column({ length: 255, nullable: true })
  Note: string;
}