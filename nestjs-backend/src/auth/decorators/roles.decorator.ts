import { SetMetadata } from '@nestjs/common';
import type { UserRole } from '../../user/entities/user.entity';

export const ROLES_KEY = 'roles';
/** Giới hạn route theo vai trò, vd: @Roles('admin') */
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
