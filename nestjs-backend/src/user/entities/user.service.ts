import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import { UpdateUserDto } from '../dto/update-user.dto';

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

  async findOne(id: number): Promise<User | null> {
    return this.userRepository.findOne({ where: { UserId: id } });
  }

  async update(id: number, updateData: UpdateUserDto): Promise<User> {
    const user = await this.findOne(id);
    if (!user) throw new NotFoundException(`Không tìm thấy người dùng ID: ${id}`);
    await this.userRepository.update(id, updateData);
    return (await this.findOne(id)) as User;
  }

  async remove(id: number): Promise<void> {
    const result = await this.userRepository.delete(id);
    if (!result.affected) throw new NotFoundException(`Không tìm thấy người dùng ID: ${id}`);
  }
}
