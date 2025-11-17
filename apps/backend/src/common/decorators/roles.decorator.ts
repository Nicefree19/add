import { SetMetadata } from '@nestjs/common';

/**
 * 역할 기반 접근 제어를 위한 데코레이터
 *
 * @example
 * @Roles('ADMIN', 'MEMBER')
 * @Get('/admin')
 * async getAdminData() {
 *   return { message: 'Admin only' };
 * }
 */
export const ROLES_KEY = 'roles';
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
