import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

/**
 * 인증 모듈
 *
 * 이메일 OTP 로그인 및 JWT 토큰 관리 기능을 제공합니다.
 *
 * 제공 기능:
 * - OTP 생성 및 검증
 * - JWT Access Token 발급 (30분 유효)
 * - JWT Refresh Token 발급 (7일 유효)
 * - Access Token 갱신
 *
 * 의존성:
 * - @nestjs/jwt: JWT 토큰 생성 및 검증
 * - @nestjs/config: 환경 변수 관리
 * - @prisma/client: 데이터베이스 접근
 *
 * 환경 변수:
 * - JWT_SECRET: JWT 서명에 사용할 비밀 키 (필수)
 *   기본값: 'your-secret-key-change-this-in-production'
 *
 * @example
 * // .env 파일 설정
 * JWT_SECRET=your-super-secret-key-here
 */
@Module({
  imports: [
    // ConfigModule: 환경 변수 사용을 위해 import
    ConfigModule,

    // JwtModule: JWT 토큰 생성 및 검증
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        secret:
          configService.get<string>('JWT_SECRET') ||
          'your-secret-key-change-this-in-production',
        signOptions: {
          // 기본 설정 (각 토큰별로 오버라이드 가능)
          issuer: 'employee-association-backend',
          audience: 'employee-association-app',
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService],
  exports: [AuthService, JwtModule], // 다른 모듈에서 사용 가능하도록 export
})
export class AuthModule {}
