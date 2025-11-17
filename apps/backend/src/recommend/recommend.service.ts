import { Injectable, Logger } from '@nestjs/common';
import {
  PrismaClient,
  ElectionRole as PrismaElectionRole,
  CandidateStatus as PrismaCandidateStatus,
  ElectionStatus as PrismaElectionStatus,
} from '@prisma/client';
import { ErrorCode } from '../common/constants/error-codes';
import { BusinessException } from '../common/exceptions/business.exception';
import {
  CreateRecommendationDto,
  RecommendationResponseDto,
  RecommendationStatsResponseDto,
  RoleRecommendationStats,
  CandidateRecommendationStats,
  ElectionRole,
} from './dto';

/**
 * 추천 서비스
 *
 * 회원의 후보 추천 및 관리자의 추천 현황 조회 기능 제공
 *
 * 주요 기능:
 * - 후보 추천 생성 (회원)
 * - 추천 현황 조회 (관리자)
 */
@Injectable()
export class RecommendService {
  private readonly logger = new Logger(RecommendService.name);
  private readonly prisma: PrismaClient;

  // 이유 샘플 개수
  private readonly REASON_SAMPLE_COUNT = 5;

  constructor() {
    this.prisma = new PrismaClient();
  }

  /**
   * 추천 생성
   *
   * 회원이 특정 선거의 특정 역할에 대해 후보를 추천합니다.
   *
   * 검증 규칙:
   * - 선거 상태가 RECOMMEND여야 함
   * - 자기 자신을 추천할 수 없음
   * - 같은 선거, 같은 역할에 대해 한 번만 추천 가능
   *
   * @param electionId - 선거 ID
   * @param recommenderId - 추천자 ID
   * @param dto - 추천 정보
   * @returns 생성된 추천 정보
   */
  async createRecommendation(
    electionId: string,
    recommenderId: string,
    dto: CreateRecommendationDto,
  ): Promise<RecommendationResponseDto> {
    // 1. 선거 존재 및 상태 확인
    const election = await this.prisma.electionRound.findUnique({
      where: { id: electionId },
    });

    if (!election) {
      throw new BusinessException(
        ErrorCode.ELECTION_NOT_FOUND,
        '선거를 찾을 수 없습니다.',
      );
    }

    // 선거 상태가 RECOMMEND가 아니면 에러
    if (election.status !== PrismaElectionStatus.RECOMMEND) {
      throw new BusinessException(
        ErrorCode.ELECTION_NOT_IN_RECOMMENDATION_PERIOD,
        '추천 기간이 아닙니다.',
      );
    }

    // 2. 자기 자신 추천 방지
    if (recommenderId === dto.candidateUserId) {
      throw new BusinessException(
        ErrorCode.RECOMMEND_SELF_NOT_ALLOWED,
        '자기 자신을 추천할 수 없습니다.',
      );
    }

    // 3. 후보 사용자 존재 및 활성화 상태 확인
    const candidateUser = await this.prisma.user.findUnique({
      where: { id: dto.candidateUserId },
    });

    if (!candidateUser) {
      throw new BusinessException(
        ErrorCode.USER_NOT_FOUND,
        '추천할 사용자를 찾을 수 없습니다.',
      );
    }

    // 비활성화된 사용자는 추천할 수 없음
    if (!candidateUser.isActive) {
      throw new BusinessException(
        ErrorCode.USER_INACTIVE,
        '비활성화된 사용자는 추천할 수 없습니다.',
      );
    }

    // 4. 후보자 레코드 찾거나 생성 (upsert)
    const candidate = await this.prisma.candidate.upsert({
      where: {
        userId_electionId_forRole: {
          userId: dto.candidateUserId,
          electionId: electionId,
          forRole: dto.forRole as PrismaElectionRole,
        },
      },
      update: {}, // 이미 존재하면 업데이트하지 않음
      create: {
        userId: dto.candidateUserId,
        electionId: electionId,
        forRole: dto.forRole as PrismaElectionRole,
        status: PrismaCandidateStatus.PENDING, // 기본 상태: PENDING
      },
    });

    // 5. 중복 추천 확인 (이미 추천했는지)
    const existingRecommendation = await this.prisma.recommendation.findUnique({
      where: {
        electionId_recommenderId_forRole: {
          electionId: electionId,
          recommenderId: recommenderId,
          forRole: dto.forRole as PrismaElectionRole,
        },
      },
    });

    if (existingRecommendation) {
      throw new BusinessException(
        ErrorCode.RECOMMEND_DUPLICATE_FOR_ROLE,
        '해당 역할에 대해 이미 추천했습니다.',
      );
    }

    // 6. 추천 생성
    const recommendation = await this.prisma.recommendation.create({
      data: {
        electionId: electionId,
        recommenderId: recommenderId,
        candidateId: candidate.id,
        forRole: dto.forRole as PrismaElectionRole,
        comment: dto.reason || null,
      },
      include: {
        recommender: true,
        candidate: {
          include: {
            user: true,
          },
        },
      },
    });

    this.logger.log(
      `Recommendation created: ${recommenderId} recommended ${candidateUser.name} for ${dto.forRole} in election ${electionId}`,
    );

    return RecommendationResponseDto.fromPrisma(recommendation);
  }

