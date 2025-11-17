import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD, APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { AuthModule } from './auth/auth.module';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { TransformResponseInterceptor } from './common/interceptors/transform-response.interceptor';

/**
 * 애플리케이션 루트 모듈
 *
 * 전역 설정:
 * - ConfigModule: 환경 변수 관리 (.env 파일)
 * - Guards: JWT 인증 및 역할 기반 권한 검증
 * - Filters: HTTP 예외 처리
 * - Interceptors: 응답 데이터 변환
 *
 * 기능 모듈:
 * - AuthModule: 인증 및 인가
 */
@Module({
  imports: [
    // 환경 변수 설정
    ConfigModule.forRoot({
      isGlobal: true, // 모든 모듈에서 사용 가능
      envFilePath: '.env',
    }),

    // 기능 모듈
    AuthModule,
  ],
  providers: [
    // 전역 Guards
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard, // JWT 인증 (전역 적용, @Public()으로 제외 가능)
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard, // 역할 기반 권한 검증
    },

    // 전역 Filters
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter, // HTTP 예외 처리 및 에러 응답 표준화
    },

    // 전역 Interceptors
    {
      provide: APP_INTERCEPTOR,
      useClass: TransformResponseInterceptor, // 응답 데이터 변환
    },
  ],
})
export class AppModule {}
