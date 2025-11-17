import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Admin Service
 *
 * 관리자 대시보드 및 시스템 전체 통계
 */
@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 관리자 대시보드 전체 요약
   */
  async getDashboard() {
    const [
      userStats,
      electionStats,
      voteStats,
      recommendStats,
      candidateStats,
      recentActivity,
    ] = await Promise.all([
      this.getUserStats(),
      this.getElectionStats(),
      this.getVoteStats(),
      this.getRecommendationStats(),
      this.getCandidateStats(),
      this.getRecentActivity(),
    ]);

    return {
      users: userStats,
      elections: electionStats,
      votes: voteStats,
      recommendations: recommendStats,
      candidates: candidateStats,
      recentActivity,
    };
  }

  /**
   * 사용자 통계
   */
  async getUserStats() {
    const [total, active, byRole] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { isActive: true } }),
      this.prisma.user.groupBy({
        by: ['role'],
        _count: true,
      }),
    ]);

    return {
      total,
      active,
      inactive: total - active,
      byRole: byRole.map((r) => ({
        role: r.role,
        count: r._count,
      })),
    };
  }

  /**
   * 선거 통계
   */
  async getElectionStats() {
    const [total, byStatus, latest] = await Promise.all([
      this.prisma.electionRound.count(),
      this.prisma.electionRound.groupBy({
        by: ['status'],
        _count: true,
      }),
      this.prisma.electionRound.findFirst({
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          status: true,
          votingStartDate: true,
          votingEndDate: true,
        },
      }),
    ]);

    return {
      total,
      byStatus: byStatus.map((s) => ({
        status: s.status,
        count: s._count,
      })),
      latest,
    };
  }

  /**
   * 투표 통계
   */
  async getVoteStats() {
    const [total, byRole, recentElectionVotes] = await Promise.all([
      this.prisma.vote.count(),
      this.prisma.vote.groupBy({
        by: ['forRole'],
        _count: true,
      }),
      this.getRecentElectionVoteStats(),
    ]);

    return {
      total,
      byRole: byRole.map((r) => ({
        role: r.forRole,
        count: r._count,
      })),
      recentElection: recentElectionVotes,
    };
  }

  /**
   * 최근 선거 투표 통계
   */
  private async getRecentElectionVoteStats() {
    const latestElection = await this.prisma.electionRound.findFirst({
      orderBy: { createdAt: 'desc' },
    });

    if (!latestElection) {
      return null;
    }

    const [totalVotes, totalUsers, byRole] = await Promise.all([
      this.prisma.vote.count({
        where: { electionId: latestElection.id },
      }),
      this.prisma.user.count({ where: { isActive: true } }),
      this.prisma.vote.groupBy({
        by: ['forRole'],
        where: { electionId: latestElection.id },
        _count: true,
      }),
    ]);

    const participationRate =
      totalUsers > 0 ? (totalVotes / (totalUsers * 5)) * 100 : 0; // 5개 역할

    return {
      electionId: latestElection.id,
      electionName: latestElection.name,
      totalVotes,
      totalUsers,
      participationRate: Math.round(participationRate * 100) / 100,
      byRole: byRole.map((r) => ({
        role: r.forRole,
        count: r._count,
        rate:
          totalUsers > 0
            ? Math.round((r._count / totalUsers) * 100 * 100) / 100
            : 0,
      })),
    };
  }

  /**
   * 추천 통계
   */
  async getRecommendationStats() {
    const [total, byRole] = await Promise.all([
      this.prisma.recommendation.count(),
      this.prisma.recommendation.groupBy({
        by: ['forRole'],
        _count: true,
      }),
    ]);

    return {
      total,
      byRole: byRole.map((r) => ({
        role: r.forRole,
        count: r._count,
      })),
    };
  }

  /**
   * 후보 통계
   */
  async getCandidateStats() {
    const [total, byStatus, byRole] = await Promise.all([
      this.prisma.candidate.count(),
      this.prisma.candidate.groupBy({
        by: ['status'],
        _count: true,
      }),
      this.prisma.candidate.groupBy({
        by: ['forRole'],
        _count: true,
      }),
    ]);

    return {
      total,
      byStatus: byStatus.map((s) => ({
        status: s.status,
        count: s._count,
      })),
      byRole: byRole.map((r) => ({
        role: r.forRole,
        count: r._count,
      })),
    };
  }

  /**
   * 최근 활동
   */
  async getRecentActivity() {
    const [recentVotes, recentRecommendations, recentCandidates] =
      await Promise.all([
        this.prisma.vote.findMany({
          take: 5,
          orderBy: { createdAt: 'desc' },
          include: {
            voter: {
              select: { id: true, name: true, employeeNo: true },
            },
            election: {
              select: { id: true, name: true },
            },
          },
        }),
        this.prisma.recommendation.findMany({
          take: 5,
          orderBy: { createdAt: 'desc' },
          include: {
            recommender: {
              select: { id: true, name: true, employeeNo: true },
            },
            election: {
              select: { id: true, name: true },
            },
          },
        }),
        this.prisma.candidate.findMany({
          take: 5,
          orderBy: { createdAt: 'desc' },
          include: {
            user: {
              select: { id: true, name: true, employeeNo: true },
            },
            election: {
              select: { id: true, name: true },
            },
          },
        }),
      ]);

    return {
      recentVotes: recentVotes.map((v) => ({
        id: v.id,
        voter: v.voter,
        election: v.election,
        forRole: v.forRole,
        createdAt: v.createdAt,
      })),
      recentRecommendations: recentRecommendations.map((r) => ({
        id: r.id,
        recommender: r.recommender,
        election: r.election,
        forRole: r.forRole,
        createdAt: r.createdAt,
      })),
      recentCandidates: recentCandidates.map((c) => ({
        id: c.id,
        user: c.user,
        election: c.election,
        forRole: c.forRole,
        status: c.status,
        createdAt: c.createdAt,
      })),
    };
  }

  /**
   * 선거별 상세 통계
   */
  async getElectionDetailStats(electionId: string) {
    const election = await this.prisma.electionRound.findUnique({
      where: { id: electionId },
    });

    if (!election) {
      return null;
    }

    const [
      totalVotes,
      totalRecommendations,
      totalCandidates,
      totalUsers,
      votesByRole,
      candidatesByRole,
    ] = await Promise.all([
      this.prisma.vote.count({ where: { electionId } }),
      this.prisma.recommendation.count({ where: { electionId } }),
      this.prisma.candidate.count({ where: { electionId } }),
      this.prisma.user.count({ where: { isActive: true } }),
      this.prisma.vote.groupBy({
        by: ['forRole'],
        where: { electionId },
        _count: true,
      }),
      this.prisma.candidate.findMany({
        where: {
          electionId,
          status: 'APPROVED',
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              employeeNo: true,
              department: true,
            },
          },
          _count: {
            select: {
              votes: true,
              recommendations: true,
            },
          },
        },
        orderBy: {
          voteCount: 'desc',
        },
      }),
    ]);

    const participationRate =
      totalUsers > 0 ? (totalVotes / (totalUsers * 5)) * 100 : 0;

    return {
      election: {
        id: election.id,
        name: election.name,
        status: election.status,
        votingStartDate: election.votingStartDate,
        votingEndDate: election.votingEndDate,
      },
      summary: {
        totalVotes,
        totalRecommendations,
        totalCandidates,
        totalUsers,
        participationRate: Math.round(participationRate * 100) / 100,
      },
      votesByRole: votesByRole.map((v) => ({
        role: v.forRole,
        count: v._count,
        rate:
          totalUsers > 0
            ? Math.round((v._count / totalUsers) * 100 * 100) / 100
            : 0,
      })),
      candidates: candidatesByRole.map((c) => ({
        id: c.id,
        user: c.user,
        forRole: c.forRole,
        voteCount: c.voteCount,
        recommendationCount: c._count.recommendations,
      })),
    };
  }
}
