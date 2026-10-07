import { Repository } from 'typeorm';
import { User } from './user.entity';
export declare class UserService {
    private userRepository;
    constructor(userRepository: Repository<User>);
    create(userData: Partial<User>): Promise<User>;
    findAll(): Promise<User[]>;
    findOne(id: string): Promise<User | null>;
    update(id: string, updateData: Partial<User>): Promise<User | null>;
    remove(id: string): Promise<void>;
}
