import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { ErrorCode } from '../constants/error-codes';
import { BusinessException } from '../exceptions/business.exception';

/**
 * JWT 인증 Guard
 *
 * 모든 요청에서 JWT 토큰을 검증하고, request.user에 사용자 정보를 설정
 * @Public() 데코레이터가 있는 엔드포인트는 검증 생략
 *
 * TODO: AuthModule 구현 시 실제 JWT 검증 로직 추가
 *
 * @example
 * // app.module.ts에서 전역으로 적용
 * {
 *   provide: APP_GUARD,
 *   useClass: JwtAuthGuard,
 * }
 *
 * @example
 * // Controller에서 사용
 * @UseGuards(JwtAuthGuard)
 * @Get('/protected')
 * async getProtectedData() {
 *   return { message: 'Protected' };
 * }
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // @Public() 데코레이터가 있으면 인증 생략
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new BusinessException(
        ErrorCode.AUTH_UNAUTHORIZED,
        '인증 토큰이 필요합니다.',
      );
    }

    try {
      // TODO: JWT 검증 로직 구현
      // const payload = await this.jwtService.verifyAsync(token);
      // request.user = payload;

      // 임시: 개발용 Mock 데이터
      // 실제 구현 시 이 부분을 JWT 검증 결과로 대체
      request.user = {
        userId: 'mock-user-id',
        employeeNo: 'EMP001',
        email: 'test@example.com',
        name: '테스트 사용자',
        role: 'MEMBER',
      };

      return true;
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new BusinessException(
          ErrorCode.AUTH_TOKEN_EXPIRED,
          '토큰이 만료되었습니다.',
        );
      }

      throw new BusinessException(
        ErrorCode.AUTH_INVALID_TOKEN,
        '유효하지 않은 토큰입니다.',
      );
    }
  }

  /**
   * Authorization 헤더에서 Bearer 토큰 추출
   */
  private extractTokenFromHeader(request: any): string | undefined {
    const authorization = request.headers.authorization;
    if (!authorization) {
      return undefined;
    }

    const [type, token] = authorization.split(' ');
    return type === 'Bearer' ? token : undefined;
  }
}
