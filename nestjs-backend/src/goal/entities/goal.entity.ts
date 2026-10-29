import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../user/entities/user.entity';

@Entity('SavingGoal') // Ép tên bảng khớp chuẩn với SQL
export class Goal {
  @PrimaryGeneratedColumn({ name: 'GoalId' })
  id: number; // SQL là INT AUTO_INCREMENT

  @Column({ name: 'GoalName', length: 100 })
  name: string;

  @Column('decimal', { name: 'TargetAmount', precision: 15, scale: 2 })
  targetAmount: number;

  @Column('decimal', { name: 'CurrentAmount', precision: 15, scale: 2, default: 0 })
  currentAmount: number;

  @Column({ name: 'TargetDate', type: 'datetime' })
  deadline: Date;

  @ManyToOne(() => User, (user) => user.goals, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'UserId' }) // Ép khóa ngoại dùng đúng tên cột UserId
  user: User;
}