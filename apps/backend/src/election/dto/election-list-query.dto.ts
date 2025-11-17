import { IsOptional, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { ElectionStatus } from './update-election-status.dto';

/**
 * 선거 목록 조회 쿼리 DTO
 *
 * 페이지네이션 및 필터링 옵션 제공
 *
 * @example
 * GET /elections?page=1&limit=20&status=VOTING
 */
export class ElectionListQueryDto extends PaginationDto {
  /**
   * 상태 필터 (선택)
   */
  @IsOptional()
  @IsEnum(ElectionStatus, { message: '유효한 상태를 입력해주세요.' })
  status?: ElectionStatus;
}
