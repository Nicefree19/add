import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { CandidateService } from './candidate.service';
import { CreateCandidatesDto, UpdateCandidateStatusDto } from './dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { BaseResponseDto } from '../common/dto/base-response.dto';

/**
 * 후보 컨트롤러
 *
 * 후보 관리 및 초대 수락/거절 엔드포인트 제공
 *
 * 제공하는 API:
 * - GET /elections/:id/candidates: 후보 목록 조회 (ACCEPTED만 - 회원용)
 * - GET /elections/:id/candidates/admin: 전체 후보 목록 조회 (관리자용)
 * - POST /elections/:id/candidates: 후보 생성 (관리자용)
 * - PATCH /candidates/:id/status: 후보 상태 변경 (후보 본인)
 */
@Controller()
export class CandidateController {
  constructor(private readonly candidateService: CandidateService) {}

  /**
   * 후보 목록 조회 (회원용)
   *
   * ACCEPTED 상태의 후보만 반환합니다.
   * 회원들이 투표할 수 있는 후보 목록입니다.
   *
   * @route GET /elections/:id/candidates
   * @access Authenticated (JWT Required)
   *
   * @param electionId - 선거 ID
   * @returns ACCEPTED 상태의 후보 목록
   *
   * @example
   * Request:
   * GET /elections/uuid/candidates
   * Authorization: Bearer {accessToken}
   *
   * Response (200):
   * {
   *   "success": true,
   *   "data": [
   *     {
   *       "id": "uuid",
   *       "userId": "uuid",
   *       "electionId": "uuid",
   *       "forRole": "PRESIDENT",
   *       "statement": "열심히 하겠습니다.",
   *       "status": "ACCEPTED",
   *       "voteCount": 0,
   *       "createdAt": "2024-01-20T00:00:00Z",
   *       "updatedAt": "2024-01-25T00:00:00Z",
   *       "user": {
   *         "id": "uuid",
   *         "name": "김철수",
   *         "email": "kim@example.com",
   *         "employeeNo": "EMP002",
   *         "department": "개발팀",
   *         "position": "대리"
   *       },
   *       "recommendationCount": 15
   *     }
   *   ]
   * }
   */
  @Get('elections/:electionId/candidates')
  @HttpCode(HttpStatus.OK)
  async getCandidates(@Param('electionId') electionId: string) {
    const result = await this.candidateService.getCandidates(electionId);
    return BaseResponseDto.success(result);
  }

  /**
   * 전체 후보 목록 조회 (관리자용)
   *
   * 모든 상태의 후보를 반환합니다.
   *
   * @route GET /elections/:id/candidates/admin
   * @access Admin Only
   *
   * @param electionId - 선거 ID
   * @returns 모든 후보 목록
   *
   * @example
   * Request:
   * GET /elections/uuid/candidates/admin
   * Authorization: Bearer {adminAccessToken}
   *
   * Response (200):
   * {
   *   "success": true,
   *   "data": [
   *     {
   *       "id": "uuid",
   *       "userId": "uuid",
   *       "electionId": "uuid",
   *       "forRole": "PRESIDENT",
   *       "statement": "열심히 하겠습니다.",
   *       "status": "ACCEPTED",
   *       "voteCount": 0,
   *       "user": {...},
   *       "recommendationCount": 15
   *     },
   *     {
   *       "id": "uuid",
   *       "userId": "uuid",
   *       "electionId": "uuid",
   *       "forRole": "PRESIDENT",
   *       "statement": null,
   *       "status": "INVITED",
   *       "voteCount": 0,
   *       "user": {...},
   *       "recommendationCount": 10
   *     },
   *     {
   *       "id": "uuid",
   *       "userId": "uuid",
   *       "electionId": "uuid",
   *       "forRole": "PRESIDENT",
   *       "statement": null,
   *       "status": "DECLINED",
   *       "voteCount": 0,
   *       "user": {...},
   *       "recommendationCount": 8
   *     }
   *   ]
   * }
   */
  @Roles('ADMIN')
  @Get('elections/:electionId/candidates/admin')
  @HttpCode(HttpStatus.OK)
  async getAllCandidates(@Param('electionId') electionId: string) {
    const result = await this.candidateService.getAllCandidates(electionId);
    return BaseResponseDto.success(result);
  }

