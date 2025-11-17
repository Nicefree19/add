import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ElectionService } from './election.service';
import {
  CreateElectionDto,
  UpdateElectionDto,
  UpdateElectionStatusDto,
  ElectionListQueryDto,
} from './dto';
import { Roles } from '../common/decorators/roles.decorator';
import { BaseResponseDto } from '../common/dto/base-response.dto';

/**
 * 선거 컨트롤러
 *
 * 선거 회차 생성, 조회, 수정 및 상태 관리 엔드포인트 제공
 *
 * 제공하는 API:
 * - GET /elections: 선거 목록 조회 (MEMBER도 가능)
 * - GET /elections/:id: 선거 상세 조회 (MEMBER도 가능)
 * - POST /elections: 선거 생성 (관리자 전용)
 * - PATCH /elections/:id: 선거 정보 수정 (관리자 전용)
 * - PATCH /elections/:id/status: 선거 상태 변경 (관리자 전용)
 */
@Controller('elections')
export class ElectionController {
  constructor(private readonly electionService: ElectionService) {}

  /**
   * 선거 목록 조회
   *
   * 모든 선거 목록을 페이지네이션하여 반환합니다.
   * 상태로 필터링할 수 있습니다.
   * MEMBER도 조회 가능합니다.
   *
   * @route GET /elections
   * @access Authenticated (JWT Required)
   *
   * @param query - 조회 옵션 (페이지, 필터 등)
   * @returns 페이지네이션된 선거 목록
   *
   * @example
   * Request:
   * GET /elections?page=1&limit=20&status=VOTING
   * Authorization: Bearer {accessToken}
   *
   * Response (200):
   * {
   *   "success": true,
   *   "data": {
   *     "items": [
   *       {
   *         "id": "uuid",
   *         "name": "2024년 제1차 사우회 임원 선거",
   *         "description": "2024년도 사우회 임원 선출",
   *         "status": "VOTING",
   *         "recommendationStartDate": "2024-01-15T00:00:00Z",
   *         "recommendationEndDate": "2024-01-31T23:59:59Z",
   *         "votingStartDate": "2024-02-05T00:00:00Z",
   *         "votingEndDate": "2024-02-10T23:59:59Z",
   *         "maxRecommendations": 3,
   *         "isActive": true,
   *         "createdAt": "2024-01-01T00:00:00Z",
   *         "updatedAt": "2024-01-01T00:00:00Z",
   *         "candidateCount": 10,
   *         "recommendationCount": 50,
   *         "voteCount": 100
   *       }
   *     ],
   *     "meta": {
   *       "total": 5,
   *       "page": 1,
   *       "limit": 20,
   *       "totalPages": 1,
   *       "hasNext": false,
   *       "hasPrev": false
   *     }
   *   }
   * }
   */
  @Get()
  @HttpCode(HttpStatus.OK)
  async getElections(@Query() query: ElectionListQueryDto) {
    const result = await this.electionService.findAll(query);
    return BaseResponseDto.success(result);
  }

