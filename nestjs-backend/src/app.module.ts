import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';
import { TransactionModule } from './transaction/transaction.module';
import { CategoryModule } from './category.module';

@Module({
  imports: [DatabaseModule, TransactionModule, CategoryModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}