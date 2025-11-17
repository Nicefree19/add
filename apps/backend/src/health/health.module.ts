import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';
import { HealthService } from './health.service';

/**
 * Health Check 모듈
 *
 * 서비스 상태 모니터링을 위한 헬스 체크 기능 제공
 * - 로드밸런서 연동 (AWS ELB, Nginx 등)
 * - Kubernetes 프로브 (readiness, liveness)
 * - 모니터링 시스템 연동 (DataDog, CloudWatch 등)
 */
@Module({
  controllers: [HealthController],
  providers: [HealthService],
})
export class HealthModule {}
