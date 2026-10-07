import { DataSource } from 'typeorm';
export declare const accountProviders: {
    provide: string;
    useFactory: (dataSource: DataSource) => import("typeorm").Repository<import("typeorm").ObjectLiteral>;
    inject: string[];
}[];
