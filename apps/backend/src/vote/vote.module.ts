import { Module } from '@nestjs/common';
import { VoteController } from './vote.controller';
import { VoteService } from './vote.service';

/**
 * 투표 모듈
 *
 * 투표 생성, 상태 조회, 결과 집계 기능 제공
 */
@Module({
  controllers: [VoteController],
  providers: [VoteService],
  exports: [VoteService],
})
export class VoteModule {}
