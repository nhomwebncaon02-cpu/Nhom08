// Nạp biến môi trường từ file .env TRƯỚC mọi import khác
import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { BadRequestException, ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { SanitizePipe } from './common/pipes/sanitize.pipe';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 1. Header bảo mật HTTP (X-Content-Type-Options, X-Frame-Options, CSP...)
  app.use(helmet());

  // 2. CORS: chỉ cho phép các origin frontend khai báo trong .env
  const allowedOrigins = (process.env.CORS_ORIGINS ?? 'http://localhost:5173')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);

  app.enableCors({
    origin: (origin, callback) => {
      // Cho phép request không có Origin (Postman, curl, server-to-server)
      if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error(`CORS: origin ${origin} không được phép`), false);
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    maxAge: 3600,
  });

  // 3. Pipe toàn cục — chạy theo thứ tự: làm sạch HTML (chống XSS) -> validate DTO
  app.useGlobalPipes(
    new SanitizePipe(),
    new ValidationPipe({
      whitelist: true, // bỏ các field không khai báo trong DTO
      forbidNonWhitelisted: true, // gửi field lạ -> 400 (chống mass-assignment)
      transform: true, // tự chuyển kiểu (string -> number...)
      stopAtFirstError: true,
      exceptionFactory: (errors) =>
        new BadRequestException({
          statusCode: 400,
          message: errors.flatMap((e) => Object.values(e.constraints ?? {})),
          error: 'Dữ liệu không hợp lệ',
        }),
    }),
  );

  const port = Number(process.env.PORT ?? 3000);
  await app.listen(port);
  console.log(`🚀 API đang chạy tại http://localhost:${port}`);
}
bootstrap();
