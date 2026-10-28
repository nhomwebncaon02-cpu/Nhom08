import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';
import { TransactionModule } from './transaction/transaction.module';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/entities/user.module';
import { CategoryModule } from './category/category.module';
import { AccountModule } from './Account/account.module';

@Module({
  imports: [
    DatabaseModule,
    AuthModule, // chứa guard JWT + Role toàn cục
    UserModule,
    CategoryModule,
    AccountModule,
    TransactionModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
