import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { RecommendService } from './recommend.service';
import { CreateRecommendationDto } from './dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { BaseResponseDto } from '../common/dto/base-response.dto';

/**
 * 추천 컨트롤러
 *
 * 선거의 후보 추천 기능 제공
 *
 * 제공하는 API:
 * - POST /elections/:id/recommendations: 추천 생성 (회원)
 * - GET /elections/:id/recommendations: 추천 현황 조회 (관리자 전용)
 */
@Controller('elections/:electionId/recommendations')
export class RecommendController {
  constructor(private readonly recommendService: RecommendService) {}

  /**
   * 추천 생성
   *
   * 회원이 특정 선거의 특정 역할에 대해 후보를 추천합니다.
   *
   * 검증 규칙:
   * - 선거 상태가 RECOMMEND여야 함
   * - 자기 자신을 추천할 수 없음
   * - 같은 선거, 같은 역할에 대해 한 번만 추천 가능
   *
   * @route POST /elections/:id/recommendations
   * @access Authenticated (JWT Required)
   *
   * @param electionId - 선거 ID
   * @param userId - 현재 사용자 ID (JWT에서 추출)
   * @param dto - 추천 정보
   * @returns 생성된 추천 정보
   *
   * @example
   * Request:
   * POST /elections/uuid/recommendations
   * Authorization: Bearer {accessToken}
   * {
   *   "forRole": "PRESIDENT",
   *   "candidateUserId": "uuid",
   *   "reason": "리더십과 책임감이 뛰어나서 추천합니다."
   * }
   *
   * Response (201):
   * {
   *   "success": true,
   *   "data": {
   *     "id": "uuid",
   *     "electionId": "uuid",
   *     "recommenderId": "uuid",
   *     "candidateId": "uuid",
   *     "forRole": "PRESIDENT",
   *     "comment": "리더십과 책임감이 뛰어나서 추천합니다.",
   *     "createdAt": "2024-01-15T00:00:00Z",
   *     "recommender": {
   *       "id": "uuid",
   *       "name": "홍길동",
   *       "email": "hong@example.com",
   *       "employeeNo": "EMP001"
   *     },
   *     "candidate": {
   *       "id": "uuid",
   *       "userId": "uuid",
   *       "userName": "김철수",
   *       "userEmail": "kim@example.com",
   *       "status": "PENDING"
   *     }
   *   }
   * }
   *
   * Error Response (400 - 추천 기간 아님):
   * {
   *   "success": false,
   *   "error": {
   *     "code": "ELECTION_NOT_IN_RECOMMENDATION_PERIOD",
   *     "message": "추천 기간이 아닙니다."
   *   }
   * }
   *
   * Error Response (400 - 자기 추천):
   * {
   *   "success": false,
   *   "error": {
   *     "code": "RECOMMEND_SELF_NOT_ALLOWED",
   *     "message": "자기 자신을 추천할 수 없습니다."
   *   }
   * }
   *
   * Error Response (409 - 중복 추천):
   * {
   *   "success": false,
   *   "error": {
   *     "code": "RECOMMEND_DUPLICATE_FOR_ROLE",
   *     "message": "해당 역할에 대해 이미 추천했습니다."
   *   }
   * }
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createRecommendation(
    @Param('electionId') electionId: string,
    @CurrentUser('userId') userId: string,
    @Body() dto: CreateRecommendationDto,
  ) {
    const result = await this.recommendService.createRecommendation(
      electionId,
      userId,
      dto,
    );
    return BaseResponseDto.success(result);
  }

  /**
   * 추천 현황 조회
   *
   * 관리자가 특정 선거의 추천 현황을 조회합니다.
   * 역할별, 후보별로 그룹화하여 통계를 제공합니다.
   *
   * @route GET /elections/:id/recommendations
   * @access Admin Only
   *
   * @param electionId - 선거 ID
   * @returns 추천 현황 통계
   *
   * @example
   * Request:
   * GET /elections/uuid/recommendations
   * Authorization: Bearer {adminAccessToken}
   *
   * Response (200):
   * {
   *   "success": true,
   *   "data": {
   *     "electionId": "uuid",
   *     "electionName": "2024년 제1차 사우회 임원 선거",
   *     "totalRecommendations": 50,
   *     "byRole": [
   *       {
   *         "role": "PRESIDENT",
   *         "totalRecommendations": 30,
   *         "candidates": [
   *           {
   *             "candidateId": "uuid",
   *             "userId": "uuid",
   *             "name": "김철수",
   *             "email": "kim@example.com",
   *             "employeeNo": "EMP002",
   *             "forRole": "PRESIDENT",
   *             "recommendationCount": 15,
   *             "reasonSamples": [
   *               "리더십이 뛰어남",
   *               "책임감이 강함",
   *               "소통 능력이 우수함"
   *             ]
   *           },
   *           {
   *             "candidateId": "uuid",
   *             "userId": "uuid",
   *             "name": "이영희",
   *             "email": "lee@example.com",
   *             "employeeNo": "EMP003",
   *             "forRole": "PRESIDENT",
   *             "recommendationCount": 10,
   *             "reasonSamples": [
   *               "경험이 풍부함",
   *               "문제 해결 능력이 좋음"
   *             ]
   *           }
   *         ]
   *       },
   *       {
   *         "role": "TREASURER",
   *         "totalRecommendations": 20,
   *         "candidates": [...]
   *       }
   *     ]
   *   }
   * }
   *
   * Error Response (404):
   * {
   *   "success": false,
   *   "error": {
   *     "code": "ELECTION_NOT_FOUND",
   *     "message": "선거를 찾을 수 없습니다."
   *   }
   * }
   */
  @Roles('ADMIN')
  @Get()
  @HttpCode(HttpStatus.OK)
  async getRecommendationStats(@Param('electionId') electionId: string) {
    const result = await this.recommendService.getRecommendationStats(electionId);
    return BaseResponseDto.success(result);
  }
}
