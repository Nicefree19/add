import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsDateString,
  IsInt,
  Min,
} from 'class-validator';

/**
 * 선거 생성 DTO
 *
 * 새로운 선거 회차를 생성할 때 사용
 * 관리자 전용
 *
 * @example
 * {
 *   "name": "2024년 제1차 사우회 임원 선거",
 *   "description": "2024년도 사우회 임원 선출을 위한 선거",
 *   "recommendationStartDate": "2024-01-15T00:00:00Z",
 *   "recommendationEndDate": "2024-01-31T23:59:59Z",
 *   "votingStartDate": "2024-02-05T00:00:00Z",
 *   "votingEndDate": "2024-02-10T23:59:59Z",
 *   "maxRecommendations": 3
 * }
 */
export class CreateElectionDto {
  /**
   * 선거 이름
   */
  @IsString({ message: '선거 이름은 문자열이어야 합니다.' })
  @IsNotEmpty({ message: '선거 이름은 필수 입력 항목입니다.' })
  name: string;

  /**
   * 선거 설명 (선택)
   */
  @IsOptional()
  @IsString({ message: '선거 설명은 문자열이어야 합니다.' })
  description?: string;

  /**
   * 추천 시작 날짜
   */
  @IsDateString({}, { message: '추천 시작 날짜는 유효한 날짜 형식이어야 합니다.' })
  @IsNotEmpty({ message: '추천 시작 날짜는 필수 입력 항목입니다.' })
  recommendationStartDate: string;

  /**
   * 추천 종료 날짜
   */
  @IsDateString({}, { message: '추천 종료 날짜는 유효한 날짜 형식이어야 합니다.' })
  @IsNotEmpty({ message: '추천 종료 날짜는 필수 입력 항목입니다.' })
  recommendationEndDate: string;

  /**
   * 투표 시작 날짜
   */
  @IsDateString({}, { message: '투표 시작 날짜는 유효한 날짜 형식이어야 합니다.' })
  @IsNotEmpty({ message: '투표 시작 날짜는 필수 입력 항목입니다.' })
  votingStartDate: string;

  /**
   * 투표 종료 날짜
   */
  @IsDateString({}, { message: '투표 종료 날짜는 유효한 날짜 형식이어야 합니다.' })
  @IsNotEmpty({ message: '투표 종료 날짜는 필수 입력 항목입니다.' })
  votingEndDate: string;

  /**
   * 최대 추천 가능 횟수
   */
  @IsOptional()
  @IsInt({ message: '최대 추천 횟수는 정수여야 합니다.' })
  @Min(1, { message: '최대 추천 횟수는 1 이상이어야 합니다.' })
  maxRecommendations?: number;
}
