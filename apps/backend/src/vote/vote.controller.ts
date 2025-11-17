import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  ParseUUIDPipe,
} from '@nestjs/common';
import { VoteService } from './vote.service';
import { BaseResponseDto } from '../common/dto/base-response.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import {
  CreateVoteDto,
  VoteStatusResponseDto,
  ResultSummaryResponseDto,
  ResultDetailResponseDto,
} from './dto';

/**
 * 투표 컨트롤러
 *
 * 투표 관련 엔드포인트 제공:
 * - 투표 상태 조회
 * - 투표 생성
 * - 결과 요약 조회
 * - 상세 결과 조회 (관리자/감사)
 */
@Controller('elections')
export class VoteController {
  constructor(private readonly voteService: VoteService) {}

  /**
   * 투표 상태 조회
   *
   * 사용자가 어떤 역할에 투표했는지 확인합니다.
   * 투표한 후보는 노출하지 않습니다 (익명성 보장).
   *
   * @param electionId - 선거 ID
   * @param userId - 현재 사용자 ID (JWT에서 추출)
   * @returns 역할별 투표 상태
   */
  @Get(':electionId/vote-status')
  async getVoteStatus(
    @Param('electionId', ParseUUIDPipe) electionId: string,
    @CurrentUser('userId') userId: string,
  ): Promise<BaseResponseDto<VoteStatusResponseDto>> {
    const result = await this.voteService.getVoteStatus(electionId, userId);
    return BaseResponseDto.success(result);
  }

  /**
   * 투표 생성
   *
   * 여러 역할에 대해 동시에 투표합니다.
   * 각 역할별로 후보 ID를 지정할 수 있습니다.
   *
   * @param electionId - 선거 ID
   * @param userId - 투표자 ID (JWT에서 추출)
   * @param dto - 투표 정보 (역할별 후보 ID)
   * @returns 투표 완료 메시지
   */
  @Post(':electionId/votes')
  async createVotes(
    @Param('electionId', ParseUUIDPipe) electionId: string,
    @CurrentUser('userId') userId: string,
    @Body() dto: CreateVoteDto,
  ): Promise<BaseResponseDto<{ message: string; votedRoles: string[] }>> {
    const result = await this.voteService.createVotes(electionId, userId, dto);
    return BaseResponseDto.success(result);
  }

  /**
   * 결과 요약 조회
   *
   * 간단한 결과 요약을 반환합니다.
   * 모든 회원이 볼 수 있습니다.
   *
   * @param electionId - 선거 ID
   * @returns 결과 요약 (당선자, 투표율 등)
   */
  @Get(':electionId/result-summary')
  async getResultSummary(
    @Param('electionId', ParseUUIDPipe) electionId: string,
  ): Promise<BaseResponseDto<ResultSummaryResponseDto>> {
    const result = await this.voteService.getResultSummary(electionId);
    return BaseResponseDto.success(result);
  }

  /**
   * 상세 결과 조회
   *
   * 후보별 득표 수 등 상세한 정보를 반환합니다.
   * 관리자와 감사만 볼 수 있습니다.
   *
   * @param electionId - 선거 ID
   * @returns 상세 결과 (후보별 득표 수, 득표율 등)
   */
  @Roles(UserRole.ADMIN, UserRole.AUDITOR)
  @Get(':electionId/result')
  async getResultDetail(
    @Param('electionId', ParseUUIDPipe) electionId: string,
  ): Promise<BaseResponseDto<ResultDetailResponseDto>> {
    const result = await this.voteService.getResultDetail(electionId);
    return BaseResponseDto.success(result);
  }
}
