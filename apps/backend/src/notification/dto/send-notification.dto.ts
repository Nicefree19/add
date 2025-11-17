import { IsString, IsNotEmpty, IsOptional, IsArray } from 'class-validator';

/**
 * 알림 발송 DTO
 */
export class SendNotificationDto {
  @IsArray()
  @IsNotEmpty()
  userIds: string[];

  @IsString()
  @IsNotEmpty()
  type: string;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  message: string;

  @IsOptional()
  metadata?: any;
}
