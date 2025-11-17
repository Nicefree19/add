import { Injectable, Logger } from '@nestjs/common';
import { PrismaClient, ElectionStatus as PrismaElectionStatus } from '@prisma/client';
import { ErrorCode } from '../common/constants/error-codes';
import { BusinessException } from '../common/exceptions/business.exception';
import {
  PaginatedResponse,
  PaginationHelper,
} from '../common/dto/pagination.dto';
import {
  CreateElectionDto,
  UpdateElectionDto,
  UpdateElectionStatusDto,
  ElectionListQueryDto,
  ElectionResponseDto,
  ElectionStatus,
} from './dto';

/**
 * 선거 서비스
 *
 * 선거 회차 생성, 조회, 수정 및 상태 관리 기능 제공
 *
 * 주요 기능:
 * - 선거 목록 조회 (페이지네이션, 필터링)
 * - 선거 상세 조회
 * - 선거 생성 (관리자 전용)
 * - 선거 정보 수정 (관리자 전용)
 * - 선거 상태 변경 (관리자 전용, 상태 전이 규칙 적용)
 */
@Injectable()
export class ElectionService {
  private readonly logger = new Logger(ElectionService.name);
  private readonly prisma: PrismaClient;

  // 상태 전이 규칙: PLANNING → RECOMMEND → CANDIDATE_CONFIRM → VOTING → CLOSED
  private readonly STATE_TRANSITIONS: Map<ElectionStatus, ElectionStatus[]> = new Map([
    [ElectionStatus.PLANNING, [ElectionStatus.RECOMMEND, ElectionStatus.CANCELLED]],
    [ElectionStatus.RECOMMEND, [ElectionStatus.CANDIDATE_CONFIRM, ElectionStatus.CANCELLED]],
    [ElectionStatus.CANDIDATE_CONFIRM, [ElectionStatus.VOTING, ElectionStatus.CANCELLED]],
    [ElectionStatus.VOTING, [ElectionStatus.CLOSED, ElectionStatus.CANCELLED]],
    [ElectionStatus.CLOSED, []], // 완료 상태에서는 전이 불가
    [ElectionStatus.CANCELLED, []], // 취소 상태에서는 전이 불가
  ]);

  constructor() {
    this.prisma = new PrismaClient();
  }

