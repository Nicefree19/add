import { IsOptional, IsDateString, IsEnum, IsString, IsInt, Min, Max } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export enum TransactionType {
  INCOME = 'INCOME',
  EXPENSE = 'EXPENSE',
}

export class GetTransactionsQueryDto {
  @ApiProperty({ required: false, description: '시작 날짜 (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  from?: string;

  @ApiProperty({ required: false, description: '종료 날짜 (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  to?: string;

  @ApiProperty({ required: false, enum: TransactionType, description: '거래 유형 (INCOME/EXPENSE)' })
  @IsOptional()
  @IsEnum(TransactionType)
  type?: TransactionType;

  @ApiProperty({ required: false, description: '계좌 ID' })
  @IsOptional()
  @IsString()
  accountId?: string;

  @ApiProperty({ required: false, description: '임기 ID' })
  @IsOptional()
  @IsString()
  termId?: string;

  @ApiProperty({ required: false, description: '카테고리' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiProperty({ required: false, description: '검색어 (설명 필드)' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({ required: false, default: 1, description: '페이지 번호' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiProperty({ required: false, default: 50, description: '페이지 크기' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(200)
  pageSize?: number = 50;

  @ApiProperty({ required: false, default: 'date', description: '정렬 기준 (date, amount, createdAt)' })
  @IsOptional()
  @IsString()
  sortBy?: string = 'date';

  @ApiProperty({ required: false, default: 'desc', description: '정렬 방향 (asc/desc)' })
  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc' = 'desc';
}
