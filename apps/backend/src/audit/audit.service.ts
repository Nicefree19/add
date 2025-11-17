import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/**
 * 접근 로그 기록용 데이터
 */
export interface AccessLogData {
  userId?: string;
  ipAddress: string;
  userAgent: string;
  action: string;
  resource?: string;
  metadata?: any;
  statusCode?: number;
}

/**
 * Audit Service
 *
 * 모든 사용자 행동을 AccessLog에 기록
 */
@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * 접근 로그 기록
   */
  async log(data: AccessLogData) {
    try {
      return await this.prisma.accessLog.create({
        data: {
          userId: data.userId || null,
          ipAddress: data.ipAddress,
          userAgent: data.userAgent,
          action: data.action,
          resource: data.resource || null,
          metadata: data.metadata ? JSON.stringify(data.metadata) : null,
          statusCode: data.statusCode || null,
        },
      });
    } catch (error) {
      // 로그 기록 실패는 시스템 동작에 영향을 주지 않음
      this.logger.error(`Failed to create access log: ${error.message}`);
      return null;
    }
  }

  /**
   * 로그인 기록
   */
  async logLogin(
    userId: string,
    ipAddress: string,
    userAgent: string,
    success: boolean,
  ) {
    return this.log({
      userId,
      ipAddress,
      userAgent,
      action: 'LOGIN',
      metadata: { success },
      statusCode: success ? 200 : 401,
    });
  }

  /**
   * 로그아웃 기록
   */
  async logLogout(userId: string, ipAddress: string, userAgent: string) {
    return this.log({
      userId,
      ipAddress,
      userAgent,
      action: 'LOGOUT',
      statusCode: 200,
    });
  }

  /**
   * 투표 기록
   */
  async logVote(
    userId: string,
    electionId: string,
    candidateId: string,
    ipAddress: string,
    userAgent: string,
  ) {
    return this.log({
      userId,
      ipAddress,
      userAgent,
      action: 'VOTE',
      resource: `election:${electionId}`,
      metadata: {
        electionId,
        candidateId,
      },
      statusCode: 201,
    });
  }

  /**
   * 추천 기록
   */
  async logRecommend(
    userId: string,
    electionId: string,
    candidateId: string,
    ipAddress: string,
    userAgent: string,
  ) {
    return this.log({
      userId,
      ipAddress,
      userAgent,
      action: 'RECOMMEND',
      resource: `election:${electionId}`,
      metadata: {
        electionId,
        candidateId,
      },
      statusCode: 201,
    });
  }

  /**
   * 후보 등록 기록
   */
  async logCandidateRegistration(
    userId: string,
    electionId: string,
    role: string,
    ipAddress: string,
    userAgent: string,
  ) {
    return this.log({
      userId,
      ipAddress,
      userAgent,
      action: 'CANDIDATE_REGISTER',
      resource: `election:${electionId}`,
      metadata: {
        electionId,
        role,
      },
      statusCode: 201,
    });
  }

  /**
   * 선거 생성 기록
   */
  async logElectionCreate(
    userId: string,
    electionId: string,
    ipAddress: string,
    userAgent: string,
  ) {
    return this.log({
      userId,
      ipAddress,
      userAgent,
      action: 'ELECTION_CREATE',
      resource: `election:${electionId}`,
      metadata: {
        electionId,
      },
      statusCode: 201,
    });
  }

  /**
   * 선거 상태 변경 기록
   */
  async logElectionStatusChange(
    userId: string,
    electionId: string,
    fromStatus: string,
    toStatus: string,
    ipAddress: string,
    userAgent: string,
  ) {
    return this.log({
      userId,
      ipAddress,
      userAgent,
      action: 'ELECTION_STATUS_CHANGE',
      resource: `election:${electionId}`,
      metadata: {
        electionId,
        fromStatus,
        toStatus,
      },
      statusCode: 200,
    });
  }

  /**
   * 사용자 생성 기록
   */
  async logUserCreate(
    adminId: string,
    newUserId: string,
    ipAddress: string,
    userAgent: string,
  ) {
    return this.log({
      userId: adminId,
      ipAddress,
      userAgent,
      action: 'USER_CREATE',
      resource: `user:${newUserId}`,
      metadata: {
        newUserId,
      },
      statusCode: 201,
    });
  }

  /**
   * 접근 로그 조회 (페이지네이션)
   */
  async getAccessLogs(options: {
    userId?: string;
    action?: string;
    startDate?: Date;
    endDate?: Date;
    page?: number;
    limit?: number;
  }) {
    const {
      userId,
      action,
      startDate,
      endDate,
      page = 1,
      limit = 50,
    } = options;

    const where: any = {};
    if (userId) where.userId = userId;
    if (action) where.action = action;
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = startDate;
      if (endDate) where.createdAt.lte = endDate;
    }

    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      this.prisma.accessLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              employeeNo: true,
              email: true,
            },
          },
        },
      }),
      this.prisma.accessLog.count({ where }),
    ]);

    return {
      items: logs,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1,
      },
    };
  }

  /**
   * 접근 로그 통계
   */
  async getAccessLogStats(startDate?: Date, endDate?: Date) {
    const where: any = {};
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = startDate;
      if (endDate) where.createdAt.lte = endDate;
    }

    const [totalLogs, actionStats, userStats] = await Promise.all([
      // 전체 로그 수
      this.prisma.accessLog.count({ where }),

      // 액션별 통계
      this.prisma.accessLog.groupBy({
        by: ['action'],
        where,
        _count: true,
      }),

      // 사용자별 통계
      this.prisma.accessLog.groupBy({
        by: ['userId'],
        where: {
          ...where,
          userId: { not: null },
        },
        _count: true,
        orderBy: {
          _count: {
            userId: 'desc',
          },
        },
        take: 10,
      }),
    ]);

    return {
      totalLogs,
      byAction: actionStats.map((stat) => ({
        action: stat.action,
        count: stat._count,
      })),
      topUsers: userStats.map((stat) => ({
        userId: stat.userId,
        count: stat._count,
      })),
    };
  }
}
