import { Repository } from 'typeorm';
import { Account } from './account.entity';
export declare class AccountService {
    private accountRepository;
    constructor(accountRepository: Repository<Account>);
    findAll(): Promise<Account[]>;
    create(accountData: Partial<Account>): Promise<Account>;
}
