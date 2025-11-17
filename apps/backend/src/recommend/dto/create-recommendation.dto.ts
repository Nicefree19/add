import { IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

/**
 * 선거 역할
 */
export enum ElectionRole {
  PRESIDENT = 'PRESIDENT',
  VICE_PRESIDENT = 'VICE_PRESIDENT',
  SECRETARY = 'SECRETARY',
  TREASURER = 'TREASURER',
  AUDITOR = 'AUDITOR',
}

/**
 * 추천 생성 DTO
 *
 * 회원이 선거의 특정 역할에 대해 후보를 추천할 때 사용
 *
 * @example
 * {
 *   "forRole": "PRESIDENT",
 *   "candidateUserId": "uuid",
 *   "reason": "리더십과 책임감이 뛰어나서 추천합니다."
 * }
 */
export class CreateRecommendationDto {
  /**
   * 추천할 역할
   * PRESIDENT 또는 TREASURER (요구사항에 따라)
   * 실제로는 모든 ElectionRole 가능
   */
  @IsEnum(ElectionRole, {
    message: '역할은 PRESIDENT, VICE_PRESIDENT, SECRETARY, TREASURER, AUDITOR 중 하나여야 합니다.',
  })
  @IsNotEmpty({ message: '역할은 필수 입력 항목입니다.' })
  forRole: ElectionRole;

  /**
   * 추천할 후보의 사용자 ID
   */
  @IsUUID('4', { message: '후보 사용자 ID는 유효한 UUID여야 합니다.' })
  @IsNotEmpty({ message: '후보 사용자 ID는 필수 입력 항목입니다.' })
  candidateUserId: string;

  /**
   * 추천 이유 (선택)
   */
  @IsOptional()
  @IsString({ message: '추천 이유는 문자열이어야 합니다.' })
  reason?: string;
}
