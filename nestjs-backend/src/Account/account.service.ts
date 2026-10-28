import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Account } from './Entity/account.entity';
import { CreateAccountDto } from './dto/create-account.dto';

@Injectable()
export class AccountService {
  constructor(
    @InjectRepository(Account)
    private accountRepository: Repository<Account>,
  ) {}

  /** Chỉ lấy ví của user đang đăng nhập */
  async findAllByUser(userId: number): Promise<Account[]> {
    return this.accountRepository.find({ where: { UserId: userId } });
  }

  async create(userId: number, dto: CreateAccountDto): Promise<Account> {
    const account = this.accountRepository.create({ ...dto, UserId: userId });
    return this.accountRepository.save(account);
  }
}
