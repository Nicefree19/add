/**
 * Jest Global Setup
 *
 * 전체 테스트 실행 전 한 번만 실행됩니다.
 * 테스트 DB 초기화 등을 수행합니다.
 */

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

export default async function globalSetup() {
  console.log('\n🚀 Setting up test environment...\n');

  // 테스트 DB 파일 경로
  const testDbPath = path.join(__dirname, '..', 'test.db');

  // 기존 테스트 DB 삭제
  if (fs.existsSync(testDbPath)) {
    fs.unlinkSync(testDbPath);
    console.log('✓ Cleaned up old test database');
  }

  // Prisma 마이그레이션 실행 (SQLite)
  try {
    execSync('dotenv -e .env.test -- npx prisma migrate deploy', {
      cwd: path.join(__dirname, '..'),
      stdio: 'inherit',
    });
    console.log('✓ Applied Prisma migrations to test database');
  } catch (error) {
    console.error('✗ Failed to apply migrations:', error);
    throw error;
  }

  console.log('\n✅ Test environment ready!\n');
}
