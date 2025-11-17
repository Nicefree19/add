import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard, RolesGuard, Roles } from '../common';

/**
 * Admin Controller
 *
 * 관리자 전용 API
 */
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'AUDITOR')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  /**
   * 관리자 대시보드
   *
   * GET /admin/dashboard
   */
  @Get('dashboard')
  async getDashboard() {
    return this.adminService.getDashboard();
  }

  /**
   * 사용자 통계
   *
   * GET /admin/stats/users
   */
  @Get('stats/users')
  async getUserStats() {
    return this.adminService.getUserStats();
  }

  /**
   * 선거 통계
   *
   * GET /admin/stats/elections
   */
  @Get('stats/elections')
  async getElectionStats() {
    return this.adminService.getElectionStats();
  }

  /**
   * 투표 통계
   *
   * GET /admin/stats/votes
   */
  @Get('stats/votes')
  async getVoteStats() {
    return this.adminService.getVoteStats();
  }

  /**
   * 추천 통계
   *
   * GET /admin/stats/recommendations
   */
  @Get('stats/recommendations')
  async getRecommendationStats() {
    return this.adminService.getRecommendationStats();
  }

  /**
   * 후보 통계
   *
   * GET /admin/stats/candidates
   */
  @Get('stats/candidates')
  async getCandidateStats() {
    return this.adminService.getCandidateStats();
  }

  /**
   * 선거별 상세 통계
   *
   * GET /admin/elections/:id/stats
   */
  @Get('elections/:id/stats')
  async getElectionDetailStats(@Param('id') electionId: string) {
    return this.adminService.getElectionDetailStats(electionId);
  }
}
