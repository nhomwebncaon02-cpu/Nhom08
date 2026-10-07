import { User } from './user.entity';
export declare class Account {
    AccountId: number;
    UserId: number;
    AccountName: string;
    AccountType: string;
    Balance: number;
    Currency: string;
    user: User;
}
