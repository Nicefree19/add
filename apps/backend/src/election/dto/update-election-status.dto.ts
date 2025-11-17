import { IsEnum, IsNotEmpty } from 'class-validator';

/**
 * 선거 상태
 *
 * 상태 전이 규칙:
 * PLANNING → RECOMMEND → CANDIDATE_CONFIRM → VOTING → CLOSED
 */
export enum ElectionStatus {
  PLANNING = 'PLANNING',               // 계획 단계
  RECOMMEND = 'RECOMMEND',             // 추천 기간
  CANDIDATE_CONFIRM = 'CANDIDATE_CONFIRM', // 후보 확정
  VOTING = 'VOTING',                   // 투표 기간
  CLOSED = 'CLOSED',                   // 완료
  CANCELLED = 'CANCELLED',             // 취소
}

/**
 * 선거 상태 변경 DTO
 *
 * 선거의 상태를 변경할 때 사용
 * 관리자 전용
 *
 * 상태 전이 규칙:
 * - PLANNING → RECOMMEND: 추천 기간 시작
 * - RECOMMEND → CANDIDATE_CONFIRM: 후보 확정 단계로 전환
 * - CANDIDATE_CONFIRM → VOTING: 투표 시작
 * - VOTING → CLOSED: 선거 완료
 * - 언제든지 → CANCELLED: 선거 취소
 *
 * @example
 * {
 *   "status": "RECOMMEND"
 * }
 */
export class UpdateElectionStatusDto {
  /**
   * 변경할 상태
   */
  @IsEnum(ElectionStatus, {
    message: '상태는 PLANNING, RECOMMEND, CANDIDATE_CONFIRM, VOTING, CLOSED, CANCELLED 중 하나여야 합니다.',
  })
  @IsNotEmpty({ message: '상태는 필수 입력 항목입니다.' })
  status: ElectionStatus;
}
