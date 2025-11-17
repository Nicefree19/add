import { Module, Global } from '@nestjs/common';
import { PrismaService } from './prisma.service';

/**
 * Prisma Module
 *
 * @Global 데코레이터로 전역 모듈로 설정
 * 모든 모듈에서 PrismaService를 import 없이 사용 가능
 */
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
