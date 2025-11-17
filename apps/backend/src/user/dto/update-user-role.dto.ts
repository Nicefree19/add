import { IsEnum, IsNotEmpty } from 'class-validator';

/**
 * 사용자 역할
 */
export enum UserRole {
  ADMIN = 'ADMIN',
  MEMBER = 'MEMBER',
  GUEST = 'GUEST',
}

/**
 * 사용자 역할 변경 DTO
 *
 * 관리자가 사용자의 역할을 변경할 때 사용
 *
 * @example
 * {
 *   "role": "ADMIN"
 * }
 */
export class UpdateUserRoleDto {
  /**
   * 변경할 역할
   * ADMIN, MEMBER, GUEST 중 하나
   */
  @IsEnum(UserRole, {
    message: '역할은 ADMIN, MEMBER, GUEST 중 하나여야 합니다.',
  })
  @IsNotEmpty({ message: '역할은 필수 입력 항목입니다.' })
  role: UserRole;
}
