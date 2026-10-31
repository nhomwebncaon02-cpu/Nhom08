import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';
import { AuditModule } from './audit/audit.module';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/entities/user.module';
import { CategoryModule } from './category/category.module';
import { AccountModule } from './Account/account.module';
import { BudgetModule } from './budget/budget.module';
import { TransactionModule } from './transaction/transaction.module';
import { RecurringModule } from './recurring/recurring.module';
import { GoalModule } from './goal/goal.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { AdminModule } from './admin/admin.module';

@Module({
  imports: [
    DatabaseModule,
    AuditModule, // @Global — nhật ký hoạt động

    // [Thành viên 1] Auth & Security (guard JWT + Role toàn cục)
    AuthModule,
    UserModule, // + hồ sơ cá nhân (/profile)

    // [Thành viên 2] Ví & Ngân sách
    AccountModule,
    BudgetModule,

    // [Thành viên 3] Giao dịch & Danh mục
    CategoryModule,
    TransactionModule,
    RecurringModule, // mở rộng: giao dịch định kỳ

    // [Thành viên 4] Dashboard & Mục tiêu tiết kiệm
    DashboardModule,
    GoalModule,

    // Mở rộng: Quản trị hệ thống
    AdminModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
