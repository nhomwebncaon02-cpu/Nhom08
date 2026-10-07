import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';
import { TransactionModule } from './transaction/transaction.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [DatabaseModule, TransactionModule, AuthModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}