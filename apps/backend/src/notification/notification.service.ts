import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SendNotificationDto } from './dto/send-notification.dto';
import { QueryNotificationLogsDto } from './dto/query-notification-logs.dto';
import { PaginationHelper } from '../common/dto/pagination.dto';

/**
 * Notification Service
 *
 * 알림 발송 및 로그 관리
 */
@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * 알림 발송 (stub)
   *
   * 실제 이메일/SMS 발송은 구현하지 않고,
   * NotificationLog에만 기록
   */
  async sendNotification(dto: SendNotificationDto) {
    this.logger.log(
      `Sending notification to ${dto.userIds.length} users: ${dto.title}`,
    );

    // TODO: 실제 알림 발송 로직 (이메일, SMS, 푸시 등)
    // - Email Service 호출
    // - SMS Service 호출
    // - Push Notification Service 호출

    // NotificationLog에 기록
    const notifications = await Promise.all(
      dto.userIds.map(async (userId) => {
        // 사용자 존재 확인
        const user = await this.prisma.user.findUnique({
          where: { id: userId },
        });

        if (!user) {
          this.logger.warn(`User not found: ${userId}`);
          return null;
        }

        return this.prisma.notificationLog.create({
          data: {
            userId,
            type: dto.type,
            title: dto.title,
            message: dto.message,
            metadata: dto.metadata ? JSON.stringify(dto.metadata) : null,
            isRead: false,
            sentAt: new Date(),
          },
        });
      }),
    );

    const successCount = notifications.filter((n) => n !== null).length;
    const failCount = dto.userIds.length - successCount;

    this.logger.log(
      `Notification sent: ${successCount} success, ${failCount} failed`,
    );

    return {
      total: dto.userIds.length,
      success: successCount,
      failed: failCount,
      notifications: notifications.filter((n) => n !== null),
    };
  }

  /**
   * 알림 로그 조회 (페이지네이션)
   */
  async getNotificationLogs(query: QueryNotificationLogsDto) {
    const { page = 1, limit = 10, userId, type, isRead } = query;

    // WHERE 조건 구성
    const where: any = {};
    if (userId) where.userId = userId;
    if (type) where.type = type;
    if (typeof isRead === 'boolean') where.isRead = isRead;

    // 페이지네이션 파라미터
    const { skip, take } = PaginationHelper.getPrismaParams(page, limit);

    // 데이터 조회
    const [logs, total] = await Promise.all([
      this.prisma.notificationLog.findMany({
        where,
        skip,
        take,
        orderBy: { sentAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              employeeNo: true,
            },
          },
        },
      }),
      this.prisma.notificationLog.count({ where }),
    ]);

    return PaginationHelper.createResponse(logs, total, page, limit);
  }

  /**
   * 특정 사용자의 알림 목록 조회
   */
  async getUserNotifications(userId: string, page = 1, limit = 20) {
    const { skip, take } = PaginationHelper.getPrismaParams(page, limit);

    const [notifications, total] = await Promise.all([
      this.prisma.notificationLog.findMany({
        where: { userId },
        skip,
        take,
        orderBy: { sentAt: 'desc' },
      }),
      this.prisma.notificationLog.count({ where: { userId } }),
    ]);

    const unreadCount = await this.prisma.notificationLog.count({
      where: { userId, isRead: false },
    });

    return {
      ...PaginationHelper.createResponse(notifications, total, page, limit),
      unreadCount,
    };
  }

  /**
   * 알림 읽음 처리
   */
  async markAsRead(notificationId: string, userId: string) {
    const notification = await this.prisma.notificationLog.findFirst({
      where: {
        id: notificationId,
        userId,
      },
    });

    if (!notification) {
      return null;
    }

    return this.prisma.notificationLog.update({
      where: { id: notificationId },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });
  }

  /**
   * 모든 알림 읽음 처리
   */
  async markAllAsRead(userId: string) {
    const result = await this.prisma.notificationLog.updateMany({
      where: {
        userId,
        isRead: false,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    return {
      updatedCount: result.count,
    };
  }
}
