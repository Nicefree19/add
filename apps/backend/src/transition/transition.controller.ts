import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { TransitionService } from './transition.service';
import { CreateTransitionDocDto, UpdateTransitionStatusDto } from './dto';
import {
  JwtAuthGuard,
  RolesGuard,
  Roles,
  CurrentUser,
  CurrentUserPayload,
} from '../common';

/**
 * Transition Controller
 *
 * 인수인계 문서 관리 API
 */
@Controller('elections')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TransitionController {
  constructor(private readonly transitionService: TransitionService) {}

  /**
   * 인수인계 문서 생성 (ADMIN only)
   *
   * POST /elections/:id/transition-docs
   */
  @Post(':id/transition-docs')
  @Roles('ADMIN')
  async createTransitionDoc(
    @Param('id') electionId: string,
    @Body() dto: CreateTransitionDocDto,
  ) {
    return this.transitionService.createTransitionDoc(electionId, dto);
  }

  /**
   * 선거별 인수인계 문서 목록 조회 (ADMIN/AUDITOR)
   *
   * GET /elections/:id/transition-docs
   */
  @Get(':id/transition-docs')
  @Roles('ADMIN', 'AUDITOR')
  async getTransitionDocs(@Param('id') electionId: string) {
    return this.transitionService.getTransitionDocsByElection(electionId);
  }

  /**
   * 특정 인수인계 문서 조회
   *
   * GET /transition-docs/:docId
   */
  @Get('/transition-docs/:docId')
  async getTransitionDoc(@Param('docId') docId: string) {
    return this.transitionService.getTransitionDoc(docId);
  }

  /**
   * 인수인계 문서 상태 업데이트 (ADMIN only)
   *
   * PATCH /transition-docs/:docId/status
   */
  @Patch('/transition-docs/:docId/status')
  @Roles('ADMIN')
  async updateTransitionStatus(
    @Param('docId') docId: string,
    @Body() dto: UpdateTransitionStatusDto,
  ) {
    return this.transitionService.updateTransitionStatus(docId, dto);
  }

  /**
   * 내가 관련된 인수인계 문서 목록
   *
   * GET /transition-docs/me
   */
  @Get('/transition-docs/me')
  async getMyTransitionDocs(@CurrentUser() user: CurrentUserPayload) {
    return this.transitionService.getMyTransitionDocs(user.userId);
  }
}
