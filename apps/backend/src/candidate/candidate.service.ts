import { Injectable, Logger } from '@nestjs/common';
import {
  PrismaClient,
  CandidateStatus as PrismaCandidateStatus,
  ElectionRole as PrismaElectionRole,
} from '@prisma/client';
import { ErrorCode } from '../common/constants/error-codes';
import { BusinessException } from '../common/exceptions/business.exception';
import {
  CandidateResponseDto,
  CreateCandidatesDto,
  UpdateCandidateStatusDto,
  CandidateStatus,
} from './dto';

/**
 * 후보 서비스
 *
 * 후보 관리 및 초대 수락/거절 기능 제공
 *
 * 주요 기능:
 * - 후보 목록 조회 (ACCEPTED만 - 회원용)
 * - 전체 후보 목록 조회 (관리자용)
 * - 후보 생성 (추천 상위 N명 - 관리자용)
 * - 후보 상태 변경 (수락/거절 - 후보 본인)
 */
@Injectable()
export class CandidateService {
  private readonly logger = new Logger(CandidateService.name);
  private readonly prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  /**
   * 후보 목록 조회 (회원용)
   *
   * ACCEPTED 상태의 후보만 반환합니다.
   * 회원들이 투표할 수 있는 후보 목록입니다.
   *
   * @param electionId - 선거 ID
   * @returns ACCEPTED 상태의 후보 목록
   */
  async getCandidates(electionId: string): Promise<CandidateResponseDto[]> {
    // 선거 존재 확인
    const election = await this.prisma.electionRound.findUnique({
      where: { id: electionId },
    });

    if (!election) {
      throw new BusinessException(
        ErrorCode.ELECTION_NOT_FOUND,
        '선거를 찾을 수 없습니다.',
      );
    }

    // ACCEPTED 상태의 후보만 조회
    const candidates = await this.prisma.candidate.findMany({
      where: {
        electionId,
        status: PrismaCandidateStatus.ACCEPTED,
      },
      include: {
        user: true,
        _count: {
          select: {
            recommendations: true,
          },
        },
      },
      orderBy: [
        { forRole: 'asc' },
        { createdAt: 'asc' },
      ],
    });

    this.logger.log(
      `Retrieved ${candidates.length} ACCEPTED candidates for election ${electionId}`,
    );

    return CandidateResponseDto.fromPrismaMany(candidates);
  }

  /**
   * 전체 후보 목록 조회 (관리자용)
   *
   * 모든 상태의 후보를 반환합니다.
   *
   * @param electionId - 선거 ID
   * @returns 모든 후보 목록
   */
  async getAllCandidates(electionId: string): Promise<CandidateResponseDto[]> {
    // 선거 존재 확인
    const election = await this.prisma.electionRound.findUnique({
      where: { id: electionId },
    });

    if (!election) {
      throw new BusinessException(
        ErrorCode.ELECTION_NOT_FOUND,
        '선거를 찾을 수 없습니다.',
      );
    }

    // 모든 후보 조회
    const candidates = await this.prisma.candidate.findMany({
      where: { electionId },
      include: {
        user: true,
        _count: {
          select: {
            recommendations: true,
          },
        },
      },
      orderBy: [
        { forRole: 'asc' },
        { status: 'asc' },
        { createdAt: 'asc' },
      ],
    });

    this.logger.log(
      `Retrieved ${candidates.length} candidates (all statuses) for election ${electionId}`,
    );

    return CandidateResponseDto.fromPrismaMany(candidates);
  }