  /**
   * 후보 생성 (관리자용)
   *
   * 추천 상위 N명을 후보로 지정합니다.
   * PENDING 상태의 후보를 INVITED 상태로 변경합니다.
   *
   * @route POST /elections/:id/candidates
   * @access Admin Only
   *
   * @param electionId - 선거 ID
   * @param dto - 후보 생성 정보 (역할, 상위 N명)
   * @returns 생성된 후보 목록
   *
   * @example
   * Request:
   * POST /elections/uuid/candidates
   * Authorization: Bearer {adminAccessToken}
   * {
   *   "forRole": "PRESIDENT",
   *   "topN": 3
   * }
   *
   * Response (201):
   * {
   *   "success": true,
   *   "data": [
   *     {
   *       "id": "uuid",
   *       "userId": "uuid",
   *       "electionId": "uuid",
   *       "forRole": "PRESIDENT",
   *       "statement": null,
   *       "status": "INVITED",
   *       "voteCount": 0,
   *       "user": {...},
   *       "recommendationCount": 15
   *     },
   *     {...}
   *   ]
   * }
   *
   * Error Response (404):
   * {
   *   "success": false,
   *   "error": {
   *     "code": "CANDIDATE_NOT_FOUND",
   *     "message": "추천 데이터가 없어 후보를 생성할 수 없습니다."
   *   }
   * }
   */
  @Roles('ADMIN')
  @Post('elections/:electionId/candidates')
  @HttpCode(HttpStatus.CREATED)
  async createCandidates(
    @Param('electionId') electionId: string,
    @Body() dto: CreateCandidatesDto,
  ) {
    const result = await this.candidateService.createCandidates(electionId, dto);
    return BaseResponseDto.success(result);
  }

  /**
   * 후보 상태 변경 (후보 본인)
   *
   * 후보가 초대를 수락하거나 거절합니다.
   * INVITED → ACCEPTED 또는 DECLINED
   *
   * @route PATCH /candidates/:id/status
   * @access Authenticated (후보 본인만)
   *
   * @param candidateId - 후보 ID
   * @param userId - 현재 사용자 ID (JWT에서 추출)
   * @param dto - 변경할 상태 정보
   * @returns 업데이트된 후보 정보
   *
   * @example
   * Request:
   * PATCH /candidates/uuid/status
   * Authorization: Bearer {accessToken}
   * {
   *   "status": "ACCEPTED",
   *   "statement": "열심히 하겠습니다."
   * }
   *
   * Response (200):
   * {
   *   "success": true,
   *   "data": {
   *     "id": "uuid",
   *     "userId": "uuid",
   *     "electionId": "uuid",
   *     "forRole": "PRESIDENT",
   *     "statement": "열심히 하겠습니다.",
   *     "status": "ACCEPTED",
   *     "voteCount": 0,
   *     "user": {...},
   *     "recommendationCount": 15
   *   }
   * }
   *
   * Error Response (403):
   * {
   *   "success": false,
   *   "error": {
   *     "code": "AUTH_FORBIDDEN",
   *     "message": "본인의 후보 상태만 변경할 수 있습니다."
   *   }
   * }
   *
   * Error Response (400):
   * {
   *   "success": false,
   *   "error": {
   *     "code": "CANDIDATE_INVALID_STATUS",
   *     "message": "INVITED 상태의 후보만 응답할 수 있습니다."
   *   }
   * }
   */
  @Patch('candidates/:candidateId/status')
  @HttpCode(HttpStatus.OK)
  async updateCandidateStatus(
    @Param('candidateId') candidateId: string,
    @CurrentUser('userId') userId: string,
    @Body() dto: UpdateCandidateStatusDto,
  ) {
    const result = await this.candidateService.updateCandidateStatus(
      candidateId,
      userId,
      dto,
    );
    return BaseResponseDto.success(result);
  }
}
