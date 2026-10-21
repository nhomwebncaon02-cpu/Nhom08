import { Category } from '../category/category.entity';
export declare class Transaction {
    TransactionId: number;
    AccountId: string;
    CategoryId: number;
    category: Category;
    Amount: number;
    TransactionDate: string;
    Note: string;
}
