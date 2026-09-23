import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './user.entity';

@Entity('Account')
export class Account {
  @PrimaryGeneratedColumn()
  AccountId: number;

  @Column()
  UserId: number;

  @Column({ length: 100 })
  AccountName: string;

  @Column({ length: 50, nullable: true })
  AccountType: string;

  @Column('decimal', { precision: 15, scale: 2, default: 0 })
  Balance: number;

  @Column({ length: 10, default: 'VND' })
  Currency: string;

  // Khóa ngoại liên kết với bảng User
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'UserId' })
  user: User;
}
