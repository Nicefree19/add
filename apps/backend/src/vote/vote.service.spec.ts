/**
 * Vote Service Unit Tests
 *
 * 주요 테스트 항목:
 * - 1인 1표 로직 (중복 투표 방지)
 * - 투표 기간 검증
 * - 후보 상태 검증
 * - ballotHash 생성 확인
 */

import { Test, TestingModule } from '@nestjs/testing';
import { VoteService } from './vote.service';
import { PrismaService } from '../prisma/prisma.service';
import { BusinessException } from '../common/exceptions/business.exception';
import { ErrorCode } from '../common/constants/error-codes';
import { ElectionRole, CandidateStatus, ElectionStatus } from '@prisma/client';
import { TestDatabaseHelper } from '../../test/helpers/test-database.helper';
import { TestDataBuilder } from '../../test/helpers/test-data-builder';

describe('VoteService - One Person One Vote Tests', () => {
  let service: VoteService;
  let prisma: PrismaService;
  let dbHelper: TestDatabaseHelper;
  let dataBuilder: TestDataBuilder;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VoteService,
        {
          provide: PrismaService,
          useValue: new PrismaService(),
        },
      ],
    }).compile();

    service = module.get<VoteService>(VoteService);
    prisma = module.get<PrismaService>(PrismaService);

    dbHelper = new TestDatabaseHelper();
    dataBuilder = new TestDataBuilder(dbHelper.getPrisma());
  });

  beforeEach(async () => {
    await dbHelper.cleanDatabase();
  });

  afterAll(async () => {
    await dbHelper.disconnect();
    await prisma.$disconnect();
  });

  describe('✅ 성공 케이스: 정상적인 투표', () => {
    it('첫 번째 투표 생성 성공', async () => {
      // Given: 투표 기간인 선거, 투표자, ACCEPTED 상태의 후보
      const { election, users, candidates } =
        await dataBuilder.createFullElectionScenario();
      const voter = users[0];
      const candidate = candidates[0]; // PRESIDENT 후보

      // When: 투표 생성
      const result = await service.createVotes(election.id, voter.id, {
        presidentCandidateId: candidate.id,
      });

      // Then: 투표가 성공적으로 생성되어야 함
      expect(result.message).toBe('투표가 완료되었습니다.');
      expect(result.votedRoles).toContain(ElectionRole.PRESIDENT);
      expect(result.votedRoles).toHaveLength(1);

      // Then: DB에 투표 레코드 확인
      const vote = await prisma.vote.findFirst({
        where: {
          electionId: election.id,
          voterId: voter.id,
          forRole: ElectionRole.PRESIDENT,
        },
      });

      expect(vote).toBeDefined();
      expect(vote?.candidateId).toBe(candidate.id);
    });

    it('다른 역할에 대한 투표 생성 성공 (같은 선거, 같은 투표자)', async () => {
      // Given: 투표 기간인 선거, 투표자, 두 개의 다른 역할 후보
      const { election, users, candidates } =
        await dataBuilder.createFullElectionScenario();
      const voter = users[0];
      const presidentCandidate = candidates[0]; // PRESIDENT
      const vpCandidate = candidates[2]; // VICE_PRESIDENT

      // When: 같은 투표자가 다른 역할에 대해 투표
      const result1 = await service.createVotes(election.id, voter.id, {
        presidentCandidateId: presidentCandidate.id,
      });

      const result2 = await service.createVotes(election.id, voter.id, {
        vicePresidentCandidateId: vpCandidate.id,
      });

      // Then: 두 투표 모두 성공해야 함
      expect(result1.votedRoles).toContain(ElectionRole.PRESIDENT);
      expect(result2.votedRoles).toContain(ElectionRole.VICE_PRESIDENT);

      // Then: DB에 2개의 투표 레코드 확인
      const votes = await prisma.vote.findMany({
        where: {
          electionId: election.id,
          voterId: voter.id,
        },
      });

      expect(votes).toHaveLength(2);
    });

    it('여러 역할에 대한 동시 투표 성공', async () => {
      // Given: 투표 기간인 선거, 투표자, 여러 역할 후보
      const { election, users, candidates } =
        await dataBuilder.createFullElectionScenario();
      const voter = users[0];
      const presidentCandidate = candidates[0]; // PRESIDENT
      const vpCandidate = candidates[2]; // VICE_PRESIDENT

      // When: 여러 역할에 대해 한 번에 투표
      const result = await service.createVotes(election.id, voter.id, {
        presidentCandidateId: presidentCandidate.id,
        vicePresidentCandidateId: vpCandidate.id,
      });

      // Then: 모든 투표가 성공해야 함
      expect(result.votedRoles).toContain(ElectionRole.PRESIDENT);
      expect(result.votedRoles).toContain(ElectionRole.VICE_PRESIDENT);
      expect(result.votedRoles).toHaveLength(2);

      // Then: DB에 2개의 투표 레코드 확인
      const votes = await prisma.vote.findMany({
        where: {
          electionId: election.id,
          voterId: voter.id,
        },
      });

      expect(votes).toHaveLength(2);
    });

    it('ballotHash 생성 확인', async () => {
      // Given: 투표 기간인 선거, 투표자, 후보
      const { election, users, candidates } =
        await dataBuilder.createFullElectionScenario();
      const voter = users[0];
      const candidate = candidates[0];

      // When: 투표 생성
      await service.createVotes(election.id, voter.id, {
        presidentCandidateId: candidate.id,
      });

      // Then: ballotHash가 생성되어 있어야 함
      const vote = await prisma.vote.findFirst({
        where: {
          electionId: election.id,
          voterId: voter.id,
          forRole: ElectionRole.PRESIDENT,
        },
      });

      expect(vote?.ballotHash).toBeDefined();
      expect(vote?.ballotHash).not.toBe('');
      expect(vote?.ballotHash.length).toBeGreaterThan(0);
    });

    it('ballotHash가 매번 달라야 함 (다른 투표자, 같은 후보)', async () => {
      // Given: 투표 기간인 선거, 두 명의 투표자, 한 명의 후보
      const { election, users, candidates } =
        await dataBuilder.createFullElectionScenario();
      const voter1 = users[0];
      const voter2 = users[1];
      const candidate = candidates[0];

      // When: 두 투표자가 같은 후보에게 투표
      await service.createVotes(election.id, voter1.id, {
        presidentCandidateId: candidate.id,
      });

      await service.createVotes(election.id, voter2.id, {
        presidentCandidateId: candidate.id,
      });

      // Then: ballotHash가 달라야 함 (익명성 보장)
      const vote1 = await prisma.vote.findFirst({
        where: {
          electionId: election.id,
          voterId: voter1.id,
          forRole: ElectionRole.PRESIDENT,
        },
      });

      const vote2 = await prisma.vote.findFirst({
        where: {
          electionId: election.id,
          voterId: voter2.id,
          forRole: ElectionRole.PRESIDENT,
        },
      });

      expect(vote1?.ballotHash).not.toBe(vote2?.ballotHash);
    });
  });

  describe('❌ 실패 케이스: 중복 투표 (1인 1표 위반)', () => {
    it('같은 선거, 같은 역할에 대한 중복 투표 시도', async () => {
      // Given: 투표 기간인 선거, 투표자, 후보, 이미 존재하는 투표
      const { election, users, candidates } =
        await dataBuilder.createFullElectionScenario();
      const voter = users[0];
      const candidate = candidates[0];

      // 첫 번째 투표 생성
      await service.createVotes(election.id, voter.id, {
        presidentCandidateId: candidate.id,
      });

      // When & Then: 같은 역할에 대한 중복 투표 시도 시 예외 발생
      await expect(
        service.createVotes(election.id, voter.id, {
          presidentCandidateId: candidate.id,
        })
      ).rejects.toThrow(BusinessException);

      await expect(
        service.createVotes(election.id, voter.id, {
          presidentCandidateId: candidate.id,
        })
      ).rejects.toMatchObject({
        code: ErrorCode.VOTE_DUPLICATE_FOR_ROLE,
      });
    });

    it('DB 제약 조건으로 중복 투표 방지 확인 (@@unique 테스트)', async () => {
      // Given: 투표 기간인 선거, 투표자, 후보
      const { election, users, candidates } =
        await dataBuilder.createFullElectionScenario();
      const voter = users[0];
      const candidate = candidates[0];

      // 첫 번째 투표 직접 DB에 생성
      await dataBuilder.createVote(election.id, voter.id, candidate.id, {
        forRole: ElectionRole.PRESIDENT,
      });

      // When & Then: Prisma를 통해 직접 중복 투표 시도
      await expect(
        prisma.vote.create({
          data: {
            electionId: election.id,
            voterId: voter.id,
            candidateId: candidate.id,
            forRole: ElectionRole.PRESIDENT,
            ballotHash: 'test-hash',
          },
        })
      ).rejects.toThrow(); // Prisma Unique Constraint Error
    });
  });

  describe('❌ 실패 케이스: 투표 기간 검증', () => {
    it('투표 기간이 아닐 때 투표 시도 (PLANNING 상태)', async () => {
      // Given: PLANNING 상태의 선거
      const election = await dataBuilder.createElection({
        status: ElectionStatus.PLANNING,
      });
      const voter = await dataBuilder.createUser({ name: '투표자' });
      const candidateUser = await dataBuilder.createUser({ name: '후보' });
      const candidate = await dataBuilder.createCandidate(
        candidateUser.id,
        election.id,
        { forRole: ElectionRole.PRESIDENT }
      );

      // When & Then: 투표 기간이 아닐 때 투표 시도 시 예외 발생
      await expect(
        service.createVotes(election.id, voter.id, {
          presidentCandidateId: candidate.id,
        })
      ).rejects.toThrow(BusinessException);

      await expect(
        service.createVotes(election.id, voter.id, {
          presidentCandidateId: candidate.id,
        })
      ).rejects.toMatchObject({
        code: ErrorCode.ELECTION_NOT_IN_VOTING_PERIOD,
      });
    });

    it('투표 기간 전에 투표 시도', async () => {
      // Given: 투표 시작 전인 선거
      const now = new Date();
      const election = await dataBuilder.createElection({
        status: ElectionStatus.VOTING,
        recommendationStartDate: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
        recommendationEndDate: new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000),
        votingStartDate: new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000), // 미래
        votingEndDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
      });
      const voter = await dataBuilder.createUser({ name: '투표자' });
      const candidateUser = await dataBuilder.createUser({ name: '후보' });
      const candidate = await dataBuilder.createCandidate(
        candidateUser.id,
        election.id,
        { forRole: ElectionRole.PRESIDENT }
      );

      // When & Then: 투표 기간 전 투표 시도 시 예외 발생
      await expect(
        service.createVotes(election.id, voter.id, {
          presidentCandidateId: candidate.id,
        })
      ).rejects.toThrow(BusinessException);

      await expect(
        service.createVotes(election.id, voter.id, {
          presidentCandidateId: candidate.id,
        })
      ).rejects.toMatchObject({
        code: ErrorCode.ELECTION_NOT_IN_VOTING_PERIOD,
      });
    });

    it('투표 기간 종료 후 투표 시도', async () => {
      // Given: 투표가 종료된 선거
      const now = new Date();
      const election = await dataBuilder.createElection({
        status: ElectionStatus.VOTING,
        recommendationStartDate: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
        recommendationEndDate: new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000),
        votingStartDate: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
        votingEndDate: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000), // 과거
      });
      const voter = await dataBuilder.createUser({ name: '투표자' });
      const candidateUser = await dataBuilder.createUser({ name: '후보' });
      const candidate = await dataBuilder.createCandidate(
        candidateUser.id,
        election.id,
        { forRole: ElectionRole.PRESIDENT }
      );

      // When & Then: 투표 기간 종료 후 투표 시도 시 예외 발생
      await expect(
        service.createVotes(election.id, voter.id, {
          presidentCandidateId: candidate.id,
        })
      ).rejects.toThrow(BusinessException);

      await expect(
        service.createVotes(election.id, voter.id, {
          presidentCandidateId: candidate.id,
        })
      ).rejects.toMatchObject({
        code: ErrorCode.ELECTION_NOT_IN_VOTING_PERIOD,
      });
    });
  });

  describe('❌ 실패 케이스: 후보 상태 검증', () => {
    it('ACCEPTED 상태가 아닌 후보에 대한 투표 시도 (PENDING)', async () => {
      // Given: 투표 기간인 선거, 투표자, PENDING 상태의 후보
      const { election, users } = await dataBuilder.createFullElectionScenario();
      const voter = users[0];

      const pendingCandidateUser = await dataBuilder.createUser({
        name: 'PENDING 후보',
      });
      const pendingCandidate = await dataBuilder.createCandidate(
        pendingCandidateUser.id,
        election.id,
        {
          forRole: ElectionRole.PRESIDENT,
          status: CandidateStatus.PENDING, // ACCEPTED가 아님
        }
      );

      // When & Then: PENDING 상태 후보에 투표 시 예외 발생
      await expect(
        service.createVotes(election.id, voter.id, {
          presidentCandidateId: pendingCandidate.id,
        })
      ).rejects.toThrow(BusinessException);

      await expect(
        service.createVotes(election.id, voter.id, {
          presidentCandidateId: pendingCandidate.id,
        })
      ).rejects.toMatchObject({
        code: ErrorCode.CANDIDATE_NOT_APPROVED,
      });
    });

    it('WITHDRAWN 상태 후보에 대한 투표 시도', async () => {
      // Given: 투표 기간인 선거, 투표자, WITHDRAWN 상태의 후보
      const { election, users } = await dataBuilder.createFullElectionScenario();
      const voter = users[0];

      const withdrawnCandidateUser = await dataBuilder.createUser({
        name: '사퇴한 후보',
      });
      const withdrawnCandidate = await dataBuilder.createCandidate(
        withdrawnCandidateUser.id,
        election.id,
        {
          forRole: ElectionRole.PRESIDENT,
          status: CandidateStatus.WITHDRAWN,
        }
      );

      // When & Then: 사퇴한 후보에 투표 시 예외 발생
      await expect(
        service.createVotes(election.id, voter.id, {
          presidentCandidateId: withdrawnCandidate.id,
        })
      ).rejects.toThrow(BusinessException);
    });

    it('존재하지 않는 후보에 대한 투표 시도', async () => {
      // Given: 투표 기간인 선거, 투표자
      const { election, users } = await dataBuilder.createFullElectionScenario();
      const voter = users[0];
      const fakeCandidateId = '00000000-0000-0000-0000-000000000000';

      // When & Then: 존재하지 않는 후보에 투표 시 예외 발생
      await expect(
        service.createVotes(election.id, voter.id, {
          presidentCandidateId: fakeCandidateId,
        })
      ).rejects.toThrow(BusinessException);

      await expect(
        service.createVotes(election.id, voter.id, {
          presidentCandidateId: fakeCandidateId,
        })
      ).rejects.toMatchObject({
        code: ErrorCode.CANDIDATE_NOT_FOUND,
      });
    });

    it('다른 선거의 후보에 대한 투표 시도', async () => {
      // Given: 두 개의 선거, 투표자, 다른 선거의 후보
      const { election: election1, users } =
        await dataBuilder.createFullElectionScenario();
      const voter = users[0];

      const election2 = await dataBuilder.createElectionInVotingPeriod();
      const otherElectionCandidateUser = await dataBuilder.createUser({
        name: '다른 선거 후보',
      });
      const otherElectionCandidate = await dataBuilder.createCandidate(
        otherElectionCandidateUser.id,
        election2.id, // 다른 선거의 후보
        { forRole: ElectionRole.PRESIDENT }
      );

      // When & Then: 다른 선거의 후보에 투표 시 예외 발생
      await expect(
        service.createVotes(election1.id, voter.id, {
          presidentCandidateId: otherElectionCandidate.id,
        })
      ).rejects.toThrow(BusinessException);

      await expect(
        service.createVotes(election1.id, voter.id, {
          presidentCandidateId: otherElectionCandidate.id,
        })
      ).rejects.toMatchObject({
        code: ErrorCode.VOTE_INVALID_CANDIDATE,
      });
    });

    it('잘못된 역할의 후보에 대한 투표 시도', async () => {
      // Given: 투표 기간인 선거, 투표자, VICE_PRESIDENT 후보
      const { election, users, candidates } =
        await dataBuilder.createFullElectionScenario();
      const voter = users[0];
      const vpCandidate = candidates[2]; // VICE_PRESIDENT 후보

      // When & Then: PRESIDENT 투표에 VICE_PRESIDENT 후보를 투표 시도
      await expect(
        service.createVotes(election.id, voter.id, {
          presidentCandidateId: vpCandidate.id, // 역할 불일치
        })
      ).rejects.toThrow(BusinessException);

      await expect(
        service.createVotes(election.id, voter.id, {
          presidentCandidateId: vpCandidate.id,
        })
      ).rejects.toMatchObject({
        code: ErrorCode.VOTE_INVALID_CANDIDATE,
      });
    });
  });

  describe('❌ 실패 케이스: 빈 투표', () => {
    it('최소 한 역할에 대해 투표해야 함', async () => {
      // Given: 투표 기간인 선거, 투표자
      const { election, users } = await dataBuilder.createFullElectionScenario();
      const voter = users[0];

      // When & Then: 빈 투표 시도 시 예외 발생
      await expect(
        service.createVotes(election.id, voter.id, {})
      ).rejects.toThrow(BusinessException);

      await expect(
        service.createVotes(election.id, voter.id, {})
      ).rejects.toMatchObject({
        code: ErrorCode.VOTE_INVALID_CANDIDATE,
      });
    });
  });

  describe('📊 통합 시나리오: 복잡한 투표 시나리오', () => {
    it('여러 사용자가 여러 역할에 대해 투표하는 시나리오', async () => {
      // Given: 투표 기간인 선거, 여러 투표자, 여러 후보
      const { election, users, candidates } =
        await dataBuilder.createFullElectionScenario();
      const voter1 = users[0];
      const voter2 = users[1];
      const voter3 = users[2];

      const presidentCandidate1 = candidates[0];
      const presidentCandidate2 = candidates[1];
      const vpCandidate = candidates[2];

      // When: 여러 투표자가 다양한 후보에게 투표
      await service.createVotes(election.id, voter1.id, {
        presidentCandidateId: presidentCandidate1.id,
        vicePresidentCandidateId: vpCandidate.id,
      });

      await service.createVotes(election.id, voter2.id, {
        presidentCandidateId: presidentCandidate2.id,
        vicePresidentCandidateId: vpCandidate.id,
      });

      await service.createVotes(election.id, voter3.id, {
        presidentCandidateId: presidentCandidate1.id,
      });

      // Then: 모든 투표가 성공해야 함
      const allVotes = await prisma.vote.findMany({
        where: { electionId: election.id },
      });

      expect(allVotes).toHaveLength(5); // 3명이 총 5번 투표

      // Then: 회장 후보1은 2표 받음
      const presidentCandidate1Votes = allVotes.filter(
        (v) => v.candidateId === presidentCandidate1.id
      );
      expect(presidentCandidate1Votes).toHaveLength(2);

      // Then: 부회장 후보는 2표 받음
      const vpCandidateVotes = allVotes.filter(
        (v) => v.candidateId === vpCandidate.id
      );
      expect(vpCandidateVotes).toHaveLength(2);

      // Then: 각 투표는 고유한 ballotHash를 가져야 함
      const ballotHashes = allVotes.map((v) => v.ballotHash);
      const uniqueHashes = new Set(ballotHashes);
      expect(uniqueHashes.size).toBe(allVotes.length);
    });

    it('투표 상태 조회 시나리오', async () => {
      // Given: 투표 기간인 선거, 투표자, 후보
      const { election, users, candidates } =
        await dataBuilder.createFullElectionScenario();
      const voter = users[0];
      const presidentCandidate = candidates[0];
      const vpCandidate = candidates[2];

      // When: 일부 역할에 대해서만 투표
      await service.createVotes(election.id, voter.id, {
        presidentCandidateId: presidentCandidate.id,
      });

      // Then: 투표 상태 조회 시 PRESIDENT만 투표한 것으로 표시
      const voteStatus = await service.getVoteStatus(election.id, voter.id);

      expect(voteStatus.hasVotedAny).toBe(true);
      expect(voteStatus.byRole).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            role: ElectionRole.PRESIDENT,
            hasVoted: true,
          }),
          expect.objectContaining({
            role: ElectionRole.VICE_PRESIDENT,
            hasVoted: false,
          }),
        ])
      );

      // When: 추가로 VICE_PRESIDENT에 투표
      await service.createVotes(election.id, voter.id, {
        vicePresidentCandidateId: vpCandidate.id,
      });

      // Then: 두 역할 모두 투표한 것으로 표시
      const voteStatus2 = await service.getVoteStatus(election.id, voter.id);

      expect(voteStatus2.byRole).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            role: ElectionRole.PRESIDENT,
            hasVoted: true,
          }),
          expect.objectContaining({
            role: ElectionRole.VICE_PRESIDENT,
            hasVoted: true,
          }),
        ])
      );
    });
  });
});
