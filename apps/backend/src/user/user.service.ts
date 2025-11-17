import { Injectable, Logger } from '@nestjs/common';
import { PrismaClient, UserRole as PrismaUserRole } from '@prisma/client';
import { ErrorCode } from '../common/constants/error-codes';
import { BusinessException } from '../common/exceptions/business.exception';
import {
  PaginatedResponse,
  PaginationHelper,
} from '../common/dto/pagination.dto';
import {
  UserResponseDto,
  UpdateUserRoleDto,
  UpdateUserActiveDto,
  UserListQueryDto,
} from './dto';

/**
 * 사용자 서비스
 *
 * 사용자 정보 조회 및 관리 기능 제공
 *
 * 주요 기능:
 * - 내 정보 조회
 * - 사용자 목록 조회 (페이지네이션, 필터링)
 * - 사용자 역할 변경 (관리자 전용)
 * - 사용자 활성화 상태 변경 (관리자 전용)
 */
@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);
  private readonly prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  /**
   * 내 정보 조회
   *
   * 현재 로그인한 사용자의 정보를 반환합니다.
   *
   * @param userId - 현재 사용자 ID
   * @returns 사용자 정보
   */
  async findMe(userId: string): Promise<UserResponseDto> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new BusinessException(
        ErrorCode.USER_NOT_FOUND,
        '사용자를 찾을 수 없습니다.',
      );
    }

    this.logger.log(`User ${user.email} retrieved their profile`);

    return UserResponseDto.fromPrisma(user);
  }

  /**
   * 사용자 목록 조회
   *
   * 페이지네이션 및 필터링을 지원합니다.
   * 관리자 전용 기능입니다.
   *
   * @param query - 조회 옵션 (페이지, 필터 등)
   * @returns 페이지네이션된 사용자 목록
   */
  async findAll(
    query: UserListQueryDto,
  ): Promise<PaginatedResponse<UserResponseDto>> {
    const { page = 1, limit = 10, role, isActive, search } = query;

    // 필터 조건 구성
    const where: any = {};

    if (role) {
      where.role = role as PrismaUserRole;
    }

    if (typeof isActive === 'boolean') {
      where.isActive = isActive;
    }

    if (search) {
      // 이름, 이메일, 사번에서 검색
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { employeeNo: { contains: search, mode: 'insensitive' } },
      ];
    }

    // 페이지네이션 파라미터 계산
    const { skip, take } = PaginationHelper.getPrismaParams(page, limit);

    // 전체 개수 및 데이터 조회 (병렬 실행)
    const [total, users] = await Promise.all([
      this.prisma.user.count({ where }),
      this.prisma.user.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    this.logger.log(
      `Retrieved ${users.length} users (page ${page}, total ${total})`,
    );

    // 응답 데이터 변환
    const items = UserResponseDto.fromPrismaMany(users);

    return PaginationHelper.createResponse(items, total, page, limit);
  }

  /**
   * 사용자 역할 변경
   *
   * 관리자가 특정 사용자의 역할을 변경합니다.
   *
   * @param userId - 대상 사용자 ID
   * @param dto - 변경할 역할 정보
   * @returns 업데이트된 사용자 정보
   */
  async updateRole(
    userId: string,
    dto: UpdateUserRoleDto,
  ): Promise<UserResponseDto> {
    // 사용자 존재 여부 확인
    const existingUser = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!existingUser) {
      throw new BusinessException(
        ErrorCode.USER_NOT_FOUND,
        '사용자를 찾을 수 없습니다.',
      );
    }

    // 역할 변경
    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: { role: dto.role as PrismaUserRole },
    });

    this.logger.log(
      `User ${existingUser.email} role changed from ${existingUser.role} to ${dto.role}`,
    );

    return UserResponseDto.fromPrisma(updatedUser);
  }

  /**
   * 사용자 활성화 상태 변경
   *
   * 관리자가 특정 사용자의 활성화 상태를 변경합니다.
   * 비활성화된 사용자는 로그인할 수 없습니다.
   *
   * @param userId - 대상 사용자 ID
   * @param dto - 변경할 활성화 상태
   * @returns 업데이트된 사용자 정보
   */
  async updateActive(
    userId: string,
    dto: UpdateUserActiveDto,
  ): Promise<UserResponseDto> {
    // 사용자 존재 여부 확인
    const existingUser = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!existingUser) {
      throw new BusinessException(
        ErrorCode.USER_NOT_FOUND,
        '사용자를 찾을 수 없습니다.',
      );
    }

    // 활성화 상태 변경
    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: { isActive: dto.isActive },
    });

    this.logger.log(
      `User ${existingUser.email} active status changed from ${existingUser.isActive} to ${dto.isActive}`,
    );

    return UserResponseDto.fromPrisma(updatedUser);
  }

  /**
   * 서비스 종료 시 Prisma 연결 해제
   */
  async onModuleDestroy() {
    await this.prisma.$disconnect();
  }
}
