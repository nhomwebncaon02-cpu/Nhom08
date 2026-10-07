import { JwtService } from '@nestjs/jwt';
export declare class AuthService {
    private jwtService;
    constructor(jwtService: JwtService);
    login(userDto: any): {
        message: string;
        access_token: string;
    };
}
