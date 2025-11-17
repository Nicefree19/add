import { Injectable, Logger } from '@nestjs/common';
import {
  PrismaClient,
  ElectionRole as PrismaElectionRole,
  ElectionStatus as PrismaElectionStatus,
  CandidateStatus as PrismaCandidateStatus,
} from '@prisma/client';
import { createHash } from 'crypto';
import { ErrorCode } from '../common/constants/error-codes';
import { BusinessException } from '../common/exceptions/business.exception';
import {
  CreateVoteDto,
  VoteStatusResponseDto,
  RoleVoteStatus,
  ResultSummaryResponseDto,
  WinnerInfo,
  ResultDetailResponseDto,
  RoleVoteResult,
  CandidateVoteInfo,
} from './dto';

/**
 * 투표 서비스
 *
 * 투표 생성, 상태 조회, 결과 집계 기능 제공
 *
 * 주요 기능:
 * - 투표 상태 조회
 * - 투표 생성 (여러 역할 동시)
 * - 결과 요약 조회
 * - 상세 결과 조회 (관리자/감사)
 */
@Injectable()
export class VoteService {
  private readonly logger = new Logger(VoteService.name);
  private readonly prisma: PrismaClient;

  // 환경 변수에서 가져오는 것이 이상적이지만, 여기서는 상수로 정의
  private readonly SECRET_SALT = process.env.BALLOT_SECRET_SALT || 'default-secret-salt-change-in-production';

  constructor() {
    this.prisma = new PrismaClient();
  }

  /**
   * 투표 상태 조회
   *
   * 사용자가 어떤 역할에 투표했는지 확인합니다.
   * 투표한 후보는 노출하지 않습니다 (익명성 보장).
   *
   * @param electionId - 선거 ID
   * @param userId - 사용자 ID
   * @returns 역할별 투표 상태
   */
  async getVoteStatus(
    electionId: string,
    userId: string,
  ): Promise<VoteStatusResponseDto> {
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

    // 사용자의 투표 내역 조회 (후보 정보는 제외)
    const votes = await this.prisma.vote.findMany({
      where: {
        electionId,
        voterId: userId,
      },
      select: {
        forRole: true,
        createdAt: true,
      },
    });

    // 역할별 투표 상태 매핑
    const byRole: RoleVoteStatus[] = Object.values(PrismaElectionRole).map((role) => {
      const vote = votes.find((v) => v.forRole === role);
      return {
        role,
        hasVoted: !!vote,
        votedAt: vote?.createdAt,
      };
    });

    return {
      electionId,
      hasVotedAny: votes.length > 0,
      byRole,
    };
  }

