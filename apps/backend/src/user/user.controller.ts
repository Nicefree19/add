import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { UserService } from './user.service';
import {
  UserResponseDto,
  UpdateUserRoleDto,
  UpdateUserActiveDto,
  UserListQueryDto,
} from './dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { BaseResponseDto } from '../common/dto/base-response.dto';

/**
 * 사용자 컨트롤러
 *
 * 사용자 정보 조회 및 관리 엔드포인트 제공
 *
 * 제공하는 API:
 * - GET /users/me: 내 정보 조회 (로그인 필요)
 * - GET /users: 사용자 목록 조회 (관리자 전용)
 * - PATCH /users/:id/role: 역할 변경 (관리자 전용)
 * - PATCH /users/:id/active: 활성화 상태 변경 (관리자 전용)
 */
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  /**
   * 내 정보 조회
   *
   * 현재 로그인한 사용자의 정보를 반환합니다.
   *
   * @route GET /users/me
   * @access Authenticated (JWT Required)
   *
   * @param userId - JWT에서 추출된 현재 사용자 ID
   * @returns 사용자 정보
   *
   * @example
   * Request:
   * GET /users/me
   * Authorization: Bearer {accessToken}
   *
   * Response (200):
   * {
   *   "success": true,
   *   "data": {
   *     "id": "uuid",
   *     "employeeNo": "EMP001",
   *     "email": "user@example.com",
   *     "name": "홍길동",
   *     "department": "개발팀",
   *     "position": "대리",
   *     "role": "MEMBER",
   *     "isActive": true,
   *     "createdAt": "2024-01-01T00:00:00.000Z",
   *     "updatedAt": "2024-01-01T00:00:00.000Z"
   *   }
   * }
   */
  @Get('me')
  @HttpCode(HttpStatus.OK)
  async getMe(@CurrentUser('userId') userId: string) {
    const user = await this.userService.findMe(userId);
    return BaseResponseDto.success(user);
  }

  /**
   * 사용자 목록 조회
   *
   * 모든 사용자 목록을 페이지네이션하여 반환합니다.
   * 역할, 활성화 상태, 검색어로 필터링할 수 있습니다.
   *
   * @route GET /users
   * @access Admin Only
   *
   * @param query - 조회 옵션 (페이지, 필터 등)
   * @returns 페이지네이션된 사용자 목록
   *
   * @example
   * Request:
   * GET /users?page=1&limit=20&role=MEMBER&isActive=true&search=홍길동
   * Authorization: Bearer {accessToken}
   *
   * Response (200):
   * {
   *   "success": true,
   *   "data": {
   *     "items": [
   *       {
   *         "id": "uuid",
   *         "employeeNo": "EMP001",
   *         "email": "user@example.com",
   *         "name": "홍길동",
   *         "department": "개발팀",
   *         "position": "대리",
   *         "role": "MEMBER",
   *         "isActive": true,
   *         "createdAt": "2024-01-01T00:00:00.000Z",
   *         "updatedAt": "2024-01-01T00:00:00.000Z"
   *       }
   *     ],
   *     "meta": {
   *       "total": 100,
   *       "page": 1,
   *       "limit": 20,
   *       "totalPages": 5,
   *       "hasNext": true,
   *       "hasPrev": false
   *     }
   *   }
   * }
   */
  @Roles('ADMIN')
  @Get()
  @HttpCode(HttpStatus.OK)
  async getUsers(@Query() query: UserListQueryDto) {
    const result = await this.userService.findAll(query);
    return BaseResponseDto.success(result);
  }

  /**
   * 사용자 역할 변경
   *
   * 관리자가 특정 사용자의 역할을 변경합니다.
   *
   * @route PATCH /users/:id/role
   * @access Admin Only
   *
   * @param id - 대상 사용자 ID
   * @param dto - 변경할 역할 정보
   * @returns 업데이트된 사용자 정보
   *
   * @example
   * Request:
   * PATCH /users/uuid/role
   * Authorization: Bearer {accessToken}
   * {
   *   "role": "ADMIN"
   * }
   *
   * Response (200):
   * {
   *   "success": true,
   *   "data": {
   *     "id": "uuid",
   *     "employeeNo": "EMP001",
   *     "email": "user@example.com",
   *     "name": "홍길동",
   *     "role": "ADMIN",
   *     ...
   *   }
   * }
   *
   * Error Response (404):
   * {
   *   "success": false,
   *   "error": {
   *     "code": "USER_NOT_FOUND",
   *     "message": "사용자를 찾을 수 없습니다."
   *   }
   * }
   */
  @Roles('ADMIN')
  @Patch(':id/role')
  @HttpCode(HttpStatus.OK)
  async updateRole(@Param('id') id: string, @Body() dto: UpdateUserRoleDto) {
    const user = await this.userService.updateRole(id, dto);
    return BaseResponseDto.success(user);
  }

  /**
   * 사용자 활성화 상태 변경
   *
   * 관리자가 특정 사용자의 활성화 상태를 변경합니다.
   * 비활성화된 사용자는 로그인할 수 없습니다.
   *
   * @route PATCH /users/:id/active
   * @access Admin Only
   *
   * @param id - 대상 사용자 ID
   * @param dto - 변경할 활성화 상태
   * @returns 업데이트된 사용자 정보
   *
   * @example
   * Request:
   * PATCH /users/uuid/active
   * Authorization: Bearer {accessToken}
   * {
   *   "isActive": false
   * }
   *
   * Response (200):
   * {
   *   "success": true,
   *   "data": {
   *     "id": "uuid",
   *     "employeeNo": "EMP001",
   *     "email": "user@example.com",
   *     "name": "홍길동",
   *     "isActive": false,
   *     ...
   *   }
   * }
   *
   * Error Response (404):
   * {
   *   "success": false,
   *   "error": {
   *     "code": "USER_NOT_FOUND",
   *     "message": "사용자를 찾을 수 없습니다."
   *   }
   * }
   */
  @Roles('ADMIN')
  @Patch(':id/active')
  @HttpCode(HttpStatus.OK)
  async updateActive(
    @Param('id') id: string,
    @Body() dto: UpdateUserActiveDto,
  ) {
    const user = await this.userService.updateActive(id, dto);
    return BaseResponseDto.success(user);
  }
}
