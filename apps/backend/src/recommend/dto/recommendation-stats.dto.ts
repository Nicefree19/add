import { ElectionRole } from './create-recommendation.dto';

/**
 * 후보별 추천 통계 DTO
 */
export class CandidateRecommendationStats {
  /**
   * 후보 ID
   */
  candidateId: string;

  /**
   * 후보 사용자 ID
   */
  userId: string;

  /**
   * 후보 이름
   */
  name: string;

  /**
   * 후보 이메일
   */
  email: string;

  /**
   * 사번
   */
  employeeNo: string;

  /**
   * 추천받은 역할
   */
  forRole: ElectionRole;

  /**
   * 추천 수
   */
  recommendationCount: number;

  /**
   * 추천 이유 샘플 (상위 N개)
   */
  reasonSamples: string[];
}

/**
 * 역할별 추천 통계 DTO
 */
export class RoleRecommendationStats {
  /**
   * 역할
   */
  role: ElectionRole;

  /**
   * 총 추천 수
   */
  totalRecommendations: number;

  /**
   * 후보별 통계
   */
  candidates: CandidateRecommendationStats[];
}

/**
 * 추천 현황 전체 응답 DTO
 */
export class RecommendationStatsResponseDto {
  /**
   * 선거 ID
   */
  electionId: string;

  /**
   * 선거 이름
   */
  electionName: string;

  /**
   * 총 추천 수
   */
  totalRecommendations: number;

  /**
   * 역할별 추천 통계
   */
  byRole: RoleRecommendationStats[];
}
