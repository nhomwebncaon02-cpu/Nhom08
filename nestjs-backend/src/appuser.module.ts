import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserModule } from './user/entities/user.module'; 

@Module({
  imports: [
    
    
    UserModule, 
  ],
})
export class AppModule {}
