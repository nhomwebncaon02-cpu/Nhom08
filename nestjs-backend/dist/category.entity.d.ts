import { User } from './user.entity';
import { Transaction } from './transaction/entities/transaction.entity';
export declare class Category {
    categoryId: number;
    userId: number;
    categoryName: string;
    type: string;
    icon: string;
    user: User;
    transactions: Transaction[];
}
