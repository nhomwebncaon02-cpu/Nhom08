import { AccountService } from './account.service';
import { Account } from './account.entity';
export declare class AccountController {
    private readonly accountService;
    constructor(accountService: AccountService);
    findAll(): Promise<Account[]>;
    create(accountData: Partial<Account>): Promise<Account>;
}
