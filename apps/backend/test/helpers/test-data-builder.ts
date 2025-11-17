/**
 * Test Data Builder
 *
 * 테스트용 데이터 생성 헬퍼 (Builder Pattern)
 */

import { PrismaClient, UserRole, ElectionStatus, CandidateStatus, ElectionRole } from '@prisma/client';

export class TestDataBuilder {
  constructor(private prisma: PrismaClient) {}

  /**
   * 테스트용 사용자 생성
   */
  async createUser(overrides: {
    employeeNo?: string;
    email?: string;
    name?: string;
    role?: UserRole;
    isActive?: boolean;
  } = {}) {
    const defaults = {
      employeeNo: `EMP${Date.now()}`,
      email: `user${Date.now()}@test.com`,
      name: '테스트 사용자',
      department: '개발팀',
      position: '사원',
      role: UserRole.MEMBER,
      isActive: true,
    };

    return this.prisma.user.create({
      data: { ...defaults, ...overrides },
    });
  }

  /**
   * 테스트용 관리자 생성
   */
  async createAdmin(overrides = {}) {
    return this.createUser({
      role: UserRole.ADMIN,
      name: '관리자',
      ...overrides,
    });
  }

  /**
   * 테스트용 선거 생성
   */
  async createElection(overrides: {
    name?: string;
    status?: ElectionStatus;
    recommendationStartDate?: Date;
    recommendationEndDate?: Date;
    votingStartDate?: Date;
    votingEndDate?: Date;
    maxRecommendations?: number;
  } = {}) {
    const now = new Date();
    const defaults = {
      name: `테스트 선거 ${Date.now()}`,
      description: '테스트용 선거입니다',
      status: ElectionStatus.PLANNING,
      recommendationStartDate: new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000), // +1일
      recommendationEndDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000), // +7일
      votingStartDate: new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000), // +10일
      votingEndDate: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000), // +14일
      maxRecommendations: 3,
      isActive: true,
    };

    return this.prisma.electionRound.create({
      data: { ...defaults, ...overrides },
    });
  }

  /**
   * 추천 기간인 선거 생성
   */
  async createElectionInRecommendPeriod(overrides = {}) {
    const now = new Date();
    return this.createElection({
      status: ElectionStatus.RECOMMEND,
      recommendationStartDate: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000), // -1일
      recommendationEndDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000), // +7일
      ...overrides,
    });
  }

  /**
   * 투표 기간인 선거 생성
   */
  async createElectionInVotingPeriod(overrides = {}) {
    const now = new Date();
    return this.createElection({
      status: ElectionStatus.VOTING,
      recommendationStartDate: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000), // -14일
      recommendationEndDate: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000), // -7일
      votingStartDate: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000), // -1일
      votingEndDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000), // +7일
      ...overrides,
    });
  }

  /**
   * 테스트용 후보 생성
   */
  async createCandidate(
    userId: string,
    electionId: string,
    overrides: {
      forRole?: ElectionRole;
      status?: CandidateStatus;
      statement?: string;
    } = {}
  ) {
    const defaults = {
      forRole: ElectionRole.PRESIDENT,
      status: CandidateStatus.ACCEPTED,
      statement: '테스트 후보 공약입니다',
    };

    return this.prisma.candidate.create({
      data: {
        userId,
        electionId,
        ...defaults,
        ...overrides,
      },
    });
  }

  /**
   * 테스트용 추천 생성
   */
  async createRecommendation(
    electionId: string,
    recommenderId: string,
    candidateId: string,
    overrides: {
      forRole?: ElectionRole;
      comment?: string;
    } = {}
  ) {
    const defaults = {
      forRole: ElectionRole.PRESIDENT,
      comment: '테스트 추천 코멘트',
    };

    return this.prisma.recommendation.create({
      data: {
        electionId,
        recommenderId,
        candidateId,
        ...defaults,
        ...overrides,
      },
    });
  }

  /**
   * 테스트용 투표 생성
   */
  async createVote(
    electionId: string,
    voterId: string,
    candidateId: string,
    overrides: {
      forRole?: ElectionRole;
      ballotHash?: string;
    } = {}
  ) {
    const defaults = {
      forRole: ElectionRole.PRESIDENT,
      ballotHash: `hash-${Date.now()}`,
    };

    return this.prisma.vote.create({
      data: {
        electionId,
        voterId,
        candidateId,
        ...defaults,
        ...overrides,
      },
    });
  }

  /**
   * 완전한 선거 시나리오 생성 (사용자, 선거, 후보)
   */
  async createFullElectionScenario() {
    // 사용자 생성
    const admin = await this.createAdmin();
    const user1 = await this.createUser({ name: '사용자1' });
    const user2 = await this.createUser({ name: '사용자2' });
    const user3 = await this.createUser({ name: '사용자3' });

    // 선거 생성
    const election = await this.createElectionInVotingPeriod();

    // 후보 생성
    const candidate1 = await this.createCandidate(user1.id, election.id, {
      forRole: ElectionRole.PRESIDENT,
    });
    const candidate2 = await this.createCandidate(user2.id, election.id, {
      forRole: ElectionRole.PRESIDENT,
    });
    const candidate3 = await this.createCandidate(user3.id, election.id, {
      forRole: ElectionRole.VICE_PRESIDENT,
    });

    return {
      admin,
      users: [user1, user2, user3],
      election,
      candidates: [candidate1, candidate2, candidate3],
    };
  }
}
