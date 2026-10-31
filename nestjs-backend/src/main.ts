// Nạp biến môi trường từ file .env TRƯỚC mọi import khác
import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { BadRequestException, INestApplication, ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { SanitizePipe } from './common/pipes/sanitize.pipe';
import { rateLimit } from './common/middleware/rate-limit.middleware';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 1. Header bảo mật HTTP (X-Content-Type-Options, X-Frame-Options, CSP...)
  app.use(helmet());

  // Giới hạn số request mỗi IP (cấu hình bằng RATE_LIMIT_MAX trong .env)
  app.use(rateLimit({ windowMs: 60_000, max: Number(process.env.RATE_LIMIT_MAX ?? 300) }));

  // 2. CORS: chỉ cho phép các origin frontend khai báo trong .env
  const allowedOrigins = (process.env.CORS_ORIGINS ?? 'http://localhost:5173')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);

  app.enableCors({
    origin: (origin: string | undefined, callback: (error: Error | null, allowed?: boolean) => void) => {
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

  setupSwagger(app);

  const port = Number(process.env.PORT ?? 3000);
  await app.listen(port);
  console.log(`🚀 API đang chạy tại http://localhost:${port}`);
}
/**
 * Tài liệu API tự động (Swagger) tại http://localhost:3000/api-docs
 * Chỉ bật khi đã cài: npm install @nestjs/swagger
 * (chưa cài thì bỏ qua, server vẫn chạy bình thường)
 */
function setupSwagger(app: INestApplication) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { SwaggerModule, DocumentBuilder } = require('@nestjs/swagger');
    const config = new DocumentBuilder()
      .setTitle('SmartMoney API')
      .setDescription('API hệ thống quản lý chi tiêu cá nhân — Nhóm 08')
      .setVersion('2.0')
      .addBearerAuth()
      .build();
    SwaggerModule.setup('api-docs', app, SwaggerModule.createDocument(app, config));
    console.log('📘 Swagger: http://localhost:' + (process.env.PORT ?? 3000) + '/api-docs');
  } catch {
    // chưa cài @nestjs/swagger
  }
}

bootstrap().catch((error: unknown) => {
  console.error('Không thể khởi động API:', error);
  process.exitCode = 1;
});
