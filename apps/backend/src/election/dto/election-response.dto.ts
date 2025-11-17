import { ElectionStatus } from './update-election-status.dto';

/**
 * 선거 응답 DTO
 *
 * 선거 정보를 반환할 때 사용하는 형식
 */
export class ElectionResponseDto {
  id: string;
  name: string;
  description: string | null;
  status: ElectionStatus;
  recommendationStartDate: Date;
  recommendationEndDate: Date;
  votingStartDate: Date;
  votingEndDate: Date;
  maxRecommendations: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;

  // 추가 정보 (통계)
  candidateCount?: number;
  recommendationCount?: number;
  voteCount?: number;

  /**
   * Prisma ElectionRound 객체를 ElectionResponseDto로 변환
   */
  static fromPrisma(election: any): ElectionResponseDto {
    return {
      id: election.id,
      name: election.name,
      description: election.description,
      status: election.status as ElectionStatus,
      recommendationStartDate: election.recommendationStartDate,
      recommendationEndDate: election.recommendationEndDate,
      votingStartDate: election.votingStartDate,
      votingEndDate: election.votingEndDate,
      maxRecommendations: election.maxRecommendations,
      isActive: election.isActive,
      createdAt: election.createdAt,
      updatedAt: election.updatedAt,
      // 통계 정보 (선택)
      candidateCount: election._count?.candidates,
      recommendationCount: election._count?.recommendations,
      voteCount: election._count?.votes,
    };
  }

  /**
   * 여러 선거를 변환
   */
  static fromPrismaMany(elections: any[]): ElectionResponseDto[] {
    return elections.map((election) => ElectionResponseDto.fromPrisma(election));
  }
}
