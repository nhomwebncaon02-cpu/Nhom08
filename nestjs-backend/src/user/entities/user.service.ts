import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User } from './user.entity';
import { UpdateUserDto } from '../dto/update-user.dto';
import { QueryUsersDto } from '../dto/query-users.dto';
import { UpdateProfileDto } from '../dto/update-profile.dto';

const SALT_ROUNDS = 10;

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  /** Dùng nội bộ cho Auth: tạo user với mật khẩu ĐÃ BĂM */
  async create(userData: Partial<User>): Promise<User> {
    const newUser = this.userRepository.create(userData);
    const saved = await this.userRepository.save(newUser);
    const { PasswordHash: _omit, ...safe } = saved;
    return safe as User;
  }

  /** Tìm theo username HOẶC email, có lấy kèm PasswordHash (chỉ dùng khi đăng nhập) */
  async findForLogin(identifier: string): Promise<User | null> {
    return this.userRepository
      .createQueryBuilder('u')
      .addSelect('u.PasswordHash')
      .where('LOWER(u.Username) = LOWER(:id) OR LOWER(u.Email) = LOWER(:id)', { id: identifier })
      .getOne();
  }

  async existsByUsernameOrEmail(username: string, email: string) {
    const found = await this.userRepository
      .createQueryBuilder('u')
      .where('LOWER(u.Username) = LOWER(:username)', { username })
      .orWhere('LOWER(u.Email) = LOWER(:email)', { email })
      .getOne();
    if (!found) return null;
    return found.Username.toLowerCase() === username.toLowerCase() ? 'username' : 'email';
  }

  async countAdmins(): Promise<number> {
    return this.userRepository.count({ where: { Role: 'admin' } });
  }

  async findAll(): Promise<User[]> {
    return this.userRepository.find({ order: { UserId: 'ASC' } });
  }

  /** [Admin] Danh sách có tìm kiếm + lọc + phân trang */
  async findPaged(q: QueryUsersDto) {
    const page = q.page ?? 1;
    const limit = q.limit ?? 10;
    const qb = this.userRepository.createQueryBuilder('u');
    if (q.search) {
      qb.andWhere('(u.Username LIKE :s OR u.Email LIKE :s OR u.FullName LIKE :s)', { s: `%${q.search}%` });
    }
    if (q.role) qb.andWhere('u.Role = :role', { role: q.role });
    if (q.status) qb.andWhere('u.IsActive = :active', { active: q.status === 'active' });

    const [items, total] = await qb
      .orderBy('u.UserId', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();
    return { items, total, page, limit };
  }

  async findOne(id: number): Promise<User | null> {
    return this.userRepository.findOne({ where: { UserId: id } });
  }

  async getOrFail(id: number): Promise<User> {
    const user = await this.findOne(id);
    if (!user) throw new NotFoundException(`Không tìm thấy người dùng ID: ${id}`);
    return user;
  }

  /** [Admin] Chi tiết: thông tin + số ví, giao dịch, ngân sách, mục tiêu, tổng số dư */
  async getDetail(id: number) {
    const user = await this.getOrFail(id);
    const [row] = await this.userRepository.query(
      `SELECT
         (SELECT COUNT(*) FROM \`Account\` WHERE UserId = ?) AS walletCount,
         (SELECT COALESCE(SUM(Balance), 0) FROM \`Account\` WHERE UserId = ? AND COALESCE(Currency,'VND') = 'VND') AS totalBalance,
         (SELECT COUNT(*) FROM \`Transaction\` t JOIN \`Account\` a ON a.AccountId = t.AccountId WHERE a.UserId = ?) AS transactionCount,
         (SELECT COUNT(*) FROM \`Budget\` WHERE UserId = ?) AS budgetCount,
         (SELECT COUNT(*) FROM \`SavingGoal\` WHERE UserId = ?) AS goalCount`,
      [id, id, id, id, id],
    );
    return {
      ...user,
      stats: {
        walletCount: Number(row?.walletCount ?? 0),
        totalBalance: Number(row?.totalBalance ?? 0),
        transactionCount: Number(row?.transactionCount ?? 0),
        budgetCount: Number(row?.budgetCount ?? 0),
        goalCount: Number(row?.goalCount ?? 0),
      },
    };
  }

  async update(id: number, updateData: UpdateUserDto): Promise<User> {
    await this.getOrFail(id);
    if (updateData.Email) await this.assertEmailFree(updateData.Email, id);
    await this.userRepository.update(id, updateData);
    return this.getOrFail(id);
  }

  async setActive(id: number, isActive: boolean): Promise<User> {
    await this.getOrFail(id);
    await this.userRepository.update(id, { IsActive: isActive });
    return this.getOrFail(id);
  }

  /** Đặt mật khẩu mới (đã băm) — dùng cho admin reset và user đổi mật khẩu */
  async setPassword(id: number, plain: string): Promise<void> {
    await this.userRepository.update(id, { PasswordHash: await bcrypt.hash(plain, SALT_ROUNDS) });
  }

  /** Kiểm tra mật khẩu hiện tại của user */
  async verifyPassword(id: number, plain: string): Promise<boolean> {
    const user = await this.userRepository
      .createQueryBuilder('u')
      .addSelect('u.PasswordHash')
      .where('u.UserId = :id', { id })
      .getOne();
    if (!user?.PasswordHash) return false;
    try {
      return await bcrypt.compare(plain, user.PasswordHash);
    } catch {
      return false;
    }
  }

  async updateProfile(id: number, dto: UpdateProfileDto): Promise<User> {
    if (dto.Email) await this.assertEmailFree(dto.Email, id);
    const data: Partial<User> = {};
    if (dto.FullName !== undefined) data.FullName = dto.FullName;
    if (dto.Email !== undefined) data.Email = dto.Email.toLowerCase();
    if (Object.keys(data).length === 0) throw new BadRequestException('Không có thông tin nào để cập nhật');
    await this.userRepository.update(id, data);
    return this.getOrFail(id);
  }

  async remove(id: number): Promise<void> {
    const result = await this.userRepository.delete(id);
    if (!result.affected) throw new NotFoundException(`Không tìm thấy người dùng ID: ${id}`);
  }

  private async assertEmailFree(email: string, exceptId: number) {
    const other = await this.userRepository
      .createQueryBuilder('u')
      .where('LOWER(u.Email) = LOWER(:email) AND u.UserId <> :id', { email, id: exceptId })
      .getOne();
    if (other) throw new ConflictException('Email đã được sử dụng');
  }
}
