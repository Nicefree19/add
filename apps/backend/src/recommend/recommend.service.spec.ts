/**
 * Recommendation Service Unit Tests
 *
 * 주요 테스트 항목:
 * - 추천 중복 방지 로직
 * - 최대 추천 수 제한
 * - 자기 자신 추천 방지
 * - 추천 기간 검증
 */

import { Test, TestingModule } from '@nestjs/testing';
import { RecommendService } from './recommend.service';
import { PrismaService } from '../prisma/prisma.service';
import { BusinessException } from '../common/exceptions/business.exception';
import { ErrorCode } from '../common/constants/error-codes';
import { ElectionRole } from '@prisma/client';
import { TestDatabaseHelper } from '../../test/helpers/test-database.helper';
import { TestDataBuilder } from '../../test/helpers/test-data-builder';

describe('RecommendService - Duplicate Prevention Tests', () => {
  let service: RecommendService;
  let prisma: PrismaService;
  let dbHelper: TestDatabaseHelper;
  let dataBuilder: TestDataBuilder;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RecommendService,
        {
          provide: PrismaService,
          useValue: new PrismaService(),
        },
      ],
    }).compile();

    service = module.get<RecommendService>(RecommendService);
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

  describe('✅ 성공 케이스: 정상적인 추천', () => {
    it('첫 번째 추천 생성 성공', async () => {
      // Given: 추천 기간인 선거, 추천자, 후보
      const election = await dataBuilder.createElectionInRecommendPeriod();
      const recommender = await dataBuilder.createUser({ name: '추천자' });
      const candidateUser = await dataBuilder.createUser({ name: '후보자' });
      const candidate = await dataBuilder.createCandidate(
        candidateUser.id,
        election.id,
        { forRole: ElectionRole.PRESIDENT }
      );

      // When: 추천 생성
      const recommendation = await service.create(election.id, recommender.id, {
        candidateId: candidate.id,
        forRole: ElectionRole.PRESIDENT,
        comment: '훌륭한 후보입니다',
      });

      // Then: 추천이 성공적으로 생성되어야 함
      expect(recommendation).toBeDefined();
      expect(recommendation.electionId).toBe(election.id);
      expect(recommendation.recommenderId).toBe(recommender.id);
      expect(recommendation.candidateId).toBe(candidate.id);
      expect(recommendation.forRole).toBe(ElectionRole.PRESIDENT);
    });

    it('다른 역할에 대한 추천 생성 성공 (같은 선거, 같은 추천자)', async () => {
      // Given: 추천 기간인 선거, 추천자, 두 개의 다른 역할 후보
      const election = await dataBuilder.createElectionInRecommendPeriod();
      const recommender = await dataBuilder.createUser({ name: '추천자' });

      const presidentCandidateUser = await dataBuilder.createUser({ name: '회장 후보' });
      const presidentCandidate = await dataBuilder.createCandidate(
        presidentCandidateUser.id,
        election.id,
        { forRole: ElectionRole.PRESIDENT }
      );

      const vpCandidateUser = await dataBuilder.createUser({ name: '부회장 후보' });
      const vpCandidate = await dataBuilder.createCandidate(
        vpCandidateUser.id,
        election.id,
        { forRole: ElectionRole.VICE_PRESIDENT }
      );

      // When: 같은 추천자가 다른 역할에 대해 추천
      const recommendation1 = await service.create(election.id, recommender.id, {
        candidateId: presidentCandidate.id,
        forRole: ElectionRole.PRESIDENT,
        comment: '회장 추천',
      });

      const recommendation2 = await service.create(election.id, recommender.id, {
        candidateId: vpCandidate.id,
        forRole: ElectionRole.VICE_PRESIDENT,
        comment: '부회장 추천',
      });

      // Then: 두 추천 모두 성공해야 함
      expect(recommendation1.forRole).toBe(ElectionRole.PRESIDENT);
      expect(recommendation2.forRole).toBe(ElectionRole.VICE_PRESIDENT);
      expect(recommendation1.recommenderId).toBe(recommender.id);
      expect(recommendation2.recommenderId).toBe(recommender.id);
    });

    it('다른 사람에 대한 추천 생성 성공 (같은 선거, 같은 역할)', async () => {
      // Given: 추천 기간인 선거, 두 명의 추천자, 한 명의 후보
      const election = await dataBuilder.createElectionInRecommendPeriod();
      const recommender1 = await dataBuilder.createUser({ name: '추천자1' });
      const recommender2 = await dataBuilder.createUser({ name: '추천자2' });

      const candidateUser = await dataBuilder.createUser({ name: '후보자' });
      const candidate = await dataBuilder.createCandidate(
        candidateUser.id,
        election.id,
        { forRole: ElectionRole.PRESIDENT }
      );

      // When: 다른 추천자들이 같은 후보를 추천
      const recommendation1 = await service.create(election.id, recommender1.id, {
        candidateId: candidate.id,
        forRole: ElectionRole.PRESIDENT,
        comment: '추천자1의 추천',
      });

      const recommendation2 = await service.create(election.id, recommender2.id, {
        candidateId: candidate.id,
        forRole: ElectionRole.PRESIDENT,
        comment: '추천자2의 추천',
      });

      // Then: 두 추천 모두 성공해야 함
      expect(recommendation1.recommenderId).toBe(recommender1.id);
      expect(recommendation2.recommenderId).toBe(recommender2.id);
      expect(recommendation1.candidateId).toBe(candidate.id);
      expect(recommendation2.candidateId).toBe(candidate.id);
    });

    it('최대 추천 수 이내 추천 성공', async () => {
      // Given: maxRecommendations=3인 선거, 추천자, 3명의 후보
      const election = await dataBuilder.createElectionInRecommendPeriod({
        maxRecommendations: 3,
      });
      const recommender = await dataBuilder.createUser({ name: '추천자' });

      const candidate1User = await dataBuilder.createUser({ name: '후보1' });
      const candidate1 = await dataBuilder.createCandidate(
        candidate1User.id,
        election.id,
        { forRole: ElectionRole.PRESIDENT }
      );

      const candidate2User = await dataBuilder.createUser({ name: '후보2' });
      const candidate2 = await dataBuilder.createCandidate(
        candidate2User.id,
        election.id,
        { forRole: ElectionRole.VICE_PRESIDENT }
      );

      const candidate3User = await dataBuilder.createUser({ name: '후보3' });
      const candidate3 = await dataBuilder.createCandidate(
        candidate3User.id,
        election.id,
        { forRole: ElectionRole.SECRETARY }
      );

      // When: 3번 추천 (최대 허용)
      const rec1 = await service.create(election.id, recommender.id, {
        candidateId: candidate1.id,
        forRole: ElectionRole.PRESIDENT,
      });

      const rec2 = await service.create(election.id, recommender.id, {
        candidateId: candidate2.id,
        forRole: ElectionRole.VICE_PRESIDENT,
      });

      const rec3 = await service.create(election.id, recommender.id, {
        candidateId: candidate3.id,
        forRole: ElectionRole.SECRETARY,
      });

      // Then: 3번 모두 성공해야 함
      expect(rec1).toBeDefined();
      expect(rec2).toBeDefined();
      expect(rec3).toBeDefined();
    });
  });

  describe('❌ 실패 케이스: 중복 추천', () => {
    it('같은 선거, 같은 역할에 대한 중복 추천 시도', async () => {
      // Given: 추천 기간인 선거, 추천자, 후보, 이미 존재하는 추천
      const election = await dataBuilder.createElectionInRecommendPeriod();
      const recommender = await dataBuilder.createUser({ name: '추천자' });

      const candidateUser = await dataBuilder.createUser({ name: '후보자' });
      const candidate = await dataBuilder.createCandidate(
        candidateUser.id,
        election.id,
        { forRole: ElectionRole.PRESIDENT }
      );

      // 첫 번째 추천 생성
      await service.create(election.id, recommender.id, {
        candidateId: candidate.id,
        forRole: ElectionRole.PRESIDENT,
        comment: '첫 번째 추천',
      });

      // When & Then: 같은 역할에 대한 중복 추천 시도 시 예외 발생
      await expect(
        service.create(election.id, recommender.id, {
          candidateId: candidate.id,
          forRole: ElectionRole.PRESIDENT,
          comment: '두 번째 추천 시도',
        })
      ).rejects.toThrow(BusinessException);

      await expect(
        service.create(election.id, recommender.id, {
          candidateId: candidate.id,
          forRole: ElectionRole.PRESIDENT,
          comment: '두 번째 추천 시도',
        })
      ).rejects.toMatchObject({
        code: ErrorCode.RECOMMEND_DUPLICATE_FOR_ROLE,
      });
    });

    it('DB 제약 조건으로 중복 추천 방지 확인 (@@unique 테스트)', async () => {
      // Given: 추천 기간인 선거, 추천자, 후보
      const election = await dataBuilder.createElectionInRecommendPeriod();
      const recommender = await dataBuilder.createUser({ name: '추천자' });

      const candidateUser = await dataBuilder.createUser({ name: '후보자' });
      const candidate = await dataBuilder.createCandidate(
        candidateUser.id,
        election.id,
        { forRole: ElectionRole.PRESIDENT }
      );

      // 첫 번째 추천 직접 DB에 생성
      await dataBuilder.createRecommendation(
        election.id,
        recommender.id,
        candidate.id,
        { forRole: ElectionRole.PRESIDENT }
      );

      // When & Then: Prisma를 통해 직접 중복 추천 시도
      await expect(
        prisma.recommendation.create({
          data: {
            electionId: election.id,
            recommenderId: recommender.id,
            candidateId: candidate.id,
            forRole: ElectionRole.PRESIDENT,
            comment: '중복 추천',
          },
        })
      ).rejects.toThrow(); // Prisma Unique Constraint Error
    });
  });

  describe('❌ 실패 케이스: 비즈니스 규칙 위반', () => {
    it('자기 자신을 추천 시도', async () => {
      // Given: 추천 기간인 선거, 사용자 (추천자이자 후보)
      const election = await dataBuilder.createElectionInRecommendPeriod();
      const user = await dataBuilder.createUser({ name: '사용자' });

      const candidate = await dataBuilder.createCandidate(
        user.id,
        election.id,
        { forRole: ElectionRole.PRESIDENT }
      );

      // When & Then: 자기 자신을 추천 시도 시 예외 발생
      await expect(
        service.create(election.id, user.id, {
          candidateId: candidate.id,
          forRole: ElectionRole.PRESIDENT,
          comment: '자기 자신 추천',
        })
      ).rejects.toThrow(BusinessException);

      await expect(
        service.create(election.id, user.id, {
          candidateId: candidate.id,
          forRole: ElectionRole.PRESIDENT,
          comment: '자기 자신 추천',
        })
      ).rejects.toMatchObject({
        code: ErrorCode.RECOMMEND_SELF_NOT_ALLOWED,
      });
    });

    it('최대 추천 수 초과 시도', async () => {
      // Given: maxRecommendations=2인 선거, 추천자, 3명의 후보
      const election = await dataBuilder.createElectionInRecommendPeriod({
        maxRecommendations: 2,
      });
      const recommender = await dataBuilder.createUser({ name: '추천자' });

      const candidate1User = await dataBuilder.createUser({ name: '후보1' });
      const candidate1 = await dataBuilder.createCandidate(
        candidate1User.id,
        election.id,
        { forRole: ElectionRole.PRESIDENT }
      );

      const candidate2User = await dataBuilder.createUser({ name: '후보2' });
      const candidate2 = await dataBuilder.createCandidate(
        candidate2User.id,
        election.id,
        { forRole: ElectionRole.VICE_PRESIDENT }
      );

      const candidate3User = await dataBuilder.createUser({ name: '후보3' });
      const candidate3 = await dataBuilder.createCandidate(
        candidate3User.id,
        election.id,
        { forRole: ElectionRole.SECRETARY }
      );

      // 2번 추천 성공
      await service.create(election.id, recommender.id, {
        candidateId: candidate1.id,
        forRole: ElectionRole.PRESIDENT,
      });

      await service.create(election.id, recommender.id, {
        candidateId: candidate2.id,
        forRole: ElectionRole.VICE_PRESIDENT,
      });

      // When & Then: 3번째 추천 시도 시 예외 발생 (최대 2개)
      await expect(
        service.create(election.id, recommender.id, {
          candidateId: candidate3.id,
          forRole: ElectionRole.SECRETARY,
        })
      ).rejects.toThrow(BusinessException);

      await expect(
        service.create(election.id, recommender.id, {
          candidateId: candidate3.id,
          forRole: ElectionRole.SECRETARY,
        })
      ).rejects.toMatchObject({
        code: ErrorCode.RECOMMEND_LIMIT_EXCEEDED,
      });
    });

    it('추천 기간이 아닐 때 추천 시도', async () => {
      // Given: PLANNING 상태의 선거 (추천 기간 아님)
      const election = await dataBuilder.createElection({
        status: 'PLANNING' as any,
      });
      const recommender = await dataBuilder.createUser({ name: '추천자' });

      const candidateUser = await dataBuilder.createUser({ name: '후보자' });
      const candidate = await dataBuilder.createCandidate(
        candidateUser.id,
        election.id,
        { forRole: ElectionRole.PRESIDENT }
      );

      // When & Then: 추천 기간이 아닐 때 추천 시도 시 예외 발생
      await expect(
        service.create(election.id, recommender.id, {
          candidateId: candidate.id,
          forRole: ElectionRole.PRESIDENT,
        })
      ).rejects.toThrow(BusinessException);

      await expect(
        service.create(election.id, recommender.id, {
          candidateId: candidate.id,
          forRole: ElectionRole.PRESIDENT,
        })
      ).rejects.toMatchObject({
        code: ErrorCode.ELECTION_NOT_IN_RECOMMENDATION_PERIOD,
      });
    });

    it('존재하지 않는 후보에 대한 추천 시도', async () => {
      // Given: 추천 기간인 선거, 추천자
      const election = await dataBuilder.createElectionInRecommendPeriod();
      const recommender = await dataBuilder.createUser({ name: '추천자' });
      const fakeCandidateId = '00000000-0000-0000-0000-000000000000';

      // When & Then: 존재하지 않는 후보 추천 시 예외 발생
      await expect(
        service.create(election.id, recommender.id, {
          candidateId: fakeCandidateId,
          forRole: ElectionRole.PRESIDENT,
        })
      ).rejects.toThrow(BusinessException);

      await expect(
        service.create(election.id, recommender.id, {
          candidateId: fakeCandidateId,
          forRole: ElectionRole.PRESIDENT,
        })
      ).rejects.toMatchObject({
        code: ErrorCode.CANDIDATE_NOT_FOUND,
      });
    });

    it('비활성화된 사용자 추천 시도', async () => {
      // Given: 추천 기간인 선거, 추천자, 비활성화된 후보
      const election = await dataBuilder.createElectionInRecommendPeriod();
      const recommender = await dataBuilder.createUser({ name: '추천자' });

      const inactiveCandidateUser = await dataBuilder.createUser({
        name: '비활성 후보',
        isActive: false,
      });
      const inactiveCandidate = await dataBuilder.createCandidate(
        inactiveCandidateUser.id,
        election.id,
        { forRole: ElectionRole.PRESIDENT }
      );

      // When & Then: 비활성화된 사용자 추천 시 예외 발생
      await expect(
        service.create(election.id, recommender.id, {
          candidateId: inactiveCandidate.id,
          forRole: ElectionRole.PRESIDENT,
        })
      ).rejects.toThrow(BusinessException);

      await expect(
        service.create(election.id, recommender.id, {
          candidateId: inactiveCandidate.id,
          forRole: ElectionRole.PRESIDENT,
        })
      ).rejects.toMatchObject({
        code: ErrorCode.USER_INACTIVE,
      });
    });
  });

  describe('📊 통합 시나리오: 복잡한 추천 시나리오', () => {
    it('여러 사용자가 여러 역할에 대해 추천하는 시나리오', async () => {
      // Given: 추천 기간인 선거, 3명의 추천자, 5명의 후보 (여러 역할)
      const election = await dataBuilder.createElectionInRecommendPeriod();

      const recommender1 = await dataBuilder.createUser({ name: '추천자1' });
      const recommender2 = await dataBuilder.createUser({ name: '추천자2' });
      const recommender3 = await dataBuilder.createUser({ name: '추천자3' });

      const presidentCandidate1 = await dataBuilder.createCandidate(
        (await dataBuilder.createUser({ name: '회장후보1' })).id,
        election.id,
        { forRole: ElectionRole.PRESIDENT }
      );

      const presidentCandidate2 = await dataBuilder.createCandidate(
        (await dataBuilder.createUser({ name: '회장후보2' })).id,
        election.id,
        { forRole: ElectionRole.PRESIDENT }
      );

      const vpCandidate = await dataBuilder.createCandidate(
        (await dataBuilder.createUser({ name: '부회장후보' })).id,
        election.id,
        { forRole: ElectionRole.VICE_PRESIDENT }
      );

      // When: 여러 추천자가 다양한 후보를 추천
      await service.create(election.id, recommender1.id, {
        candidateId: presidentCandidate1.id,
        forRole: ElectionRole.PRESIDENT,
      });

      await service.create(election.id, recommender1.id, {
        candidateId: vpCandidate.id,
        forRole: ElectionRole.VICE_PRESIDENT,
      });

      await service.create(election.id, recommender2.id, {
        candidateId: presidentCandidate2.id,
        forRole: ElectionRole.PRESIDENT,
      });

      await service.create(election.id, recommender3.id, {
        candidateId: presidentCandidate1.id,
        forRole: ElectionRole.PRESIDENT,
      });

      // Then: 모든 추천이 성공해야 함
      const allRecommendations = await prisma.recommendation.findMany({
        where: { electionId: election.id },
      });

      expect(allRecommendations).toHaveLength(4);

      // Then: 추천자1은 회장과 부회장에 각각 1번씩 추천
      const recommender1Recs = allRecommendations.filter(
        (r) => r.recommenderId === recommender1.id
      );
      expect(recommender1Recs).toHaveLength(2);

      // Then: 회장 후보1은 2번 추천받음
      const presidentCandidate1Recs = allRecommendations.filter(
        (r) => r.candidateId === presidentCandidate1.id
      );
      expect(presidentCandidate1Recs).toHaveLength(2);
    });
  });
});
