import { User } from '../user/entities/user.entity';
import { Transaction } from '../transaction/transaction.entity';
export declare class Category {
    categoryId: number;
    userId: number;
    categoryName: string;
    type: string;
    icon: string;
    user: User;
    transactions: Transaction[];
}
