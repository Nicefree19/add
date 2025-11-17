import {
  IsString,
  IsOptional,
  IsDateString,
  IsInt,
  Min,
} from 'class-validator';

/**
 * 선거 정보 수정 DTO
 *
 * 선거의 기본 정보를 수정할 때 사용
 * 관리자 전용
 *
 * @example
 * {
 *   "name": "2024년 제1차 사우회 임원 선거 (수정)",
 *   "description": "수정된 설명",
 *   "recommendationStartDate": "2024-01-20T00:00:00Z",
 *   "recommendationEndDate": "2024-02-05T23:59:59Z",
 *   "votingStartDate": "2024-02-10T00:00:00Z",
 *   "votingEndDate": "2024-02-15T23:59:59Z",
 *   "maxRecommendations": 5
 * }
 */
export class UpdateElectionDto {
  /**
   * 선거 이름 (선택)
   */
  @IsOptional()
  @IsString({ message: '선거 이름은 문자열이어야 합니다.' })
  name?: string;

  /**
   * 선거 설명 (선택)
   */
  @IsOptional()
  @IsString({ message: '선거 설명은 문자열이어야 합니다.' })
  description?: string;

  /**
   * 추천 시작 날짜 (선택)
   */
  @IsOptional()
  @IsDateString({}, { message: '추천 시작 날짜는 유효한 날짜 형식이어야 합니다.' })
  recommendationStartDate?: string;

  /**
   * 추천 종료 날짜 (선택)
   */
  @IsOptional()
  @IsDateString({}, { message: '추천 종료 날짜는 유효한 날짜 형식이어야 합니다.' })
  recommendationEndDate?: string;

  /**
   * 투표 시작 날짜 (선택)
   */
  @IsOptional()
  @IsDateString({}, { message: '투표 시작 날짜는 유효한 날짜 형식이어야 합니다.' })
  votingStartDate?: string;

  /**
   * 투표 종료 날짜 (선택)
   */
  @IsOptional()
  @IsDateString({}, { message: '투표 종료 날짜는 유효한 날짜 형식이어야 합니다.' })
  votingEndDate?: string;

  /**
   * 최대 추천 가능 횟수 (선택)
   */
  @IsOptional()
  @IsInt({ message: '최대 추천 횟수는 정수여야 합니다.' })
  @Min(1, { message: '최대 추천 횟수는 1 이상이어야 합니다.' })
  maxRecommendations?: number;
}
