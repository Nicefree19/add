import { Injectable, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

/**
 * Health Check 서비스
 *
 * 시스템 상태 모니터링을 위한 다양한 레벨의 헬스 체크 제공
 * - 기본 체크: 서비스 실행 여부만 확인 (빠름)
 * - 상세 체크: DB 연결, 환경 변수 등 전체 확인 (느림)
 * - Readiness: 요청 수락 준비 상태
 */
@Injectable()
export class HealthService {
  private readonly logger = new Logger(HealthService.name);
  private readonly prisma: PrismaClient;
  private readonly startTime: Date;

  constructor() {
    this.prisma = new PrismaClient();
    this.startTime = new Date();
  }

  /**
   * 기본 헬스 체크
   *
   * 서비스가 실행 중인지만 확인 (DB 체크 없음)
   * 로드밸런서, AWS ELB 등에서 사용
   *
   * @returns 기본 상태 정보
   */
  async getBasicHealth() {
    const uptime = Math.floor((Date.now() - this.startTime.getTime()) / 1000);

    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: uptime,
      service: 'election-backend',
      environment: process.env.NODE_ENV || 'development',
    };
  }

  /**
   * 상세 헬스 체크
   *
   * DB 연결, 환경 변수 등 전체 시스템 상태 확인
   * 모니터링 시스템(DataDog, CloudWatch 등)에서 사용
   *
   * @returns 상세 상태 정보
   */
  async getDetailedHealth() {
    const basic = await this.getBasicHealth();

    // DB 연결 상태 확인
    const dbStatus = await this.checkDatabaseConnection();

    // 환경 변수 확인
    const envStatus = this.checkEnvironmentVariables();

    // 메모리 사용량
    const memoryUsage = process.memoryUsage();

    return {
      ...basic,
      database: dbStatus,
      environment: envStatus,
      memory: {
        heapUsed: Math.floor(memoryUsage.heapUsed / 1024 / 1024) + ' MB',
        heapTotal: Math.floor(memoryUsage.heapTotal / 1024 / 1024) + ' MB',
        rss: Math.floor(memoryUsage.rss / 1024 / 1024) + ' MB',
      },
    };
  }

  /**
   * Readiness Probe
   *
   * 서비스가 요청을 받을 준비가 되었는지 확인
   * Kubernetes readinessProbe에서 사용
   *
   * @returns 준비 상태
   */
  async checkReadiness() {
    try {
      // DB 연결 확인 (readiness의 핵심)
      const dbStatus = await this.checkDatabaseConnection();

      if (!dbStatus.connected) {
        return {
          status: 'not_ready',
          timestamp: new Date().toISOString(),
          reason: 'Database connection failed',
          details: dbStatus,
        };
      }

      // 필수 환경 변수 확인
      const envStatus = this.checkEnvironmentVariables();
      if (!envStatus.valid) {
        return {
          status: 'not_ready',
          timestamp: new Date().toISOString(),
          reason: 'Required environment variables missing',
          details: envStatus,
        };
      }

      return {
        status: 'ready',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error('Readiness check failed:', error);
      return {
        status: 'not_ready',
        timestamp: new Date().toISOString(),
        reason: 'Unexpected error during readiness check',
        error: error.message,
      };
    }
  }

  /**
   * DB 연결 상태 확인
   *
   * @returns DB 연결 상태
   */
  private async checkDatabaseConnection(): Promise<{
    connected: boolean;
    responseTime?: number;
    error?: string;
  }> {
    const startTime = Date.now();

    try {
      // 간단한 쿼리로 DB 연결 확인
      await this.prisma.$queryRaw`SELECT 1`;

      const responseTime = Date.now() - startTime;

      return {
        connected: true,
        responseTime,
      };
    } catch (error) {
      this.logger.error('Database connection check failed:', error);
      return {
        connected: false,
        error: error.message,
      };
    }
  }

  /**
   * 환경 변수 확인
   *
   * 필수 환경 변수가 설정되어 있는지 확인
   *
   * @returns 환경 변수 상태
   */
  private checkEnvironmentVariables(): {
    valid: boolean;
    missing?: string[];
  } {
    const requiredVars = [
      'DATABASE_URL',
      'JWT_SECRET',
      'BALLOT_SECRET_SALT',
    ];

    const missing = requiredVars.filter((varName) => !process.env[varName]);

    if (missing.length > 0) {
      this.logger.warn(`Missing required environment variables: ${missing.join(', ')}`);
      return {
        valid: false,
        missing,
      };
    }

    return {
      valid: true,
    };
  }

  /**
   * 서비스 종료 시 Prisma 연결 해제
   */
  async onModuleDestroy() {
    await this.prisma.$disconnect();
  }
}
