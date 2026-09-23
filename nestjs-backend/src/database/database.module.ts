import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: 'mysql-22862ebb-st-b044.c.aivencloud.com', 
      port: 26138, 
      username: 'avnadmin',
      password: 'AVNS_E9h0ZzTSczKnkdm0PKE',
      database: 'QUANLYCHITIEU',
      entities: [__dirname + '/../**/*.entity{.ts,.js}'],
      synchronize: false,  
    }),
  ],
})
export class DatabaseModule {}