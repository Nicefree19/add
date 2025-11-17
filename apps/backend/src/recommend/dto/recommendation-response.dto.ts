import { ElectionRole } from './create-recommendation.dto';

/**
 * 추천 응답 DTO
 *
 * 개별 추천 정보를 반환할 때 사용
 */
export class RecommendationResponseDto {
  id: string;
  electionId: string;
  recommenderId: string;
  candidateId: string;
  forRole: ElectionRole;
  comment: string | null;
  createdAt: Date;

  // 관계 정보
  recommender?: {
    id: string;
    name: string;
    email: string;
    employeeNo: string;
  };

  candidate?: {
    id: string;
    userId: string;
    userName: string;
    userEmail: string;
    status: string;
  };

  /**
   * Prisma Recommendation 객체를 DTO로 변환
   */
  static fromPrisma(recommendation: any): RecommendationResponseDto {
    return {
      id: recommendation.id,
      electionId: recommendation.electionId,
      recommenderId: recommendation.recommenderId,
      candidateId: recommendation.candidateId,
      forRole: recommendation.forRole as ElectionRole,
      comment: recommendation.comment,
      createdAt: recommendation.createdAt,
      recommender: recommendation.recommender
        ? {
            id: recommendation.recommender.id,
            name: recommendation.recommender.name,
            email: recommendation.recommender.email,
            employeeNo: recommendation.recommender.employeeNo,
          }
        : undefined,
      candidate: recommendation.candidate
        ? {
            id: recommendation.candidate.id,
            userId: recommendation.candidate.userId,
            userName: recommendation.candidate.user?.name,
            userEmail: recommendation.candidate.user?.email,
            status: recommendation.candidate.status,
          }
        : undefined,
    };
  }

  /**
   * 여러 추천을 변환
   */
  static fromPrismaMany(recommendations: any[]): RecommendationResponseDto[] {
    return recommendations.map((rec) => RecommendationResponseDto.fromPrisma(rec));
  }
}
