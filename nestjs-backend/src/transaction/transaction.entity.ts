import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Account } from '../Account/Entity/account.entity';
import { Category } from '../category/category.entity';
import { decimalTransformer } from '../common/utils/decimal.transformer';

@Entity('Transaction')
export class Transaction {
  @PrimaryGeneratedColumn()
  TransactionId: number;

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

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  TransactionDate: Date;

  @Column({ type: 'varchar', length: 255, nullable: true })
  Note: string | null;
}
