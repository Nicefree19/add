import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

/**
 * 후보 응답 상태 (후보 본인이 변경 가능한 상태만)
 */
export enum CandidateResponseStatus {
  ACCEPTED = 'ACCEPTED',   // 수락
  DECLINED = 'DECLINED',   // 거절
}

/**
 * 후보 상태 변경 DTO
 *
 * 후보 본인이 초대를 수락하거나 거절할 때 사용
 *
 * @example
 * {
 *   "status": "ACCEPTED",
 *   "statement": "열심히 하겠습니다."
 * }
 */
export class UpdateCandidateStatusDto {
  /**
   * 변경할 상태 (ACCEPTED 또는 DECLINED)
   */
  @IsEnum(CandidateResponseStatus, {
    message: '상태는 ACCEPTED 또는 DECLINED 중 하나여야 합니다.',
  })
  @IsNotEmpty({ message: '상태는 필수 입력 항목입니다.' })
  status: CandidateResponseStatus;

  /**
   * 소견서/각오 (ACCEPTED 시 선택)
   */
  @IsOptional()
  @IsString({ message: '소견서는 문자열이어야 합니다.' })
  statement?: string;
}
