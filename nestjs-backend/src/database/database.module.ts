import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

// Thông tin kết nối đọc từ .env — KHÔNG hard-code mật khẩu trong source code
@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      useFactory: () => ({
        type: 'mysql' as const,
        host: process.env.DB_HOST,
        port: Number(process.env.DB_PORT ?? 3306),
        username: process.env.DB_USERNAME,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME ?? 'QUANLYCHITIEU',
        entities: [__dirname + '/../**/*.entity{.ts,.js}'],
        synchronize: false,
        autoLoadEntities: true,
        // Đặt DB_SSL=true nếu server MySQL yêu cầu kết nối SSL
        ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
      }),
    }),
  ],
})
export class DatabaseModule {}
