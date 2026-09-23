import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module'; 
import { TransactionModule } from './transaction/transaction.module';

@Module({
  imports: [DatabaseModule, TransactionModule], 
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}