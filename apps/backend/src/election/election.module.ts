import { Module } from '@nestjs/common';
import { ElectionController } from './election.controller';
import { ElectionService } from './election.service';

/**
 * 선거 모듈
 *
 * 선거 회차 생성, 조회, 수정 및 상태 관리 기능을 제공합니다.
 *
 * 제공 기능:
 * - 선거 목록 조회 (페이지네이션, 필터링)
 * - 선거 상세 조회
 * - 선거 생성 (관리자 전용)
 * - 선거 정보 수정 (관리자 전용)
 * - 선거 상태 변경 (관리자 전용)
 *
 * 상태 전이 규칙:
 * PLANNING → RECOMMEND → CANDIDATE_CONFIRM → VOTING → CLOSED
 * (언제든지 CANCELLED로 전이 가능)
 *
 * 의존성:
 * - @prisma/client: 데이터베이스 접근
 *
 * 권한:
 * - GET /elections: 인증된 사용자 (MEMBER 포함)
 * - GET /elections/:id: 인증된 사용자 (MEMBER 포함)
 * - POST /elections: ADMIN 역할 필요
 * - PATCH /elections/:id: ADMIN 역할 필요
 * - PATCH /elections/:id/status: ADMIN 역할 필요
 */
@Module({
  controllers: [ElectionController],
  providers: [ElectionService],
  exports: [ElectionService], // 다른 모듈에서 사용 가능하도록 export
})
export class ElectionModule {}