  /**
   * 선거 상세 조회
   *
   * 특정 선거의 상세 정보를 반환합니다.
   * MEMBER도 조회 가능합니다.
   *
   * @route GET /elections/:id
   * @access Authenticated (JWT Required)
   *
   * @param id - 선거 ID
   * @returns 선거 상세 정보
   *
   * @example
   * Request:
   * GET /elections/uuid
   * Authorization: Bearer {accessToken}
   *
   * Response (200):
   * {
   *   "success": true,
   *   "data": {
   *     "id": "uuid",
   *     "name": "2024년 제1차 사우회 임원 선거",
   *     "description": "2024년도 사우회 임원 선출",
   *     "status": "VOTING",
   *     ...
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
  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async getElection(@Param('id') id: string) {
    const result = await this.electionService.findOne(id);
    return BaseResponseDto.success(result);
  }

  /**
   * 선거 생성
   *
   * 새로운 선거 회차를 생성합니다.
   *
   * @route POST /elections
   * @access Admin Only
   *
   * @param dto - 선거 생성 정보
   * @returns 생성된 선거 정보
   *
   * @example
   * Request:
   * POST /elections
   * Authorization: Bearer {adminAccessToken}
   * {
   *   "name": "2024년 제1차 사우회 임원 선거",
   *   "description": "2024년도 사우회 임원 선출을 위한 선거",
   *   "recommendationStartDate": "2024-01-15T00:00:00Z",
   *   "recommendationEndDate": "2024-01-31T23:59:59Z",
   *   "votingStartDate": "2024-02-05T00:00:00Z",
   *   "votingEndDate": "2024-02-10T23:59:59Z",
   *   "maxRecommendations": 3
   * }
   *
   * Response (201):
   * {
   *   "success": true,
   *   "data": {
   *     "id": "uuid",
   *     "name": "2024년 제1차 사우회 임원 선거",
   *     "status": "PLANNING",
   *     ...
   *   }
   * }
   *
   * Error Response (400):
   * {
   *   "success": false,
   *   "error": {
   *     "code": "ELECTION_INVALID_DATE_RANGE",
   *     "message": "유효하지 않은 날짜 범위입니다."
   *   }
   * }
   */
  @Roles('ADMIN')
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createElection(@Body() dto: CreateElectionDto) {
    const result = await this.electionService.create(dto);
    return BaseResponseDto.success(result);
  }

  /**
   * 선거 정보 수정
   *
   * 선거의 기본 정보를 수정합니다.
   *
   * @route PATCH /elections/:id
   * @access Admin Only
   *
   * @param id - 선거 ID
   * @param dto - 수정할 정보
   * @returns 수정된 선거 정보
   *
   * @example
   * Request:
   * PATCH /elections/uuid
   * Authorization: Bearer {adminAccessToken}
   * {
   *   "name": "2024년 제1차 사우회 임원 선거 (수정)",
   *   "maxRecommendations": 5
   * }
   *
   * Response (200):
   * {
   *   "success": true,
   *   "data": {
   *     "id": "uuid",
   *     "name": "2024년 제1차 사우회 임원 선거 (수정)",
   *     "maxRecommendations": 5,
   *     ...
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
  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  async updateElection(@Param('id') id: string, @Body() dto: UpdateElectionDto) {
    const result = await this.electionService.update(id, dto);
    return BaseResponseDto.success(result);
  }

  /**
   * 선거 상태 변경
   *
   * 선거의 상태를 변경합니다.
   * 상태 전이 규칙을 적용합니다: PLANNING → RECOMMEND → CANDIDATE_CONFIRM → VOTING → CLOSED
   *
   * @route PATCH /elections/:id/status
   * @access Admin Only
   *
   * @param id - 선거 ID
   * @param dto - 변경할 상태 정보
   * @returns 수정된 선거 정보
   *
   * @example
   * Request:
   * PATCH /elections/uuid/status
   * Authorization: Bearer {adminAccessToken}
   * {
   *   "status": "RECOMMEND"
   * }
   *
   * Response (200):
   * {
   *   "success": true,
   *   "data": {
   *     "id": "uuid",
   *     "status": "RECOMMEND",
   *     ...
   *   }
   * }
   *
   * Error Response (400):
   * {
   *   "success": false,
   *   "error": {
   *     "code": "ELECTION_INVALID_STATUS_TRANSITION",
   *     "message": "PLANNING에서 VOTING로의 상태 전이는 허용되지 않습니다."
   *   }
   * }
   */
  @Roles('ADMIN')
  @Patch(':id/status')
  @HttpCode(HttpStatus.OK)
  async updateElectionStatus(
    @Param('id') id: string,
    @Body() dto: UpdateElectionStatusDto,
  ) {
    const result = await this.electionService.updateStatus(id, dto);
    return BaseResponseDto.success(result);
  }
}
