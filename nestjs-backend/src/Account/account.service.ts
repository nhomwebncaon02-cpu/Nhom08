import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Account } from './Entity/account.entity';
import { CreateAccountDto } from './dto/create-account.dto';
import { UpdateAccountDto } from './dto/update-account.dto';

@Injectable()
export class AccountService {
  constructor(
    @InjectRepository(Account)
    private accountRepository: Repository<Account>,
  ) {}

  /** Chỉ lấy ví của user đang đăng nhập */
  async findAllByUser(userId: number): Promise<Account[]> {
    return this.accountRepository.find({ where: { UserId: userId }, order: { AccountId: 'ASC' } });
  }

  /** Tổng quan: tổng số dư (theo từng loại tiền) + số ví */
  async summary(userId: number) {
    const wallets = await this.findAllByUser(userId);
    const totals: Record<string, number> = {};
    for (const w of wallets) {
      const cur = w.Currency || 'VND';
      totals[cur] = (totals[cur] ?? 0) + Number(w.Balance);
    }
    return { count: wallets.length, totals };
  }

  /** Lấy 1 ví — ví của người khác coi như không tồn tại (404) */
  async findOneForUser(userId: number, id: number): Promise<Account> {
    const account = await this.accountRepository.findOne({ where: { AccountId: id, UserId: userId } });
    if (!account) throw new NotFoundException(`Không tìm thấy ví với ID: ${id}`);
    return account;
  }

  async create(userId: number, dto: CreateAccountDto): Promise<Account> {
    const account = this.accountRepository.create({
      AccountType: 'Cash',
      Currency: 'VND',
      Balance: 0,
      ...dto,
      UserId: userId,
    });
    return this.accountRepository.save(account);
  }

  async update(userId: number, id: number, dto: UpdateAccountDto): Promise<Account> {
    const account = await this.findOneForUser(userId, id);
    Object.assign(account, dto);
    return this.accountRepository.save(account);
  }

  /** Xoá ví — CSDL có ON DELETE CASCADE nên các giao dịch của ví cũng bị xoá */
  async remove(userId: number, id: number) {
    const account = await this.findOneForUser(userId, id);
    await this.accountRepository.remove(account);
    return { message: 'Đã xoá ví' };
  }
}
