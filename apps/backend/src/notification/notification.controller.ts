import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Query,
  Param,
  UseGuards,
} from '@nestjs/common';
import { NotificationService } from './notification.service';
import { SendNotificationDto, QueryNotificationLogsDto } from './dto';
import {
  JwtAuthGuard,
  RolesGuard,
  Roles,
  CurrentUser,
  CurrentUserPayload,
} from '../common';

/**
 * Notification Controller
 *
 * 알림 발송 및 관리 API
 */
@Controller('notifications')
@UseGuards(JwtAuthGuard, RolesGuard)
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  /**
   * 알림 발송 (ADMIN only)
   *
   * POST /notifications/send
   */
  @Post('send')
  @Roles('ADMIN')
  async sendNotification(@Body() dto: SendNotificationDto) {
    return this.notificationService.sendNotification(dto);
  }

  /**
   * 알림 로그 조회 (ADMIN/AUDITOR)
   *
   * GET /notifications/logs
   */
  @Get('logs')
  @Roles('ADMIN', 'AUDITOR')
  async getNotificationLogs(@Query() query: QueryNotificationLogsDto) {
    return this.notificationService.getNotificationLogs(query);
  }

  /**
   * 내 알림 목록 조회
   *
   * GET /notifications/me
   */
  @Get('me')
  async getMyNotifications(
    @CurrentUser() user: CurrentUserPayload,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.notificationService.getUserNotifications(
      user.userId,
      page,
      limit,
    );
  }

  /**
   * 알림 읽음 처리
   *
   * PATCH /notifications/:id/read
   */
  @Patch(':id/read')
  async markAsRead(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.notificationService.markAsRead(id, user.userId);
  }

  /**
   * 모든 알림 읽음 처리
   *
   * PATCH /notifications/read-all
   */
  @Patch('read-all')
  async markAllAsRead(@CurrentUser() user: CurrentUserPayload) {
    return this.notificationService.markAllAsRead(user.userId);
  }
}