  /**
   * 선거 목록 조회
   *
   * 페이지네이션 및 필터링을 지원합니다.
   * MEMBER도 조회 가능 (공개 정보)
   *
   * @param query - 조회 옵션 (페이지, 필터 등)
   * @returns 페이지네이션된 선거 목록
   */
  async findAll(
    query: ElectionListQueryDto,
  ): Promise<PaginatedResponse<ElectionResponseDto>> {
    const { page = 1, limit = 10, status } = query;

    // 필터 조건 구성
    const where: any = {
      isActive: true, // 활성 선거만 조회
    };

    if (status) {
      where.status = status as PrismaElectionStatus;
    }

    // 페이지네이션 파라미터 계산
    const { skip, take } = PaginationHelper.getPrismaParams(page, limit);

    // 전체 개수 및 데이터 조회 (병렬 실행)
    const [total, elections] = await Promise.all([
      this.prisma.electionRound.count({ where }),
      this.prisma.electionRound.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: {
              candidates: true,
              recommendations: true,
              votes: true,
            },
          },
        },
      }),
    ]);

    this.logger.log(
      `Retrieved ${elections.length} elections (page ${page}, total ${total})`,
    );

    // 응답 데이터 변환
    const items = ElectionResponseDto.fromPrismaMany(elections);

    return PaginationHelper.createResponse(items, total, page, limit);
  }

  /**
   * 선거 상세 조회
   *
   * 특정 선거의 상세 정보를 반환합니다.
   *
   * @param id - 선거 ID
   * @returns 선거 상세 정보
   */
  async findOne(id: string): Promise<ElectionResponseDto> {
    const election = await this.prisma.electionRound.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            candidates: true,
            recommendations: true,
            votes: true,
          },
        },
      },
    });

    if (!election) {
      throw new BusinessException(
        ErrorCode.ELECTION_NOT_FOUND,
        '선거를 찾을 수 없습니다.',
      );
    }

    this.logger.log(`Retrieved election ${election.name} (${election.id})`);

    return ElectionResponseDto.fromPrisma(election);
  }

  /**
   * 선거 생성
   *
   * 새로운 선거 회차를 생성합니다.
   * 관리자 전용 기능입니다.
   *
   * @param dto - 선거 생성 정보
   * @returns 생성된 선거 정보
   */
  async create(dto: CreateElectionDto): Promise<ElectionResponseDto> {
    // 날짜 유효성 검증
    this.validateDateRanges(
      new Date(dto.recommendationStartDate),
      new Date(dto.recommendationEndDate),
      new Date(dto.votingStartDate),
      new Date(dto.votingEndDate),
    );

    // 선거 생성
    const election = await this.prisma.electionRound.create({
      data: {
        name: dto.name,
        description: dto.description,
        status: PrismaElectionStatus.PLANNING, // 초기 상태는 PLANNING
        recommendationStartDate: new Date(dto.recommendationStartDate),
        recommendationEndDate: new Date(dto.recommendationEndDate),
        votingStartDate: new Date(dto.votingStartDate),
        votingEndDate: new Date(dto.votingEndDate),
        maxRecommendations: dto.maxRecommendations || 3,
        isActive: true,
      },
      include: {
        _count: {
          select: {
            candidates: true,
            recommendations: true,
            votes: true,
          },
        },
      },
    });

    this.logger.log(`Created new election: ${election.name} (${election.id})`);

    return ElectionResponseDto.fromPrisma(election);
  }

  /**
   * 선거 정보 수정
   *
   * 선거의 기본 정보를 수정합니다.
   * 관리자 전용 기능입니다.
   *
   * @param id - 선거 ID
   * @param dto - 수정할 정보
   * @returns 수정된 선거 정보
   */
  async update(id: string, dto: UpdateElectionDto): Promise<ElectionResponseDto> {
    // 선거 존재 여부 확인
    const existingElection = await this.prisma.electionRound.findUnique({
      where: { id },
    });

    if (!existingElection) {
      throw new BusinessException(
        ErrorCode.ELECTION_NOT_FOUND,
        '선거를 찾을 수 없습니다.',
      );
    }

    // 날짜가 변경되는 경우 유효성 검증
    if (
      dto.recommendationStartDate ||
      dto.recommendationEndDate ||
      dto.votingStartDate ||
      dto.votingEndDate
    ) {
      const recStartDate = dto.recommendationStartDate
        ? new Date(dto.recommendationStartDate)
        : existingElection.recommendationStartDate;
      const recEndDate = dto.recommendationEndDate
        ? new Date(dto.recommendationEndDate)
        : existingElection.recommendationEndDate;
      const voteStartDate = dto.votingStartDate
        ? new Date(dto.votingStartDate)
        : existingElection.votingStartDate;
      const voteEndDate = dto.votingEndDate
        ? new Date(dto.votingEndDate)
        : existingElection.votingEndDate;

      this.validateDateRanges(recStartDate, recEndDate, voteStartDate, voteEndDate);
    }

    // 선거 정보 수정
    const updateData: any = {};
    if (dto.name !== undefined) updateData.name = dto.name;
    if (dto.description !== undefined) updateData.description = dto.description;
    if (dto.recommendationStartDate !== undefined)
      updateData.recommendationStartDate = new Date(dto.recommendationStartDate);
    if (dto.recommendationEndDate !== undefined)
      updateData.recommendationEndDate = new Date(dto.recommendationEndDate);
    if (dto.votingStartDate !== undefined)
      updateData.votingStartDate = new Date(dto.votingStartDate);
    if (dto.votingEndDate !== undefined)
      updateData.votingEndDate = new Date(dto.votingEndDate);
    if (dto.maxRecommendations !== undefined)
      updateData.maxRecommendations = dto.maxRecommendations;

    const updatedElection = await this.prisma.electionRound.update({
      where: { id },
      data: updateData,
      include: {
        _count: {
          select: {
            candidates: true,
            recommendations: true,
            votes: true,
          },
        },
      },
    });

    this.logger.log(`Updated election: ${updatedElection.name} (${id})`);

    return ElectionResponseDto.fromPrisma(updatedElection);
  }

  /**
   * 선거 상태 변경
   *
   * 선거의 상태를 변경합니다.
   * 상태 전이 규칙을 적용합니다.
   * 관리자 전용 기능입니다.
   *
   * @param id - 선거 ID
   * @param dto - 변경할 상태 정보
   * @returns 수정된 선거 정보
   */
  async updateStatus(
    id: string,
    dto: UpdateElectionStatusDto,
  ): Promise<ElectionResponseDto> {
    // 선거 존재 여부 확인
    const existingElection = await this.prisma.electionRound.findUnique({
      where: { id },
    });

    if (!existingElection) {
      throw new BusinessException(
        ErrorCode.ELECTION_NOT_FOUND,
        '선거를 찾을 수 없습니다.',
      );
    }

    const currentStatus = existingElection.status as unknown as ElectionStatus;
    const newStatus = dto.status;

    // 상태 전이 유효성 검증
    this.validateStatusTransition(currentStatus, newStatus);

    // 상태별 날짜 검증
    this.validateStatusDates(newStatus, existingElection);

    // 상태 업데이트
    const updatedElection = await this.prisma.electionRound.update({
      where: { id },
      data: { status: newStatus as unknown as PrismaElectionStatus },
      include: {
        _count: {
          select: {
            candidates: true,
            recommendations: true,
            votes: true,
          },
        },
      },
    });

    this.logger.log(
      `Election ${updatedElection.name} status changed from ${currentStatus} to ${newStatus}`,
    );

    return ElectionResponseDto.fromPrisma(updatedElection);
  }

  /**
   * [Private] 상태 전이 유효성 검증
   *
   * 현재 상태에서 새로운 상태로의 전이가 허용되는지 확인합니다.
   *
   * @param currentStatus - 현재 상태
   * @param newStatus - 새로운 상태
   * @throws BusinessException - 허용되지 않는 상태 전이인 경우
   */
  private validateStatusTransition(
    currentStatus: ElectionStatus,
    newStatus: ElectionStatus,
  ): void {
    // 같은 상태로는 전이 불가
    if (currentStatus === newStatus) {
      throw new BusinessException(
        ErrorCode.ELECTION_INVALID_STATUS_TRANSITION,
        `이미 ${newStatus} 상태입니다.`,
      );
    }

    // 허용된 전이 목록 확인
    const allowedTransitions = this.STATE_TRANSITIONS.get(currentStatus) || [];

    if (!allowedTransitions.includes(newStatus)) {
      throw new BusinessException(
        ErrorCode.ELECTION_INVALID_STATUS_TRANSITION,
        `${currentStatus}에서 ${newStatus}로의 상태 전이는 허용되지 않습니다.`,
      );
    }
  }

  /**
   * [Private] 상태별 날짜 검증
   *
   * 특정 상태로 전이할 때 필요한 날짜 조건을 검증합니다.
   *
   * @param newStatus - 새로운 상태
   * @param election - 선거 정보
   * @throws BusinessException - 날짜 조건이 맞지 않는 경우
   */
  private validateStatusDates(newStatus: ElectionStatus, election: any): void {
    const now = new Date();

    switch (newStatus) {
      case ElectionStatus.RECOMMEND:
        // 추천 기간이 유효한지 확인
        if (
          election.recommendationStartDate > election.recommendationEndDate
        ) {
          throw new BusinessException(
            ErrorCode.ELECTION_INVALID_DATE_RANGE,
            '추천 시작 날짜가 종료 날짜보다 늦습니다.',
          );
        }
        break;

      case ElectionStatus.VOTING:
        // 투표 기간이 유효한지 확인
        if (election.votingStartDate > election.votingEndDate) {
          throw new BusinessException(
            ErrorCode.ELECTION_INVALID_DATE_RANGE,
            '투표 시작 날짜가 종료 날짜보다 늦습니다.',
          );
        }
        // 투표 시작일이 추천 종료일 이후인지 확인
        if (election.votingStartDate < election.recommendationEndDate) {
          throw new BusinessException(
            ErrorCode.ELECTION_INVALID_DATE_RANGE,
            '투표 시작 날짜는 추천 종료 날짜 이후여야 합니다.',
          );
        }
        break;

      default:
        // 다른 상태는 별도 날짜 검증 없음
        break;
    }
  }

  /**
   * [Private] 날짜 범위 유효성 검증
   *
   * 선거 생성/수정 시 날짜 범위가 유효한지 확인합니다.
   *
   * @param recStartDate - 추천 시작 날짜
   * @param recEndDate - 추천 종료 날짜
   * @param voteStartDate - 투표 시작 날짜
   * @param voteEndDate - 투표 종료 날짜
   * @throws BusinessException - 날짜 범위가 유효하지 않은 경우
   */
  private validateDateRanges(
    recStartDate: Date,
    recEndDate: Date,
    voteStartDate: Date,
    voteEndDate: Date,
  ): void {
    // 추천 기간 검증
    if (recStartDate >= recEndDate) {
      throw new BusinessException(
        ErrorCode.ELECTION_INVALID_DATE_RANGE,
        '추천 시작 날짜는 종료 날짜보다 빨라야 합니다.',
      );
    }

    // 투표 기간 검증
    if (voteStartDate >= voteEndDate) {
      throw new BusinessException(
        ErrorCode.ELECTION_INVALID_DATE_RANGE,
        '투표 시작 날짜는 종료 날짜보다 빨라야 합니다.',
      );
    }

    // 추천과 투표 기간 순서 검증
    if (voteStartDate <= recEndDate) {
      throw new BusinessException(
        ErrorCode.ELECTION_INVALID_DATE_RANGE,
        '투표 시작 날짜는 추천 종료 날짜보다 늦어야 합니다.',
      );
    }
  }

  /**
   * 서비스 종료 시 Prisma 연결 해제
   */
  async onModuleDestroy() {
    await this.prisma.$disconnect();
  }
}
