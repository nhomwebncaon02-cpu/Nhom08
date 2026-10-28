import {
  ConflictException, HttpException, HttpStatus, Injectable, Logger, OnModuleInit, UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { UserService } from '../user/entities/user.service';
import { User } from '../user/entities/user.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import type { JwtPayload } from './strategies/jwt.strategy';

const SALT_ROUNDS = 10;
const MAX_FAILED_ATTEMPTS = 5;
const LOCK_MINUTES = 15;

@Injectable()
export class AuthService implements OnModuleInit {
  private readonly logger = new Logger(AuthService.name);
  // Chống brute-force: đếm số lần sai mật khẩu theo username/email (lưu trong RAM)
  private failedLogins = new Map<string, { count: number; lockedUntil?: number }>();

  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
  ) {}

  /** Khi server khởi động: tạo tài khoản admin từ .env nếu DB chưa có admin nào */
  async onModuleInit() {
    const { ADMIN_USERNAME, ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_FULLNAME } = process.env;
    if (!ADMIN_USERNAME || !ADMIN_EMAIL || !ADMIN_PASSWORD) return;
    try {
      if ((await this.userService.countAdmins()) > 0) return;
      if (await this.userService.existsByUsernameOrEmail(ADMIN_USERNAME, ADMIN_EMAIL)) {
        this.logger.warn(`Đã có user "${ADMIN_USERNAME}" nhưng chưa phải admin — bỏ qua tạo admin`);
        return;
      }
      await this.userService.create({
        Username: ADMIN_USERNAME,
        Email: ADMIN_EMAIL,
        FullName: ADMIN_FULLNAME || 'Administrator',
        PasswordHash: await bcrypt.hash(ADMIN_PASSWORD, SALT_ROUNDS),
        Role: 'admin',
      });
      this.logger.log(`Đã tạo tài khoản admin mặc định: ${ADMIN_USERNAME}`);
    } catch (e) {
      this.logger.error(
        'Không tạo được admin mặc định — bạn đã chạy sql/auth-migration.sql (thêm cột Role) chưa?',
        (e as Error).message,
      );
    }
  }

  async register(dto: RegisterDto) {
    const taken = await this.userService.existsByUsernameOrEmail(dto.username, dto.email);
    if (taken === 'username') throw new ConflictException('Tên đăng nhập đã tồn tại');
    if (taken === 'email') throw new ConflictException('Email đã được sử dụng');

    const user = await this.userService.create({
      Username: dto.username,
      Email: dto.email.toLowerCase(),
      FullName: dto.fullName,
      PasswordHash: await bcrypt.hash(dto.password, SALT_ROUNDS), // băm mật khẩu bằng bcrypt
      Role: 'user',
    });

    return { message: 'Đăng ký thành công! Hãy đăng nhập.', user: this.toPublicUser(user) };
  }

  async login(dto: LoginDto) {
    const key = dto.username.toLowerCase();
    this.assertNotLocked(key);

    const user = await this.userService.findForLogin(dto.username);
    const ok = user ? await this.safeCompare(dto.password, user.PasswordHash) : false;

    if (!user || !ok) {
      this.recordFailure(key);
      // Không nói rõ sai username hay sai mật khẩu để tránh dò tài khoản
      throw new UnauthorizedException('Sai tên đăng nhập hoặc mật khẩu');
    }

    this.failedLogins.delete(key);
    const payload: JwtPayload = { sub: user.UserId, username: user.Username, role: user.Role };

    return {
      message: 'Đăng nhập thành công!',
      access_token: await this.jwtService.signAsync(payload),
      token_type: 'Bearer',
      expires_in: process.env.JWT_EXPIRES_IN ?? '1h',
      user: this.toPublicUser(user),
    };
  }

  async me(userId: number) {
    const user = await this.userService.findOne(userId);
    if (!user) throw new UnauthorizedException('Tài khoản không còn tồn tại');
    return this.toPublicUser(user);
  }

  // ----------------- helpers -----------------

  private toPublicUser(u: User) {
    return {
      UserId: u.UserId,
      Username: u.Username,
      Email: u.Email,
      FullName: u.FullName,
      Role: u.Role,
      CreatedAt: u.CreatedAt,
    };
  }

  /** bcrypt.compare ném lỗi nếu PasswordHash trong DB không phải hash hợp lệ (vd dữ liệu mẫu 'hashed_pwd') */
  private async safeCompare(plain: string, hash?: string) {
    if (!hash) return false;
    try {
      return await bcrypt.compare(plain, hash);
    } catch {
      return false;
    }
  }

  private assertNotLocked(key: string) {
    const entry = this.failedLogins.get(key);
    if (entry?.lockedUntil && entry.lockedUntil > Date.now()) {
      const minutes = Math.ceil((entry.lockedUntil - Date.now()) / 60000);
      throw new HttpException(
        `Đăng nhập sai quá ${MAX_FAILED_ATTEMPTS} lần. Vui lòng thử lại sau ${minutes} phút.`,
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
    if (entry?.lockedUntil) this.failedLogins.delete(key); // hết thời gian khóa
  }

  private recordFailure(key: string) {
    const entry = this.failedLogins.get(key) ?? { count: 0 };
    entry.count += 1;
    if (entry.count >= MAX_FAILED_ATTEMPTS) {
      entry.lockedUntil = Date.now() + LOCK_MINUTES * 60_000;
    }
    this.failedLogins.set(key, entry);
  }
}
