import { IsEnum, IsInt, Min, Max, IsOptional } from 'class-validator';
import { ElectionRole } from './candidate-response.dto';

/**
 * 후보 생성 DTO
 *
 * 관리자가 추천 상위 N명을 후보로 지정할 때 사용
 *
 * @example
 * {
 *   "forRole": "PRESIDENT",
 *   "topN": 3
 * }
 */
export class CreateCandidatesDto {
  /**
   * 후보를 선정할 역할
   */
  @IsEnum(ElectionRole, {
    message: '역할은 PRESIDENT, VICE_PRESIDENT, SECRETARY, TREASURER, AUDITOR 중 하나여야 합니다.',
  })
  forRole: ElectionRole;

  /**
   * 추천 상위 몇 명을 후보로 지정할지 (기본값: 3)
   */
  @IsOptional()
  @IsInt({ message: '상위 N명은 정수여야 합니다.' })
  @Min(1, { message: '최소 1명 이상이어야 합니다.' })
  @Max(10, { message: '최대 10명까지 가능합니다.' })
  topN?: number;
}
