import { IsBoolean, IsOptional } from 'class-validator';

/**
 * 인수인계 완료 상태 업데이트 DTO
 */
export class UpdateTransitionStatusDto {
  @IsBoolean()
  @IsOptional()
  isCompleted?: boolean;
}
