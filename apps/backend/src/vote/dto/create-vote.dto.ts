import { IsUUID, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * 투표 생성 DTO
 *
 * 여러 역할에 대해 동시에 투표할 수 있습니다.
 * 각 역할별로 후보 ID를 지정합니다.
 *
 * @example
 * {
 *   "presidentCandidateId": "uuid",
 *   "treasurerCandidateId": "uuid"
 * }
 */
export class CreateVoteDto {
  /**
   * 회장 후보 ID (선택)
   */
  @IsOptional()
  @IsUUID('4', { message: '회장 후보 ID는 유효한 UUID여야 합니다.' })
  presidentCandidateId?: string;

  /**
   * 부회장 후보 ID (선택)
   */
  @IsOptional()
  @IsUUID('4', { message: '부회장 후보 ID는 유효한 UUID여야 합니다.' })
  vicePresidentCandidateId?: string;

  /**
   * 총무 후보 ID (선택)
   */
  @IsOptional()
  @IsUUID('4', { message: '총무 후보 ID는 유효한 UUID여야 합니다.' })
  secretaryCandidateId?: string;

  /**
   * 재무 후보 ID (선택)
   */
  @IsOptional()
  @IsUUID('4', { message: '재무 후보 ID는 유효한 UUID여야 합니다.' })
  treasurerCandidateId?: string;

  /**
   * 감사 후보 ID (선택)
   */
  @IsOptional()
  @IsUUID('4', { message: '감사 후보 ID는 유효한 UUID여야 합니다.' })
  auditorCandidateId?: string;
}
