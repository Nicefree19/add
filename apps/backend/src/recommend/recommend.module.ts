import { Module } from '@nestjs/common';
import { RecommendController } from './recommend.controller';
import { RecommendService } from './recommend.service';

/**
 * 추천 모듈
 *
 * 선거의 후보 추천 기능을 제공합니다.
 *
 * 제공 기능:
 * - 후보 추천 생성 (회원)
 * - 추천 현황 조회 (관리자 전용)
 *
 * 추천 규칙:
 * - 선거 상태가 RECOMMEND여야 추천 가능
 * - 자기 자신을 추천할 수 없음
 * - 같은 선거, 같은 역할에 대해 한 번만 추천 가능
 * - 추천 시 후보자(Candidate) 레코드가 없으면 자동 생성 (PENDING 상태)
 *
 * 의존성:
 * - @prisma/client: 데이터베이스 접근
 *
 * 권한:
 * - POST /elections/:id/recommendations: 인증된 사용자
 * - GET /elections/:id/recommendations: ADMIN 역할 필요
 */
@Module({
  controllers: [RecommendController],
  providers: [RecommendService],
  exports: [RecommendService], // 다른 모듈에서 사용 가능하도록 export
})
export class RecommendModule {}
