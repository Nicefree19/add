import { IsString, IsNotEmpty, IsOptional, IsEnum } from 'class-validator';

/**
 * 인수인계 문서 생성 DTO
 */
export class CreateTransitionDocDto {
  @IsString()
  @IsNotEmpty()
  fromUserId: string;

  @IsString()
  @IsNotEmpty()
  toUserId: string;

  @IsEnum(['PRESIDENT', 'VICE_PRESIDENT', 'SECRETARY', 'TREASURER', 'AUDITOR'])
  @IsNotEmpty()
  forRole: string;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  content: string;

  @IsOptional()
  attachments?: any; // 파일 메타데이터 (URL, 파일명 등)
}
