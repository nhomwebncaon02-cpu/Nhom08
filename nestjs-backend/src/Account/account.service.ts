import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Account } from './Entity/account.entity';
import { CreateAccountDto } from './dto/create-account.dto';
import { UpdateAccountDto } from './dto/update-account.dto';
import { TransferDto } from './dto/transfer.dto';

@Injectable()
export class AccountService {
  constructor(
    @InjectRepository(Account)
    private accountRepository: Repository<Account>,
    private readonly dataSource: DataSource,
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

  /**
   * Chuyển tiền giữa 2 ví của cùng 1 user (VD: rút từ Vietcombank sang Tiền mặt).
   * Khoá 2 dòng ví trong 1 DB transaction để không bị sai số dư khi bấm liên tục.
   * Chuyển tiền KHÔNG phải thu/chi nên không tạo bản ghi Transaction.
   */
  async transfer(userId: number, dto: TransferDto) {
    if (dto.FromAccountId === dto.ToAccountId) {
      throw new BadRequestException('Ví nguồn và ví đích phải khác nhau');
    }
    await this.dataSource.transaction(async (manager) => {
      const ids = [dto.FromAccountId, dto.ToAccountId].sort((a, b) => a - b);
      const accounts = await manager
        .getRepository(Account)
        .createQueryBuilder('a')
        .setLock('pessimistic_write')
        .where('a.AccountId IN (:...ids) AND a.UserId = :userId', { ids, userId })
        .orderBy('a.AccountId', 'ASC')
        .getMany();
      const from = accounts.find((a) => a.AccountId === dto.FromAccountId);
      const to = accounts.find((a) => a.AccountId === dto.ToAccountId);
      if (!from || !to) throw new NotFoundException('Không tìm thấy ví');
      if ((from.Currency || 'VND') !== (to.Currency || 'VND')) {
        throw new BadRequestException('Chỉ chuyển được giữa 2 ví cùng loại tiền');
      }
      const amount = Number(dto.Amount);
      if (from.AccountType !== 'Credit' && Number(from.Balance) < amount) {
        throw new BadRequestException(`Số dư ví "${from.AccountName}" không đủ`);
      }
      from.Balance = Number(from.Balance) - amount;
      to.Balance = Number(to.Balance) + amount;
      await manager.getRepository(Account).save([from, to]);
    });
    return { message: 'Chuyển tiền thành công', wallets: await this.findAllByUser(userId) };
  }
}
