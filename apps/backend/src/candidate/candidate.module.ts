import { Module } from '@nestjs/common';
import { CandidateController } from './candidate.controller';
import { CandidateService } from './candidate.service';

/**
 * 후보 모듈
 *
 * 후보 관리 및 초대 수락/거절 기능을 제공합니다.
 *
 * 제공 기능:
 * - 후보 목록 조회 (ACCEPTED만 - 회원용)
 * - 전체 후보 목록 조회 (관리자용)
 * - 후보 생성 (추천 상위 N명 - 관리자용)
 * - 후보 상태 변경 (수락/거절 - 후보 본인)
 *
 * 후보 상태 흐름:
 * PENDING (추천으로 생성) → INVITED (관리자가 초대) → ACCEPTED/DECLINED (후보 응답)
 *
 * 의존성:
 * - @prisma/client: 데이터베이스 접근
 *
 * 권한:
 * - GET /elections/:id/candidates: 인증된 사용자
 * - GET /elections/:id/candidates/admin: ADMIN 역할 필요
 * - POST /elections/:id/candidates: ADMIN 역할 필요
 * - PATCH /candidates/:id/status: 해당 후보 본인만 가능
 *
 * 알림 통합:
 * - 후보 초대 시 알림 발송 (stub)
 * - 후보 응답 시 관리자에게 알림 발송 (stub)
 */
@Module({
  controllers: [CandidateController],
  providers: [CandidateService],
  exports: [CandidateService], // 다른 모듈에서 사용 가능하도록 export
})
export class CandidateModule {}
