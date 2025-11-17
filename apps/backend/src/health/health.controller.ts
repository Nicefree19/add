import { Controller, Get } from '@nestjs/common';
import { Public } from '../common/decorators/public.decorator';
import { HealthService } from './health.service';

/**
 * Health Check 컨트롤러
 *
 * 서비스 상태 모니터링을 위한 엔드포인트 제공
 * - Kubernetes, AWS ELB, 모니터링 시스템에서 사용
 * - 인증 불필요 (@Public)
 */
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  /**
   * 기본 헬스 체크
   *
   * 서비스가 실행 중인지만 확인
   * 가장 빠른 응답 (DB 체크 없음)
   *
   * @returns 상태 정보
   */
  @Public()
  @Get()
  async check() {
    return this.healthService.getBasicHealth();
  }

  /**
   * 상세 헬스 체크
   *
   * DB 연결, 환경 변수 등 전체 시스템 상태 확인
   * 로드밸런서보다는 모니터링 시스템에서 사용
   *
   * @returns 상세 상태 정보
   */
  @Public()
  @Get('detailed')
  async checkDetailed() {
    return this.healthService.getDetailedHealth();
  }

  /**
   * Readiness Probe
   *
   * 서비스가 요청을 받을 준비가 되었는지 확인
   * Kubernetes readinessProbe에서 사용
   *
   * @returns 준비 상태
   */
  @Public()
  @Get('ready')
  async ready() {
    return this.healthService.checkReadiness();
  }

  /**
   * Liveness Probe
   *
   * 서비스가 살아있는지 확인
   * Kubernetes livenessProbe에서 사용
   *
   * @returns 생존 상태
   */
  @Public()
  @Get('live')
  async live() {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }
}
