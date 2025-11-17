import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { ErrorCode } from '../constants/error-codes';
import { BusinessException } from '../exceptions/business.exception';

/**
 * JWT Payload 인터페이스
 */
interface JwtPayload {
  sub: string; // userId
  employeeNo: string;
  email: string;
  name: string;
  role: string;
  type: 'access' | 'refresh';
}

/**
 * JWT 인증 Guard
 *
 * 모든 요청에서 JWT 토큰을 검증하고, request.user에 사용자 정보를 설정
 * @Public() 데코레이터가 있는 엔드포인트는 검증 생략
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
  constructor(
    private reflector: Reflector,
    private jwtService: JwtService,
  ) {}

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
      // JWT 토큰 검증
      const payload = await this.jwtService.verifyAsync<JwtPayload>(token);

      // Access Token인지 확인
      if (payload.type !== 'access') {
        throw new BusinessException(
          ErrorCode.AUTH_INVALID_TOKEN,
          'Access Token이 아닙니다.',
        );
      }

      // request.user에 사용자 정보 설정
      request.user = {
        userId: payload.sub,
        employeeNo: payload.employeeNo,
        email: payload.email,
        name: payload.name,
        role: payload.role,
      };

      return true;
    } catch (error) {
      // BusinessException은 그대로 전파
      if (error instanceof BusinessException) {
        throw error;
      }

      // JWT 검증 실패 처리
      if (error.name === 'TokenExpiredError') {
        throw new BusinessException(
          ErrorCode.AUTH_TOKEN_EXPIRED,
          '토큰이 만료되었습니다.',
        );
      }

      if (error.name === 'JsonWebTokenError') {
        throw new BusinessException(
          ErrorCode.AUTH_INVALID_TOKEN,
          '유효하지 않은 토큰입니다.',
        );
      }

      // 기타 에러
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
