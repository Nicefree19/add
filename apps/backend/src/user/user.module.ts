import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './user.service';

/**
 * 사용자 모듈
 *
 * 사용자 정보 조회 및 관리 기능을 제공합니다.
 *
 * 제공 기능:
 * - 내 정보 조회
 * - 사용자 목록 조회 (페이지네이션, 필터링)
 * - 사용자 역할 변경 (관리자 전용)
 * - 사용자 활성화 상태 변경 (관리자 전용)
 *
 * 의존성:
 * - @prisma/client: 데이터베이스 접근
 *
 * 권한:
 * - GET /users/me: 인증된 사용자
 * - GET /users: ADMIN 역할 필요
 * - PATCH /users/:id/role: ADMIN 역할 필요
 * - PATCH /users/:id/active: ADMIN 역할 필요
 */
@Module({
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService], // 다른 모듈에서 사용 가능하도록 export
})
export class UserModule {}
