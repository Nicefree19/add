import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { ErrorCode } from '../constants/error-codes';
import { BusinessException } from '../exceptions/business.exception';
import { CurrentUserPayload } from '../decorators/current-user.decorator';

/**
 * 역할 기반 접근 제어 Guard
 *
 * @Roles() 데코레이터로 지정된 역할을 가진 사용자만 접근 허용
 *
 * TODO: AuthModule 구현 시 실제 사용자 역할 검증 로직 추가
 *
 * @example
 * @Roles('ADMIN')
 * @UseGuards(JwtAuthGuard, RolesGuard)
 * @Delete('/users/:id')
 * async deleteUser(@Param('id') id: string) {
 *   return this.userService.delete(id);
 * }
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // @Roles() 데코레이터로 지정된 역할 가져오기
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    // 역할 지정이 없으면 통과
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user as CurrentUserPayload;

    // 사용자 정보가 없으면 거부 (JwtAuthGuard가 먼저 실행되어야 함)
    if (!user) {
      throw new BusinessException(
        ErrorCode.AUTH_UNAUTHORIZED,
        '인증이 필요합니다.',
      );
    }

    // 사용자 역할이 요구되는 역할에 포함되는지 확인
    const hasRole = requiredRoles.some((role) => user.role === role);

    if (!hasRole) {
      throw new BusinessException(
        ErrorCode.AUTH_FORBIDDEN,
        `이 작업은 ${requiredRoles.join(', ')} 역할이 필요합니다.`,
      );
    }

    return true;
  }
}
