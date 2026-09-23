import { Entity, Column, PrimaryColumn } from 'typeorm';

@Entity('Transaction')
export class Transaction {
  @PrimaryColumn({ length: 15 })
  TransactionId: string;

  @Column({ length: 15 })
  AccountId: string;

  @Column({ length: 15 })
  CategoryId: string;

  @Column('decimal')
  Amount: number;

  @Column({ type: 'date' })
  TransactionDate: string;

  @Column({ length: 255, nullable: true })
  Note: string;
}