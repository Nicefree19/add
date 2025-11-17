import { IsBoolean, IsNotEmpty } from 'class-validator';

/**
 * 사용자 활성화 상태 변경 DTO
 *
 * 관리자가 사용자의 활성화 상태를 변경할 때 사용
 *
 * @example
 * {
 *   "isActive": false
 * }
 */
export class UpdateUserActiveDto {
  /**
   * 활성화 상태
   * true: 활성화, false: 비활성화
   */
  @IsBoolean({ message: '활성화 상태는 boolean 타입이어야 합니다.' })
  @IsNotEmpty({ message: '활성화 상태는 필수 입력 항목입니다.' })
  isActive: boolean;
}