  /**
   * 추천 현황 조회
   *
   * 관리자가 특정 선거의 추천 현황을 조회합니다.
   * 역할별, 후보별로 그룹화하여 통계를 제공합니다.
   *
   * @param electionId - 선거 ID
   * @returns 추천 현황 통계
   */
  async getRecommendationStats(
    electionId: string,
  ): Promise<RecommendationStatsResponseDto> {
    // 1. 선거 존재 확인
    const election = await this.prisma.electionRound.findUnique({
      where: { id: electionId },
    });

    if (!election) {
      throw new BusinessException(
        ErrorCode.ELECTION_NOT_FOUND,
        '선거를 찾을 수 없습니다.',
      );
    }

    // 2. 모든 추천 조회 (관계 데이터 포함)
    const recommendations = await this.prisma.recommendation.findMany({
      where: { electionId },
      include: {
        candidate: {
          include: {
            user: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // 3. 역할별로 그룹화
    const roleGroups = this.groupByRole(recommendations);

    // 4. 역할별 통계 생성
    const byRole: RoleRecommendationStats[] = [];

    for (const [role, recs] of Object.entries(roleGroups)) {
      // 후보별로 그룹화
      const candidateGroups = this.groupByCandidate(recs);

      // 후보별 통계 생성
      const candidates: CandidateRecommendationStats[] = [];

      for (const [candidateId, candidateRecs] of Object.entries(candidateGroups)) {
        const firstRec = candidateRecs[0];
        const candidateUser = firstRec.candidate.user;

        // 이유 샘플 추출 (상위 N개, null 제외)
        const reasonSamples = candidateRecs
          .map((rec) => rec.comment)
          .filter((comment) => comment !== null && comment.trim() !== '')
          .slice(0, this.REASON_SAMPLE_COUNT) as string[];

        candidates.push({
          candidateId: firstRec.candidate.id,
          userId: candidateUser.id,
          name: candidateUser.name,
          email: candidateUser.email,
          employeeNo: candidateUser.employeeNo,
          forRole: role as ElectionRole,
          recommendationCount: candidateRecs.length,
          reasonSamples,
        });
      }

      // 추천 수 기준 내림차순 정렬
      candidates.sort((a, b) => b.recommendationCount - a.recommendationCount);

      byRole.push({
        role: role as ElectionRole,
        totalRecommendations: recs.length,
        candidates,
      });
    }

    // 5. 역할 순서로 정렬 (enum 순서대로)
    const roleOrder = Object.values(ElectionRole);
    byRole.sort((a, b) => roleOrder.indexOf(a.role) - roleOrder.indexOf(b.role));

    this.logger.log(
      `Retrieved recommendation stats for election ${electionId}: ${recommendations.length} total recommendations`,
    );

    return {
      electionId: election.id,
      electionName: election.name,
      totalRecommendations: recommendations.length,
      byRole,
    };
  }

  /**
   * [Private] 역할별로 그룹화
   */
  private groupByRole(recommendations: any[]): Record<string, any[]> {
    return recommendations.reduce((acc, rec) => {
      const role = rec.forRole;
      if (!acc[role]) {
        acc[role] = [];
      }
      acc[role].push(rec);
      return acc;
    }, {} as Record<string, any[]>);
  }

  /**
   * [Private] 후보별로 그룹화
   */
  private groupByCandidate(recommendations: any[]): Record<string, any[]> {
    return recommendations.reduce((acc, rec) => {
      const candidateId = rec.candidateId;
      if (!acc[candidateId]) {
        acc[candidateId] = [];
      }
      acc[candidateId].push(rec);
      return acc;
    }, {} as Record<string, any[]>);
  }

  /**
   * 서비스 종료 시 Prisma 연결 해제
   */
  async onModuleDestroy() {
    await this.prisma.$disconnect();
  }
}
