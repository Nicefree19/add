/**
 * 후보별 득표 정보
 */
export interface CandidateVoteInfo {
  candidateId: string;
  candidateName: string;
  employeeNo: string;
  department: string | null;
  position: string | null;
  voteCount: number;
  votePercentage: number;
}

/**
 * 역할별 투표 결과
 */
export interface RoleVoteResult {
  role: string;
  totalVotes: number;
  candidates: CandidateVoteInfo[];
}

/**
 * 상세 결과 응답 DTO
 *
 * 상세한 투표 결과를 반환합니다.
 * 관리자와 감사만 볼 수 있습니다.
 */
export class ResultDetailResponseDto {
  /**
   * 선거 ID
   */
  electionId: string;

  /**
   * 선거 이름
   */
  electionName: string;

  /**
   * 선거 상태
   */
  electionStatus: string;

  /**
   * 전체 유권자 수
   */
  totalEligibleVoters: number;

  /**
   * 실제 투표자 수 (중복 제거)
   */
  totalVoters: number;

  /**
   * 투표율 (%)
   */
  turnoutRate: number;

  /**
   * 역할별 투표 결과
   */
  byRole: RoleVoteResult[];
}
