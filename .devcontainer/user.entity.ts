import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  UserId: string;

  @Column({ length: 50, unique: true })
  Username: string;

  @Column()
  PasswordHash: string;

  @Column({ length: 100, unique: true })
  Email: string;

  @Column({ length: 100 })
  FullName: string;

  @CreateDateColumn()
  CreatedAt: Date;
}

