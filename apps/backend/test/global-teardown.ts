/**
 * Jest Global Teardown
 *
 * 전체 테스트 종료 후 한 번만 실행됩니다.
 * 테스트 DB 정리 등을 수행합니다.
 */

import * as fs from 'fs';
import * as path from 'path';

export default async function globalTeardown() {
  console.log('\n🧹 Cleaning up test environment...\n');

  // 테스트 DB 파일 삭제
  const testDbPath = path.join(__dirname, '..', 'test.db');
  const testDbJournalPath = `${testDbPath}-journal`;

  if (fs.existsSync(testDbPath)) {
    fs.unlinkSync(testDbPath);
    console.log('✓ Removed test database');
  }

  if (fs.existsSync(testDbJournalPath)) {
    fs.unlinkSync(testDbJournalPath);
  }

  console.log('\n✅ Cleanup complete!\n');
}
