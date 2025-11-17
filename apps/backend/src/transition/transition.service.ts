import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTransitionDocDto } from './dto/create-transition-doc.dto';
import { UpdateTransitionStatusDto } from './dto/update-transition-status.dto';
import { BusinessException, ErrorCode } from '../common';

/**
 * Transition Service
 *
 * 인수인계 문서 관리
 */
@Injectable()
export class TransitionService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 인수인계 문서 생성
   */
  async createTransitionDoc(electionId: string, dto: CreateTransitionDocDto) {
    // 선거 존재 확인
    const election = await this.prisma.electionRound.findUnique({
      where: { id: electionId },
    });

    if (!election) {
      throw new BusinessException(ErrorCode.ELECTION_NOT_FOUND);
    }

    // 인수/인계자 확인
    const [fromUser, toUser] = await Promise.all([
      this.prisma.user.findUnique({ where: { id: dto.fromUserId } }),
      this.prisma.user.findUnique({ where: { id: dto.toUserId } }),
    ]);

    if (!fromUser) {
      throw new BusinessException(
        ErrorCode.USER_NOT_FOUND,
        '인계자를 찾을 수 없습니다.',
      );
    }

    if (!toUser) {
      throw new BusinessException(
        ErrorCode.USER_NOT_FOUND,
        '인수자를 찾을 수 없습니다.',
      );
    }

    // 인수인계 문서 생성
    return this.prisma.transitionDoc.create({
      data: {
        electionId,
        fromUserId: dto.fromUserId,
        toUserId: dto.toUserId,
        forRole: dto.forRole as any,
        title: dto.title,
        content: dto.content,
        attachments: dto.attachments ? JSON.stringify(dto.attachments) : null,
        isCompleted: false,
      },
      include: {
        fromUser: {
          select: {
            id: true,
            name: true,
            employeeNo: true,
            email: true,
          },
        },
        toUser: {
          select: {
            id: true,
            name: true,
            employeeNo: true,
            email: true,
          },
        },
        election: {
          select: {
            id: true,
            name: true,
            status: true,
          },
        },
      },
    });
  }

  /**
   * 선거별 인수인계 문서 목록 조회
   */
  async getTransitionDocsByElection(electionId: string) {
    // 선거 존재 확인
    const election = await this.prisma.electionRound.findUnique({
      where: { id: electionId },
    });

    if (!election) {
      throw new BusinessException(ErrorCode.ELECTION_NOT_FOUND);
    }

    const docs = await this.prisma.transitionDoc.findMany({
      where: { electionId },
      orderBy: { createdAt: 'desc' },
      include: {
        fromUser: {
          select: {
            id: true,
            name: true,
            employeeNo: true,
            email: true,
          },
        },
        toUser: {
          select: {
            id: true,
            name: true,
            employeeNo: true,
            email: true,
          },
        },
      },
    });

    return {
      election: {
        id: election.id,
        name: election.name,
        status: election.status,
      },
      docs,
      summary: {
        total: docs.length,
        completed: docs.filter((d) => d.isCompleted).length,
        pending: docs.filter((d) => !d.isCompleted).length,
      },
    };
  }

  /**
   * 특정 인수인계 문서 조회
   */
  async getTransitionDoc(docId: string) {
    const doc = await this.prisma.transitionDoc.findUnique({
      where: { id: docId },
      include: {
        fromUser: {
          select: {
            id: true,
            name: true,
            employeeNo: true,
            email: true,
            department: true,
            position: true,
          },
        },
        toUser: {
          select: {
            id: true,
            name: true,
            employeeNo: true,
            email: true,
            department: true,
            position: true,
          },
        },
        election: {
          select: {
            id: true,
            name: true,
            status: true,
          },
        },
      },
    });

    if (!doc) {
      throw new BusinessException(
        ErrorCode.SYSTEM_NOT_FOUND,
        '인수인계 문서를 찾을 수 없습니다.',
      );
    }

    return doc;
  }

  /**
   * 인수인계 문서 상태 업데이트
   */
  async updateTransitionStatus(docId: string, dto: UpdateTransitionStatusDto) {
    const doc = await this.prisma.transitionDoc.findUnique({
      where: { id: docId },
    });

    if (!doc) {
      throw new BusinessException(
        ErrorCode.SYSTEM_NOT_FOUND,
        '인수인계 문서를 찾을 수 없습니다.',
      );
    }

    return this.prisma.transitionDoc.update({
      where: { id: docId },
      data: {
        isCompleted: dto.isCompleted ?? doc.isCompleted,
        completedAt: dto.isCompleted ? new Date() : null,
      },
      include: {
        fromUser: {
          select: {
            id: true,
            name: true,
            employeeNo: true,
          },
        },
        toUser: {
          select: {
            id: true,
            name: true,
            employeeNo: true,
          },
        },
      },
    });
  }

  /**
   * 내가 관련된 인수인계 문서 목록
   */
  async getMyTransitionDocs(userId: string) {
    const docs = await this.prisma.transitionDoc.findMany({
      where: {
        OR: [{ fromUserId: userId }, { toUserId: userId }],
      },
      orderBy: { createdAt: 'desc' },
      include: {
        fromUser: {
          select: {
            id: true,
            name: true,
            employeeNo: true,
          },
        },
        toUser: {
          select: {
            id: true,
            name: true,
            employeeNo: true,
          },
        },
        election: {
          select: {
            id: true,
            name: true,
            status: true,
          },
        },
      },
    });

    return {
      asFrom: docs.filter((d) => d.fromUserId === userId),
      asTo: docs.filter((d) => d.toUserId === userId),
      summary: {
        total: docs.length,
        asFromCount: docs.filter((d) => d.fromUserId === userId).length,
        asToCount: docs.filter((d) => d.toUserId === userId).length,
        completedCount: docs.filter((d) => d.isCompleted).length,
      },
    };
  }
}
