import { IsOptional, IsString, IsEnum, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';
import { PaginationDto } from '../../common/dto/pagination.dto';

/**
 * 사용자 역할 필터
 */
export enum UserRoleFilter {
  ADMIN = 'ADMIN',
  MEMBER = 'MEMBER',
  GUEST = 'GUEST',
}

/**
 * 사용자 목록 조회 쿼리 DTO
 *
 * 페이지네이션 및 필터링 옵션 제공
 *
 * @example
 * GET /users?page=1&limit=20&role=MEMBER&isActive=true&search=홍길동
 */
export class UserListQueryDto extends PaginationDto {
  /**
   * 역할 필터 (선택)
   */
  @IsOptional()
  @IsEnum(UserRoleFilter, { message: '유효한 역할을 입력해주세요.' })
  role?: UserRoleFilter;

  /**
   * 활성화 상태 필터 (선택)
   */
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean({ message: '활성화 상태는 boolean 타입이어야 합니다.' })
  isActive?: boolean;

  /**
   * 검색어 (이름, 이메일, 사번에서 검색)
   */
  @IsOptional()
  @IsString({ message: '검색어는 문자열이어야 합니다.' })
  search?: string;
}
