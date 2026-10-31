import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../user/entities/user.entity';
import { decimalTransformer } from '../../common/utils/decimal.transformer';

@Entity('SavingGoal') // Khớp tên bảng trong SQL
export class Goal {
  @PrimaryGeneratedColumn({ name: 'GoalId' })
  id: number;

  @Column({ name: 'UserId' })
  userId: number;

  @Column({ name: 'GoalName', length: 100 })
  name: string;

  @Column('decimal', { name: 'TargetAmount', precision: 15, scale: 2, transformer: decimalTransformer })
  targetAmount: number;

  @Column('decimal', { name: 'CurrentAmount', precision: 15, scale: 2, default: 0, transformer: decimalTransformer })
  currentAmount: number;

  @Column({ name: 'TargetDate', type: 'datetime', nullable: true })
  deadline: Date | null;

  @ManyToOne(() => User, (user) => user.goals, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'UserId' })
  user: User;
}