  /**
   * 후보 생성 (관리자용)
   *
   * 추천 상위 N명을 후보로 지정합니다.
   * PENDING 상태의 후보를 INVITED 상태로 변경합니다.
   *
   * @param electionId - 선거 ID
   * @param dto - 후보 생성 정보 (역할, 상위 N명)
   * @returns 생성된 후보 목록
   */
  async createCandidates(
    electionId: string,
    dto: CreateCandidatesDto,
  ): Promise<CandidateResponseDto[]> {
    const topN = dto.topN || 3;

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

    // 2. 해당 역할의 추천 데이터 조회 (추천 수 기준 정렬)
    const recommendations = await this.prisma.recommendation.findMany({
      where: {
        electionId,
        forRole: dto.forRole as PrismaElectionRole,
      },
      include: {
        candidate: {
          include: {
            user: true,
          },
        },
      },
    });

    // 3. 후보별로 그룹화하여 추천 수 집계
    const candidateRecommendationCounts = new Map<string, number>();
    const candidateMap = new Map<string, any>();

    recommendations.forEach((rec) => {
      const candidateId = rec.candidateId;
      const count = candidateRecommendationCounts.get(candidateId) || 0;
      candidateRecommendationCounts.set(candidateId, count + 1);
      candidateMap.set(candidateId, rec.candidate);
    });

    // 4. 추천 수 기준 내림차순 정렬
    const sortedCandidates = Array.from(candidateRecommendationCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, topN)
      .map(([candidateId]) => candidateMap.get(candidateId));

    if (sortedCandidates.length === 0) {
      throw new BusinessException(
        ErrorCode.CANDIDATE_NOT_FOUND,
        '추천 데이터가 없어 후보를 생성할 수 없습니다.',
      );
    }

    // 5. PENDING 상태의 후보를 INVITED로 변경
    const updatedCandidates = await Promise.all(
      sortedCandidates.map((candidate) =>
        this.prisma.candidate.update({
          where: { id: candidate.id },
          data: { status: PrismaCandidateStatus.INVITED },
          include: {
            user: true,
            _count: {
              select: {
                recommendations: true,
              },
            },
          },
        }),
      ),
    );

    this.logger.log(
      `Created ${updatedCandidates.length} candidates (INVITED) for role ${dto.forRole} in election ${electionId}`,
    );

    // TODO: 알림 발송 (stub)
    // 후보로 지정된 사용자들에게 알림 발송
    updatedCandidates.forEach((candidate) => {
      this.logger.log(
        `[STUB] Notification: User ${candidate.user.email} has been invited as candidate for ${dto.forRole}`,
      );
      // await this.notificationService.sendCandidateInvitation(candidate);
    });

    return CandidateResponseDto.fromPrismaMany(updatedCandidates);
  }

  /**
   * 후보 상태 변경 (후보 본인)
   *
   * 후보가 초대를 수락하거나 거절합니다.
   * INVITED → ACCEPTED 또는 DECLINED
   *
   * @param candidateId - 후보 ID
   * @param userId - 현재 사용자 ID
   * @param dto - 변경할 상태 정보
   * @returns 업데이트된 후보 정보
   */
  async updateCandidateStatus(
    candidateId: string,
    userId: string,
    dto: UpdateCandidateStatusDto,
  ): Promise<CandidateResponseDto> {
    // 1. 후보 존재 확인
    const candidate = await this.prisma.candidate.findUnique({
      where: { id: candidateId },
      include: {
        user: true,
      },
    });

    if (!candidate) {
      throw new BusinessException(
        ErrorCode.CANDIDATE_NOT_FOUND,
        '후보를 찾을 수 없습니다.',
      );
    }

    // 2. 권한 확인: 후보 본인만 변경 가능
    if (candidate.userId !== userId) {
      throw new BusinessException(
        ErrorCode.AUTH_FORBIDDEN,
        '본인의 후보 상태만 변경할 수 있습니다.',
      );
    }

    // 3. 현재 상태 확인: INVITED 상태만 변경 가능
    if (candidate.status !== PrismaCandidateStatus.INVITED) {
      throw new BusinessException(
        ErrorCode.CANDIDATE_INVALID_STATUS,
        'INVITED 상태의 후보만 응답할 수 있습니다.',
      );
    }

    // 4. 상태 업데이트
    const updateData: any = {
      status: dto.status as unknown as PrismaCandidateStatus,
    };

    // ACCEPTED 시 소견서 저장
    if (dto.status === 'ACCEPTED' && dto.statement) {
      updateData.statement = dto.statement;
    }

    const updatedCandidate = await this.prisma.candidate.update({
      where: { id: candidateId },
      data: updateData,
      include: {
        user: true,
        _count: {
          select: {
            recommendations: true,
          },
        },
      },
    });

    this.logger.log(
      `Candidate ${candidateId} status changed to ${dto.status} by user ${userId}`,
    );

    // TODO: 알림 발송 (stub)
    // 관리자에게 후보 응답 알림 발송
    this.logger.log(
      `[STUB] Notification: Candidate ${candidate.user.email} ${dto.status} the invitation for ${candidate.forRole}`,
    );
    // await this.notificationService.sendCandidateResponse(updatedCandidate);

    return CandidateResponseDto.fromPrisma(updatedCandidate);
  }

  /**
   * 서비스 종료 시 Prisma 연결 해제
   */
  async onModuleDestroy() {
    await this.prisma.$disconnect();
  }
}
