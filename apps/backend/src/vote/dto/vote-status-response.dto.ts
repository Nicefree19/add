/**
 * 역할별 투표 상태
 */
export interface RoleVoteStatus {
  role: string;
  hasVoted: boolean;
  votedAt?: Date;
}

/**
 * 투표 상태 응답 DTO
 *
 * 사용자의 투표 여부를 역할별로 반환합니다.
 * 투표한 후보는 노출하지 않습니다 (익명성 보장).
 */
export class VoteStatusResponseDto {
  /**
   * 선거 ID
   */
  electionId: string;

  /**
   * 전체 투표 여부
   */
  hasVotedAny: boolean;

  /**
   * 역할별 투표 상태
   */
  byRole: RoleVoteStatus[];
}
