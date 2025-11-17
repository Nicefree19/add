/**
 * 당선자 정보
 */
export interface WinnerInfo {
  role: string;
  candidateId: string;
  candidateName: string;
  employeeNo: string;
  voteCount: number;
  votePercentage: number;
}

/**
 * 결과 요약 응답 DTO
 *
 * 간단한 결과 요약 정보를 반환합니다.
 * 모든 회원이 볼 수 있습니다.
 */
export class ResultSummaryResponseDto {
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
   * 실제 투표자 수
   */
  totalVoters: number;

  /**
   * 투표율 (%)
   */
  turnoutRate: number;

  /**
   * 당선자 목록 (역할별)
   */
  winners: WinnerInfo[];
}
