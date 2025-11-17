/**
 * Election Service Unit Tests
 *
 * 주요 테스트 항목:
 * - 선거 상태 전이 로직 (PLANNING → RECOMMEND → CANDIDATE_CONFIRM → VOTING → CLOSED)
 * - 상태 전이 유효성 검증
 * - 날짜 검증
 */

import { Test, TestingModule } from '@nestjs/testing';
import { ElectionService } from './election.service';
import { PrismaService } from '../prisma/prisma.service';
import { BusinessException } from '../common/exceptions/business.exception';
import { ErrorCode } from '../common/constants/error-codes';
import { ElectionStatus } from './dto';
import { ElectionStatus as PrismaElectionStatus } from '@prisma/client';
import { TestDatabaseHelper } from '../../test/helpers/test-database.helper';
import { TestDataBuilder } from '../../test/helpers/test-data-builder';

describe('ElectionService - State Transition Tests', () => {
  let service: ElectionService;
  let prisma: PrismaService;
  let dbHelper: TestDatabaseHelper;
  let dataBuilder: TestDataBuilder;

  beforeAll(async () => {
    // 테스트 모듈 생성
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ElectionService,
        {
          provide: PrismaService,
          useValue: new PrismaService(),
        },
      ],
    }).compile();

    service = module.get<ElectionService>(ElectionService);
    prisma = module.get<PrismaService>(PrismaService);

    // 테스트 헬퍼 초기화
    dbHelper = new TestDatabaseHelper();
    dataBuilder = new TestDataBuilder(dbHelper.getPrisma());
  });

  beforeEach(async () => {
    // 각 테스트 전에 DB 클린업
    await dbHelper.cleanDatabase();
  });

  afterAll(async () => {
    // 모든 테스트 후 연결 종료
    await dbHelper.disconnect();
    await prisma.$disconnect();
  });

  describe('✅ 성공 케이스: 정상적인 상태 전이', () => {
    it('PLANNING → RECOMMEND 전이 성공', async () => {
      // Given: PLANNING 상태의 선거
      const election = await dataBuilder.createElection({
        status: PrismaElectionStatus.PLANNING,
      });

      // When: RECOMMEND 상태로 전이
      const result = await service.updateStatus(election.id, {
        status: ElectionStatus.RECOMMEND,
      });

      // Then: 상태가 변경되어야 함
      expect(result.status).toBe(ElectionStatus.RECOMMEND);
    });

    it('RECOMMEND → CANDIDATE_CONFIRM 전이 성공', async () => {
      // Given: RECOMMEND 상태의 선거
      const election = await dataBuilder.createElection({
        status: PrismaElectionStatus.RECOMMEND,
      });

      // When: CANDIDATE_CONFIRM 상태로 전이
      const result = await service.updateStatus(election.id, {
        status: ElectionStatus.CANDIDATE_CONFIRM,
      });

      // Then: 상태가 변경되어야 함
      expect(result.status).toBe(ElectionStatus.CANDIDATE_CONFIRM);
    });

    it('CANDIDATE_CONFIRM → VOTING 전이 성공', async () => {
      // Given: CANDIDATE_CONFIRM 상태의 선거
      const now = new Date();
      const election = await dataBuilder.createElection({
        status: PrismaElectionStatus.CANDIDATE_CONFIRM,
        recommendationStartDate: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000),
        recommendationEndDate: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
        votingStartDate: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
        votingEndDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
      });

      // When: VOTING 상태로 전이
      const result = await service.updateStatus(election.id, {
        status: ElectionStatus.VOTING,
      });

      // Then: 상태가 변경되어야 함
      expect(result.status).toBe(ElectionStatus.VOTING);
    });

    it('VOTING → CLOSED 전이 성공', async () => {
      // Given: VOTING 상태의 선거
      const election = await dataBuilder.createElectionInVotingPeriod();

      // When: CLOSED 상태로 전이
      const result = await service.updateStatus(election.id, {
        status: ElectionStatus.CLOSED,
      });

      // Then: 상태가 변경되어야 함
      expect(result.status).toBe(ElectionStatus.CLOSED);
    });

    it('모든 상태 → CANCELLED 전이 성공', async () => {
      // Given: PLANNING 상태의 선거
      const election = await dataBuilder.createElection({
        status: PrismaElectionStatus.PLANNING,
      });

      // When: CANCELLED 상태로 전이
      const result = await service.updateStatus(election.id, {
        status: ElectionStatus.CANCELLED,
      });

      // Then: 상태가 변경되어야 함
      expect(result.status).toBe(ElectionStatus.CANCELLED);
    });

    it('RECOMMEND → CANCELLED 전이 성공', async () => {
      // Given: RECOMMEND 상태의 선거
      const election = await dataBuilder.createElection({
        status: PrismaElectionStatus.RECOMMEND,
      });

      // When: CANCELLED 상태로 전이
      const result = await service.updateStatus(election.id, {
        status: ElectionStatus.CANCELLED,
      });

      // Then: 상태가 변경되어야 함
      expect(result.status).toBe(ElectionStatus.CANCELLED);
    });

    it('VOTING → CANCELLED 전이 성공', async () => {
      // Given: VOTING 상태의 선거
      const election = await dataBuilder.createElectionInVotingPeriod();

      // When: CANCELLED 상태로 전이
      const result = await service.updateStatus(election.id, {
        status: ElectionStatus.CANCELLED,
      });

      // Then: 상태가 변경되어야 함
      expect(result.status).toBe(ElectionStatus.CANCELLED);
    });
  });

  describe('❌ 실패 케이스: 잘못된 상태 전이', () => {
    it('PLANNING → VOTING 직접 전이 시도 (단계 건너뛰기)', async () => {
      // Given: PLANNING 상태의 선거
      const election = await dataBuilder.createElection({
        status: PrismaElectionStatus.PLANNING,
      });

      // When & Then: VOTING으로 직접 전이 시도 시 예외 발생
      await expect(
        service.updateStatus(election.id, {
          status: ElectionStatus.VOTING,
        })
      ).rejects.toThrow(BusinessException);

      await expect(
        service.updateStatus(election.id, {
          status: ElectionStatus.VOTING,
        })
      ).rejects.toMatchObject({
        code: ErrorCode.ELECTION_INVALID_STATUS_TRANSITION,
      });
    });

    it('RECOMMEND → PLANNING 역순 전이 시도', async () => {
      // Given: RECOMMEND 상태의 선거
      const election = await dataBuilder.createElection({
        status: PrismaElectionStatus.RECOMMEND,
      });

      // When & Then: PLANNING으로 역순 전이 시도 시 예외 발생
      await expect(
        service.updateStatus(election.id, {
          status: ElectionStatus.PLANNING,
        })
      ).rejects.toThrow(BusinessException);

      await expect(
        service.updateStatus(election.id, {
          status: ElectionStatus.PLANNING,
        })
      ).rejects.toMatchObject({
        code: ErrorCode.ELECTION_INVALID_STATUS_TRANSITION,
      });
    });

    it('CLOSED → 다른 상태로 전이 시도 (종료 상태에서 변경 불가)', async () => {
      // Given: CLOSED 상태의 선거
      const election = await dataBuilder.createElection({
        status: PrismaElectionStatus.CLOSED,
      });

      // When & Then: CLOSED에서 다른 상태로 전이 시도 시 예외 발생
      await expect(
        service.updateStatus(election.id, {
          status: ElectionStatus.PLANNING,
        })
      ).rejects.toThrow(BusinessException);

      await expect(
        service.updateStatus(election.id, {
          status: ElectionStatus.RECOMMEND,
        })
      ).rejects.toThrow(BusinessException);
    });

    it('CANCELLED → 다른 상태로 전이 시도', async () => {
      // Given: CANCELLED 상태의 선거
      const election = await dataBuilder.createElection({
        status: PrismaElectionStatus.CANCELLED,
      });

      // When & Then: CANCELLED에서 다른 상태로 전이 시도 시 예외 발생
      await expect(
        service.updateStatus(election.id, {
          status: ElectionStatus.PLANNING,
        })
      ).rejects.toThrow(BusinessException);

      await expect(
        service.updateStatus(election.id, {
          status: ElectionStatus.VOTING,
        })
      ).rejects.toThrow(BusinessException);
    });

    it('같은 상태로 전이 시도 (PLANNING → PLANNING)', async () => {
      // Given: PLANNING 상태의 선거
      const election = await dataBuilder.createElection({
        status: PrismaElectionStatus.PLANNING,
      });

      // When & Then: 같은 상태로 전이 시도 시 예외 발생
      await expect(
        service.updateStatus(election.id, {
          status: ElectionStatus.PLANNING,
        })
      ).rejects.toThrow(BusinessException);

      await expect(
        service.updateStatus(election.id, {
          status: ElectionStatus.PLANNING,
        })
      ).rejects.toMatchObject({
        code: ErrorCode.ELECTION_INVALID_STATUS_TRANSITION,
      });
    });

    it('존재하지 않는 선거 ID로 상태 변경 시도', async () => {
      // Given: 존재하지 않는 선거 ID
      const fakeElectionId = '00000000-0000-0000-0000-000000000000';

      // When & Then: 존재하지 않는 선거 상태 변경 시 예외 발생
      await expect(
        service.updateStatus(fakeElectionId, {
          status: ElectionStatus.RECOMMEND,
        })
      ).rejects.toThrow(BusinessException);

      await expect(
        service.updateStatus(fakeElectionId, {
          status: ElectionStatus.RECOMMEND,
        })
      ).rejects.toMatchObject({
        code: ErrorCode.ELECTION_NOT_FOUND,
      });
    });
  });

  describe('❌ 실패 케이스: 날짜 검증 실패', () => {
    it('투표 시작일이 추천 종료일보다 빠른 경우 VOTING 전이 실패', async () => {
      // Given: 잘못된 날짜의 선거
      const now = new Date();
      const election = await dataBuilder.createElection({
        status: PrismaElectionStatus.CANDIDATE_CONFIRM,
        recommendationStartDate: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000),
        recommendationEndDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000), // 추천 종료일이 미래
        votingStartDate: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000), // 투표 시작일이 과거
        votingEndDate: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000),
      });

      // When & Then: VOTING 전이 시 날짜 검증 실패로 예외 발생
      await expect(
        service.updateStatus(election.id, {
          status: ElectionStatus.VOTING,
        })
      ).rejects.toThrow(BusinessException);

      await expect(
        service.updateStatus(election.id, {
          status: ElectionStatus.VOTING,
        })
      ).rejects.toMatchObject({
        code: ErrorCode.ELECTION_INVALID_DATE_RANGE,
      });
    });
  });

  describe('📊 통합 시나리오: 전체 선거 사이클', () => {
    it('선거 생성부터 종료까지 전체 상태 전이 성공', async () => {
      // Given: 새로운 선거 생성
      const now = new Date();
      const election = await dataBuilder.createElection({
        status: PrismaElectionStatus.PLANNING,
        recommendationStartDate: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000),
        recommendationEndDate: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
        votingStartDate: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
        votingEndDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
      });

      // When & Then: PLANNING → RECOMMEND
      let result = await service.updateStatus(election.id, {
        status: ElectionStatus.RECOMMEND,
      });
      expect(result.status).toBe(ElectionStatus.RECOMMEND);

      // When & Then: RECOMMEND → CANDIDATE_CONFIRM
      result = await service.updateStatus(election.id, {
        status: ElectionStatus.CANDIDATE_CONFIRM,
      });
      expect(result.status).toBe(ElectionStatus.CANDIDATE_CONFIRM);

      // When & Then: CANDIDATE_CONFIRM → VOTING
      result = await service.updateStatus(election.id, {
        status: ElectionStatus.VOTING,
      });
      expect(result.status).toBe(ElectionStatus.VOTING);

      // When & Then: VOTING → CLOSED
      result = await service.updateStatus(election.id, {
        status: ElectionStatus.CLOSED,
      });
      expect(result.status).toBe(ElectionStatus.CLOSED);

      // Then: 최종 상태가 CLOSED
      const finalElection = await service.findOne(election.id);
      expect(finalElection.status).toBe(ElectionStatus.CLOSED);
    });
  });
});
