import { DataSource } from 'typeorm';
import { Account } from './Entity/account.entity';
export declare const accountProviders: {
    provide: string;
    useFactory: (dataSource: DataSource) => import("typeorm").Repository<Account>;
    inject: string[];
}[];