  /**
   * 투표 생성
   *
   * 여러 역할에 대해 동시에 투표합니다.
   * 각 역할별로 Vote 레코드를 생성합니다.
   *
   * @param electionId - 선거 ID
   * @param userId - 투표자 ID
   * @param dto - 투표 정보 (역할별 후보 ID)
   * @returns 생성된 투표 정보 (익명화됨)
   */
  async createVotes(
    electionId: string,
    userId: string,
    dto: CreateVoteDto,
  ): Promise<{ message: string; votedRoles: string[] }> {
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

    // 선거 상태가 VOTING이 아니면 에러
    if (election.status !== PrismaElectionStatus.VOTING) {
      throw new BusinessException(
        ErrorCode.ELECTION_NOT_IN_VOTING_PERIOD,
        '투표 기간이 아닙니다.',
      );
    }

    // 투표 기간 확인
    const now = new Date();
    if (now < election.votingStartDate || now > election.votingEndDate) {
      throw new BusinessException(
        ErrorCode.ELECTION_NOT_IN_VOTING_PERIOD,
        '투표 기간이 아닙니다.',
      );
    }

    // 2. DTO에서 역할별 후보 ID 추출
    const voteEntries: { role: PrismaElectionRole; candidateId: string }[] = [];

    if (dto.presidentCandidateId) {
      voteEntries.push({
        role: PrismaElectionRole.PRESIDENT,
        candidateId: dto.presidentCandidateId,
      });
    }
    if (dto.vicePresidentCandidateId) {
      voteEntries.push({
        role: PrismaElectionRole.VICE_PRESIDENT,
        candidateId: dto.vicePresidentCandidateId,
      });
    }
    if (dto.secretaryCandidateId) {
      voteEntries.push({
        role: PrismaElectionRole.SECRETARY,
        candidateId: dto.secretaryCandidateId,
      });
    }
    if (dto.treasurerCandidateId) {
      voteEntries.push({
        role: PrismaElectionRole.TREASURER,
        candidateId: dto.treasurerCandidateId,
      });
    }
    if (dto.auditorCandidateId) {
      voteEntries.push({
        role: PrismaElectionRole.AUDITOR,
        candidateId: dto.auditorCandidateId,
      });
    }

    if (voteEntries.length === 0) {
      throw new BusinessException(
        ErrorCode.VOTE_INVALID_CANDIDATE,
        '최소 한 역할에 대해 투표해야 합니다.',
      );
    }

    // 3. 각 역할별로 투표 생성
    const votedRoles: string[] = [];

    for (const entry of voteEntries) {
      // 중복 투표 확인
      const existingVote = await this.prisma.vote.findUnique({
        where: {
          electionId_voterId_forRole: {
            electionId,
            voterId: userId,
            forRole: entry.role,
          },
        },
      });

      if (existingVote) {
        throw new BusinessException(
          ErrorCode.VOTE_DUPLICATE_FOR_ROLE,
          `${entry.role} 역할에 대해 이미 투표했습니다.`,
        );
      }

      // 후보 존재 및 상태 확인
      const candidate = await this.prisma.candidate.findUnique({
        where: { id: entry.candidateId },
      });

      if (!candidate) {
        throw new BusinessException(
          ErrorCode.CANDIDATE_NOT_FOUND,
          '후보를 찾을 수 없습니다.',
        );
      }

      if (candidate.status !== PrismaCandidateStatus.ACCEPTED) {
        throw new BusinessException(
          ErrorCode.CANDIDATE_NOT_APPROVED,
          'ACCEPTED 상태의 후보에만 투표할 수 있습니다.',
        );
      }

      if (candidate.electionId !== electionId) {
        throw new BusinessException(
          ErrorCode.VOTE_INVALID_CANDIDATE,
          '다른 선거의 후보입니다.',
        );
      }

      if (candidate.forRole !== entry.role) {
        throw new BusinessException(
          ErrorCode.VOTE_INVALID_CANDIDATE,
          '해당 역할의 후보가 아닙니다.',
        );
      }

      // ballotHash 생성
      const ballotHash = this.generateBallotHash(electionId, userId, entry.role);

      // Vote 생성
      await this.prisma.vote.create({
        data: {
          electionId,
          voterId: userId,
          candidateId: entry.candidateId,
          forRole: entry.role,
          ballotHash,
        },
      });

      votedRoles.push(entry.role);

      this.logger.log(
        `Vote created: user ${userId} voted for ${entry.role} in election ${electionId}`,
      );
    }

    return {
      message: '투표가 완료되었습니다.',
      votedRoles,
    };
  }

  /**
   * 결과 요약 조회
   *
   * 간단한 결과 요약을 반환합니다.
   * 모든 회원이 볼 수 있습니다.
   *
   * @param electionId - 선거 ID
   * @returns 결과 요약
   */
  async getResultSummary(electionId: string): Promise<ResultSummaryResponseDto> {
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

    // 보안: 선거가 CLOSED 상태일 때만 결과 조회 가능
    if (election.status !== PrismaElectionStatus.CLOSED) {
      throw new BusinessException(
        ErrorCode.ELECTION_NOT_CLOSED,
        '선거가 종료된 후에만 결과를 조회할 수 있습니다.',
      );
    }

    // 전체 유권자 수 (활성 사용자 수)
    const totalEligibleVoters = await this.prisma.user.count({
      where: { isActive: true },
    });

    // 실제 투표자 수 (중복 제거)
    const uniqueVoters = await this.prisma.vote.findMany({
      where: { electionId },
      select: { voterId: true },
      distinct: ['voterId'],
    });
    const totalVoters = uniqueVoters.length;

    // 투표율 계산
    const turnoutRate =
      totalEligibleVoters > 0 ? (totalVoters / totalEligibleVoters) * 100 : 0;

    // 역할별 최다 득표자 (당선자)
    const winners: WinnerInfo[] = [];

    for (const role of Object.values(PrismaElectionRole)) {
      const votes = await this.prisma.vote.findMany({
        where: {
          electionId,
          forRole: role,
        },
        include: {
          candidate: {
            include: {
              user: true,
            },
          },
        },
      });

      if (votes.length === 0) continue;

      // 후보별 득표 수 집계
      const candidateVotes = new Map<string, { count: number; candidate: any }>();

      votes.forEach((vote) => {
        const candidateId = vote.candidateId;
        const existing = candidateVotes.get(candidateId);
        if (existing) {
          existing.count++;
        } else {
          candidateVotes.set(candidateId, {
            count: 1,
            candidate: vote.candidate,
          });
        }
      });

      // 최다 득표자 찾기
      let maxVotes = 0;
      let winner: any = null;

      candidateVotes.forEach((data) => {
        if (data.count > maxVotes) {
          maxVotes = data.count;
          winner = data.candidate;
        }
      });

      if (winner) {
        const votePercentage = votes.length > 0 ? (maxVotes / votes.length) * 100 : 0;

        winners.push({
          role,
          candidateId: winner.id,
          candidateName: winner.user.name,
          employeeNo: winner.user.employeeNo,
          voteCount: maxVotes,
          votePercentage: parseFloat(votePercentage.toFixed(2)),
        });
      }
    }

    return {
      electionId: election.id,
      electionName: election.name,
      electionStatus: election.status,
      totalEligibleVoters,
      totalVoters,
      turnoutRate: parseFloat(turnoutRate.toFixed(2)),
      winners,
    };
  }

