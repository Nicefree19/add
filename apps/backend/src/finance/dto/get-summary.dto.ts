import { IsOptional, IsDateString, IsString, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum GroupBy {
  MONTH = 'month',
  YEAR = 'year',
  CATEGORY = 'category',
  TERM = 'term',
}

export class GetSummaryQueryDto {
  @ApiProperty({ required: false, description: '시작 날짜 (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  from?: string;

  @ApiProperty({ required: false, description: '종료 날짜 (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  to?: string;

  @ApiProperty({ required: false, description: '임기 ID' })
  @IsOptional()
  @IsString()
  termId?: string;

  @ApiProperty({ required: false, enum: GroupBy, description: '그룹화 기준 (month/year/category/term)' })
  @IsOptional()
  @IsEnum(GroupBy)
  groupBy?: GroupBy;

  @ApiProperty({ required: false, description: '연도 (YYYY)' })
  @IsOptional()
  @IsString()
  year?: string;
}
