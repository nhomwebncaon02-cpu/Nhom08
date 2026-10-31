import { Controller, Get, Query } from '@nestjs/common';
import { AdminService } from './admin.service';
import { QueryAuditDto } from './dto/query-audit.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { AUDIT_ACTIONS } from '../audit/audit.service';

/** [Admin] Thống kê hệ thống + nhật ký hoạt động */
@Roles('admin')
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('stats')
  stats() {
    return this.adminService.getStats();
  }

  /** GET /admin/audit-logs?action=&search=&from=&to=&page=&limit= */
  @Get('audit-logs')
  auditLogs(@Query() query: QueryAuditDto) {
    return this.adminService.getAuditLogs(query);
  }

  @Get('audit-actions')
  auditActions() {
    return AUDIT_ACTIONS;
  }
}
