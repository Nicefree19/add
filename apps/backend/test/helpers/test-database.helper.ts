/**
 * Test Database Helper
 *
 * 테스트용 데이터베이스 헬퍼 유틸리티
 */

import { PrismaClient } from '@prisma/client';
import { Injectable } from '@nestjs/common';

@Injectable()
export class TestDatabaseHelper {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient({
      datasources: {
        db: {
          url: process.env.DATABASE_URL || 'file:./test.db',
        },
      },
    });
  }

  /**
   * 모든 테이블 데이터 삭제 (역순으로 FK 제약 회피)
   */
  async cleanDatabase(): Promise<void> {
    const tables = [
      'votes',
      'recommendations',
      'candidates',
      'election_rounds',
      'notification_logs',
      'access_logs',
      'transition_docs',
      'otp_tokens',
      'users',
    ];

    // Transaction으로 모든 데이터 삭제
    await this.prisma.$transaction(
      tables.map((table) =>
        this.prisma.$executeRawUnsafe(`DELETE FROM ${table};`)
      )
    );
  }

  /**
   * Prisma Client 반환
   */
  getPrisma(): PrismaClient {
    return this.prisma;
  }

  /**
   * 연결 종료
   */
  async disconnect(): Promise<void> {
    await this.prisma.$disconnect();
  }
}

/**
 * 테스트 데이터베이스 인스턴스 생성 헬퍼
 */
export function createTestDatabaseHelper(): TestDatabaseHelper {
  return new TestDatabaseHelper();
}
