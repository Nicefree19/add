import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD, APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { ElectionModule } from './election/election.module';
import { RecommendModule } from './recommend/recommend.module';
import { CandidateModule } from './candidate/candidate.module';
import { VoteModule } from './vote/vote.module';
import { HealthModule } from './health/health.module';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { TransformResponseInterceptor } from './common/interceptors/transform-response.interceptor';

/**
 * 애플리케이션 루트 모듈
 *
 * 전역 설정:
 * - ConfigModule: 환경 변수 관리 (.env 파일)
 * - ThrottlerModule: Rate limiting (요청 제한)
 * - Guards: JWT 인증 및 역할 기반 권한 검증
 * - Filters: HTTP 예외 처리
 * - Interceptors: 응답 데이터 변환
 *
 * 기능 모듈:
 * - AuthModule: 인증 및 인가
 * - UserModule: 사용자 관리
 * - ElectionModule: 선거 관리
 * - RecommendModule: 후보 추천 관리
 * - CandidateModule: 후보 관리
 * - VoteModule: 투표 및 결과 조회
 * - HealthModule: 헬스 체크 (모니터링, 로드밸런서, Kubernetes 프로브)
 */
@Module({
  imports: [
    // 환경 변수 설정
    ConfigModule.forRoot({
      isGlobal: true, // 모든 모듈에서 사용 가능
      envFilePath: '.env',
    }),

    // Rate limiting (보안: 브루트포스 공격 방지)
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 1분 (60초)
        limit: 20, // 1분당 최대 20개 요청 (일반 엔드포인트)
      },
    ]),

    // 기능 모듈
    AuthModule,
    UserModule,
    ElectionModule,
    RecommendModule,
    CandidateModule,
    VoteModule,
    HealthModule,
  ],
  providers: [
    // 전역 Guards (순서 중요: ThrottlerGuard -> JwtAuthGuard -> RolesGuard)
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard, // Rate limiting (브루트포스 공격 방지)
    },
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
