import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { AppModule } from './app.module';

/**
 * NestJS 애플리케이션 부트스트랩
 */
async function bootstrap() {
  const logger = new Logger('Bootstrap');

  // NestJS 애플리케이션 생성
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
  });

  // CORS 활성화 (프론트엔드와의 통신을 위해)
  // 보안: 프로덕션에서는 정확한 도메인만 허용
  const corsOrigin = process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',').map((origin) => origin.trim())
    : process.env.NODE_ENV === 'production'
    ? [] // 프로덕션에서 CORS_ORIGIN 미설정 시 모든 요청 차단
    : ['http://localhost:3001', 'http://localhost:3000']; // 개발 환경 기본값

  app.enableCors({
    origin: corsOrigin,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    exposedHeaders: ['Content-Range', 'X-Content-Range'],
    maxAge: 3600, // Preflight 요청 캐싱 시간 (1시간)
  });

  if (process.env.NODE_ENV === 'production' && corsOrigin.length === 0) {
    logger.warn(
      '⚠️  WARNING: CORS_ORIGIN not set in production. All cross-origin requests will be blocked!',
    );
  }

  // 전역 Validation Pipe 설정
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // DTO에 정의되지 않은 속성 제거
      forbidNonWhitelisted: true, // DTO에 없는 속성이 있으면 에러
      transform: true, // 타입 자동 변환 (예: string -> number)
      transformOptions: {
        enableImplicitConversion: true, // 암시적 타입 변환 활성화
      },
    }),
  );

  // API 글로벌 프리픽스 설정
  app.setGlobalPrefix('api');

  // 서버 시작
  const port = process.env.PORT || 3000;
  await app.listen(port);

  logger.log(`🚀 Application is running on: http://localhost:${port}/api`);
  logger.log(`📚 API Documentation: http://localhost:${port}/api/docs`);
  logger.log(`🔐 Auth endpoints:`);
  logger.log(`   - POST http://localhost:${port}/api/auth/request-otp`);
  logger.log(`   - POST http://localhost:${port}/api/auth/verify-otp`);
  logger.log(`   - POST http://localhost:${port}/api/auth/refresh`);
}

// 애플리케이션 시작
bootstrap().catch((error) => {
  console.error('Failed to start application:', error);
  process.exit(1);
});