  /**
   * 상세 결과 조회
   *
   * 후보별 득표 수 등 상세한 정보를 반환합니다.
   * 관리자와 감사만 볼 수 있습니다.
   *
   * @param electionId - 선거 ID
   * @returns 상세 결과
   */
  async getResultDetail(electionId: string): Promise<ResultDetailResponseDto> {
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

    // 보안: 선거가 CLOSED 상태일 때만 결과 조회 가능 (관리자/감사도 투표 중에는 조회 불가)
    if (election.status !== PrismaElectionStatus.CLOSED) {
      throw new BusinessException(
        ErrorCode.ELECTION_NOT_CLOSED,
        '선거가 종료된 후에만 결과를 조회할 수 있습니다.',
      );
    }

    // 전체 유권자 수
    const totalEligibleVoters = await this.prisma.user.count({
      where: { isActive: true },
    });

    // 실제 투표자 수
    const uniqueVoters = await this.prisma.vote.findMany({
      where: { electionId },
      select: { voterId: true },
      distinct: ['voterId'],
    });
    const totalVoters = uniqueVoters.length;

    // 투표율 계산
    const turnoutRate =
      totalEligibleVoters > 0 ? (totalVoters / totalEligibleVoters) * 100 : 0;

    // 역할별 상세 결과
    const byRole: RoleVoteResult[] = [];

    for (const role of Object.values(PrismaElectionRole)) {
      const votes = await this.prisma.vote.findMany({
        where: {
          electionId,
          forRole: role,
        },
        include: {
          candidate: {
            include: {
              user: true,
            },
          },
        },
      });

      if (votes.length === 0) continue;

      // 후보별 득표 수 집계
      const candidateVotes = new Map<string, { count: number; candidate: any }>();

      votes.forEach((vote) => {
        const candidateId = vote.candidateId;
        const existing = candidateVotes.get(candidateId);
        if (existing) {
          existing.count++;
        } else {
          candidateVotes.set(candidateId, {
            count: 1,
            candidate: vote.candidate,
          });
        }
      });

      // 후보별 정보 생성
      const candidates: CandidateVoteInfo[] = [];

      candidateVotes.forEach((data, candidateId) => {
        const votePercentage =
          votes.length > 0 ? (data.count / votes.length) * 100 : 0;

        candidates.push({
          candidateId,
          candidateName: data.candidate.user.name,
          employeeNo: data.candidate.user.employeeNo,
          department: data.candidate.user.department,
          position: data.candidate.user.position,
          voteCount: data.count,
          votePercentage: parseFloat(votePercentage.toFixed(2)),
        });
      });

      // 득표 수 기준 내림차순 정렬
      candidates.sort((a, b) => b.voteCount - a.voteCount);

      byRole.push({
        role,
        totalVotes: votes.length,
        candidates,
      });
    }

    return {
      electionId: election.id,
      electionName: election.name,
      electionStatus: election.status,
      totalEligibleVoters,
      totalVoters,
      turnoutRate: parseFloat(turnoutRate.toFixed(2)),
      byRole,
    };
  }

  /**
   * [Private] ballotHash 생성
   *
   * hash(electionId + voterId + timestamp + role + secretSalt)
   *
   * @param electionId - 선거 ID
   * @param voterId - 투표자 ID
   * @param role - 역할
   * @returns 해시 문자열
   */
  private generateBallotHash(
    electionId: string,
    voterId: string,
    role: PrismaElectionRole,
  ): string {
    const timestamp = Date.now().toString();
    const data = `${electionId}:${voterId}:${timestamp}:${role}:${this.SECRET_SALT}`;

    return createHash('sha256').update(data).digest('hex');
  }

  /**
   * 서비스 종료 시 Prisma 연결 해제
   */
  async onModuleDestroy() {
    await this.prisma.$disconnect();
  }
}
