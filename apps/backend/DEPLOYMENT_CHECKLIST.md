# 🚀 배포 체크리스트 (Deployment Checklist)

**작성일:** 2025-11-17
**버전:** 1.0.0
**대상:** 선거 시스템 프로덕션 배포

---

## 📋 목차

1. [환경 설정 (Environment)](#1-환경-설정-environment)
2. [데이터베이스 (Database)](#2-데이터베이스-database)
3. [백엔드 (Backend)](#3-백엔드-backend)
4. [프론트엔드 (Frontend)](#4-프론트엔드-frontend)
5. [보안 (Security)](#5-보안-security)
6. [인프라 (Infrastructure)](#6-인프라-infrastructure)
7. [모니터링 & 로깅](#7-모니터링--로깅)
8. [문서화 (Documentation)](#8-문서화-documentation)
9. [운영 준비 (Operations)](#9-운영-준비-operations)
10. [테스트 & 검증](#10-테스트--검증)
11. [최초 선거 시나리오](#11-최초-선거-시나리오)

---

## 1. 환경 설정 (Environment)

### 🔴 MUST (필수)

- [ ] **환경 변수 파일 생성**
  ```bash
  # .env.production 파일 생성
  cp .env.example .env.production
  ```

- [ ] **필수 환경 변수 설정**
  ```env
  # Database
  DATABASE_URL="postgresql://user:password@host:5432/election_db"

  # JWT (CRITICAL: 반드시 변경!)
  JWT_SECRET="[64자 이상의 강력한 랜덤 문자열]"

  # Ballot Hash Salt (CRITICAL: 반드시 변경!)
  BALLOT_SECRET_SALT="[64자 이상의 강력한 랜덤 문자열]"

  # Application
  NODE_ENV="production"
  API_PORT=3000

  # CORS
  CORS_ORIGIN="https://yourdomain.com"
  ```

- [ ] **보안 키 생성**
  ```bash
  # JWT_SECRET 생성 (64자)
  openssl rand -base64 64 | tr -d '\n'

  # BALLOT_SECRET_SALT 생성 (64자)
  openssl rand -base64 64 | tr -d '\n'
  ```

- [ ] **환경 변수 검증**
  - JWT_SECRET이 기본값이 아닌지 확인
  - BALLOT_SECRET_SALT이 기본값이 아닌지 확인
  - DATABASE_URL이 프로덕션 DB를 가리키는지 확인
  - CORS_ORIGIN이 실제 프론트엔드 도메인인지 확인

### 🟡 SHOULD (권장)

- [ ] **이메일 서비스 설정**
  ```env
  # Email (OTP 발송용)
  SMTP_HOST="smtp.gmail.com"
  SMTP_PORT=587
  SMTP_USER="noreply@yourdomain.com"
  SMTP_PASSWORD="your-app-password"
  SMTP_FROM="선거 시스템 <noreply@yourdomain.com>"
  ```

- [ ] **로그 레벨 설정**
  ```env
  LOG_LEVEL="info"  # production: info, development: debug
  ```

- [ ] **Rate Limiting 설정 조정**
  ```env
  THROTTLE_TTL=60000      # 1분
  THROTTLE_LIMIT=20       # 일반 엔드포인트
  THROTTLE_OTP_LIMIT=5    # OTP 요청
  ```

### 🟢 NICE-TO-HAVE (선택)

- [ ] **Sentry 설정 (에러 트래킹)**
  ```env
  SENTRY_DSN="https://xxx@sentry.io/xxx"
  SENTRY_ENVIRONMENT="production"
  ```

- [ ] **Redis 설정 (세션/캐싱)**
  ```env
  REDIS_URL="redis://localhost:6379"
  ```

---

## 2. 데이터베이스 (Database)

### 🔴 MUST (필수)

- [ ] **PostgreSQL 설치 및 실행**
  - 버전: PostgreSQL 15 이상
  - 최소 사양: 2GB RAM, 10GB Storage

- [ ] **프로덕션 데이터베이스 생성**
  ```sql
  CREATE DATABASE election_db;
  CREATE USER election_user WITH ENCRYPTED PASSWORD 'strong_password';
  GRANT ALL PRIVILEGES ON DATABASE election_db TO election_user;
  ```

- [ ] **Prisma 마이그레이션 실행**
  ```bash
  cd apps/backend
  npm run prisma:migrate:deploy
  ```

- [ ] **마이그레이션 검증**
  ```bash
  # 모든 테이블이 생성되었는지 확인
  npm run prisma:studio
  # 또는 직접 DB 접속하여 확인
  psql -U election_user -d election_db -c "\dt"
  ```

- [ ] **데이터베이스 백업 설정**
  ```bash
  # 일일 자동 백업 cron job 설정
  0 2 * * * pg_dump -U election_user election_db > /backups/election_$(date +\%Y\%m\%d).sql
  ```

### 🟡 SHOULD (권장)

- [ ] **Connection Pooling 설정**
  ```env
  # DATABASE_URL에 pooling 설정 추가
  DATABASE_URL="postgresql://user:pass@host:5432/db?connection_limit=10&pool_timeout=10"
  ```

- [ ] **데이터베이스 인덱스 최적화**
  - `users` 테이블: email, employeeNo, role 인덱스 확인
  - `votes` 테이블: electionId, voterId, candidateId 인덱스 확인
  - `access_logs` 테이블: userId, action, createdAt 인덱스 확인

- [ ] **데이터 보존 정책 수립**
  - AccessLog 보관 기간: 1년
  - OTP Token 자동 삭제: 7일 이상 경과 토큰
  - 완료된 선거 데이터 아카이빙 정책

### 🟢 NICE-TO-HAVE (선택)

- [ ] **읽기 전용 레플리카 설정**
  - 부하 분산을 위한 읽기 전용 DB

- [ ] **쿼리 성능 모니터링**
  - pg_stat_statements 확장 활성화
  - 느린 쿼리 로깅 설정

---

## 3. 백엔드 (Backend)

### 🔴 MUST (필수)

- [ ] **의존성 설치**
  ```bash
  cd apps/backend
  npm ci  # package-lock.json 기반 정확한 버전 설치
  ```

- [ ] **Prisma Client 생성**
  ```bash
  npm run prisma:generate
  ```

- [ ] **빌드 실행**
  ```bash
  npm run build
  ```

- [ ] **빌드 결과 검증**
  - `dist/` 폴더 생성 확인
  - 빌드 에러 없음 확인

- [ ] **프로덕션 실행 테스트**
  ```bash
  NODE_ENV=production npm run start:prod
  ```

- [ ] **헬스체크 엔드포인트 확인**
  ```bash
  curl http://localhost:3000/health
  # 또는 헬스체크 엔드포인트 구현 필요
  ```

- [ ] **최초 관리자 계정 생성**
  ```sql
  -- Prisma Studio 또는 직접 SQL로 생성
  INSERT INTO users (id, employee_no, email, name, role, is_active, created_at, updated_at)
  VALUES (
    gen_random_uuid(),
    'ADMIN001',
    'admin@yourdomain.com',
    '시스템 관리자',
    'ADMIN',
    true,
    NOW(),
    NOW()
  );
  ```

### 🟡 SHOULD (권장)

- [ ] **Process Manager 설정 (PM2)**
  ```bash
  npm install -g pm2

  # ecosystem.config.js 생성
  pm2 start ecosystem.config.js --env production
  pm2 save
  pm2 startup
  ```

  ```javascript
  // ecosystem.config.js
  module.exports = {
    apps: [{
      name: 'election-backend',
      script: './dist/main.js',
      instances: 2,
      exec_mode: 'cluster',
      env_production: {
        NODE_ENV: 'production',
        API_PORT: 3000,
      },
      error_file: './logs/err.log',
      out_file: './logs/out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      max_memory_restart: '1G',
    }],
  };
  ```

- [ ] **이메일 서비스 연동**
  - auth.service.ts의 OTP 발송 stub 구현
  - SMTP 또는 SendGrid/AWS SES 연동

- [ ] **에러 로깅 개선**
  - Winston 또는 Pino 로거 적용
  - 구조화된 로그 포맷

### 🟢 NICE-TO-HAVE (선택)

- [ ] **API 문서 자동 생성**
  - Swagger/OpenAPI 적용
  - `/api/docs` 엔드포인트 제공

- [ ] **GraphQL API 제공**
  - REST API와 병행

---

## 4. 프론트엔드 (Frontend)

### 🔴 MUST (필수)

- [ ] **환경 변수 설정**
  ```env
  # .env.production
  NEXT_PUBLIC_API_URL="https://api.yourdomain.com"
  NEXT_PUBLIC_ENVIRONMENT="production"
  ```

- [ ] **의존성 설치 및 빌드**
  ```bash
  cd apps/frontend
  npm ci
  npm run build
  ```

- [ ] **빌드 결과 검증**
  - `.next/` 폴더 생성 확인
  - 빌드 에러 없음 확인

- [ ] **프로덕션 실행 테스트**
  ```bash
  npm run start
  ```

### 🟡 SHOULD (권장)

- [ ] **Static Asset 최적화**
  - 이미지 최적화 (next/image 사용)
  - 코드 스플리팅 확인
  - Bundle 크기 분석

- [ ] **SEO 메타 태그 설정**
  - 페이지별 title, description
  - Open Graph 메타 태그

### 🟢 NICE-TO-HAVE (선택)

- [ ] **PWA 설정**
  - Service Worker
  - 오프라인 지원

- [ ] **다크 모드 지원**

---

## 5. 보안 (Security)

### 🔴 MUST (필수)

- [ ] **보안 감사 리포트 확인**
  - `SECURITY_AUDIT_REPORT.md` 검토
  - **P0 (HIGH)** 이슈: ✅ 모두 해결됨
  - **P1 (MEDIUM)** 이슈: 배포 전 해결 권장

- [ ] **HTTPS 설정**
  - SSL/TLS 인증서 발급 (Let's Encrypt 권장)
  - HTTP → HTTPS 리다이렉트 설정
  - HSTS 헤더 설정

- [ ] **CORS 설정 검증**
  ```typescript
  // main.ts
  app.enableCors({
    origin: process.env.CORS_ORIGIN, // 정확한 도메인만 허용
    credentials: true,
  });
  ```

- [ ] **Rate Limiting 동작 확인**
  - @nestjs/throttler 설치 완료 (✅)
  - 전역 설정: 20 req/min
  - Auth 엔드포인트: 5-10 req/min

- [ ] **SQL Injection 방지 확인**
  - Prisma ORM 사용으로 기본 방어 (✅)
  - 직접 SQL 사용 시 파라미터 바인딩 확인

- [ ] **XSS 방지 확인**
  - class-validator로 입력 검증 (✅)
  - 프론트엔드 output sanitization

### 🟡 SHOULD (권장)

- [ ] **보안 헤더 설정**
  ```bash
  npm install helmet
  ```

  ```typescript
  // main.ts
  import helmet from 'helmet';
  app.use(helmet());
  ```

- [ ] **CSRF 토큰 구현**
  - POST/PUT/DELETE 요청에 CSRF 토큰 검증

- [ ] **비밀번호 정책 (향후 비밀번호 로그인 시)**
  - 최소 8자, 대소문자/숫자/특수문자 포함
  - bcrypt/argon2 해싱

- [ ] **감사 로그 보안 강화**
  - IP 주소 해싱 (개인정보 보호)
  - 로그 접근 권한 제한 (ADMIN/AUDITOR만)

### 🟢 NICE-TO-HAVE (선택)

- [ ] **WAF (Web Application Firewall)**
  - Cloudflare, AWS WAF 등

- [ ] **DDoS 방어**
  - Cloudflare, AWS Shield 등

- [ ] **침입 탐지 시스템 (IDS)**

---

## 6. 인프라 (Infrastructure)

### 🔴 MUST (필수)

- [ ] **서버 사양 확인**
  - 최소 사양: 2 vCPU, 4GB RAM, 20GB SSD
  - 권장 사양: 4 vCPU, 8GB RAM, 50GB SSD

- [ ] **리버스 프록시 설정 (Nginx)**
  ```nginx
  server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$server_name$request_uri;
  }

  server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    location /api {
      proxy_pass http://localhost:3000;
      proxy_http_version 1.1;
      proxy_set_header Upgrade $http_upgrade;
      proxy_set_header Connection 'upgrade';
      proxy_set_header Host $host;
      proxy_set_header X-Real-IP $remote_addr;
      proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
      proxy_set_header X-Forwarded-Proto $scheme;
      proxy_cache_bypass $http_upgrade;
    }

    location / {
      proxy_pass http://localhost:3001;  # Next.js
      proxy_http_version 1.1;
      proxy_set_header Upgrade $http_upgrade;
      proxy_set_header Connection 'upgrade';
      proxy_set_header Host $host;
      proxy_cache_bypass $http_upgrade;
    }
  }
  ```

- [ ] **방화벽 설정**
  ```bash
  # UFW 예시
  sudo ufw allow 22/tcp    # SSH
  sudo ufw allow 80/tcp    # HTTP
  sudo ufw allow 443/tcp   # HTTPS
  sudo ufw enable
  ```

- [ ] **디스크 공간 모니터링**
  - 로그 파일 자동 로테이션
  - 디스크 사용률 알림 (80% 이상)

### 🟡 SHOULD (권장)

- [ ] **자동 재시작 설정**
  - PM2 또는 systemd 서비스
  - 서버 재부팅 시 자동 시작

- [ ] **로드 밸런싱**
  - 트래픽 증가 대비 (선택적)

- [ ] **CDN 설정**
  - 정적 파일 (이미지, CSS, JS) CDN 배포

### 🟢 NICE-TO-HAVE (선택)

- [ ] **컨테이너화 (Docker)**
  ```dockerfile
  # Dockerfile 예시
  FROM node:18-alpine
  WORKDIR /app
  COPY package*.json ./
  RUN npm ci --only=production
  COPY dist ./dist
  CMD ["node", "dist/main.js"]
  ```

- [ ] **Kubernetes 배포**
  - 고가용성 필요 시

---

## 7. 모니터링 & 로깅

### 🔴 MUST (필수)

- [ ] **애플리케이션 로그 수집**
  - 로그 파일 위치: `./logs/`
  - 로그 레벨: production은 `info` 이상
  - 로그 로테이션 설정

- [ ] **에러 알림 설정**
  - 500 에러 발생 시 관리자에게 이메일/슬랙 알림
  - 데이터베이스 연결 실패 알림

- [ ] **서버 헬스 체크**
  - CPU, 메모리, 디스크 사용률 모니터링
  - 프로세스 실행 여부 확인

### 🟡 SHOULD (권장)

- [ ] **APM (Application Performance Monitoring)**
  - New Relic, Datadog, 또는 Sentry Performance

- [ ] **데이터베이스 모니터링**
  - Connection pool 사용률
  - 쿼리 실행 시간
  - 데드락 발생 여부

- [ ] **사용자 행동 분석**
  - Google Analytics
  - 투표율 대시보드

### 🟢 NICE-TO-HAVE (선택)

- [ ] **로그 시각화**
  - ELK Stack (Elasticsearch, Logstash, Kibana)
  - Grafana + Prometheus

- [ ] **실시간 대시보드**
  - 현재 접속자 수
  - 투표 진행 상황

---

## 8. 문서화 (Documentation)

### 🔴 MUST (필수)

- [ ] **배포 가이드 문서**
  - 서버 설정 방법
  - 환경 변수 설명
  - 마이그레이션 실행 방법

- [ ] **관리자 매뉴얼**
  - 선거 생성 방법
  - 상태 전이 프로세스
  - 결과 집계 및 공개 방법

- [ ] **트러블슈팅 가이드**
  - 자주 발생하는 에러 및 해결 방법
  - 긴급 연락처

### 🟡 SHOULD (권장)

- [ ] **API 문서**
  - Swagger/Postman Collection
  - 엔드포인트별 요청/응답 예시

- [ ] **사용자 가이드**
  - 투표 방법
  - OTP 로그인 방법
  - FAQ

### 🟢 NICE-TO-HAVE (선택)

- [ ] **개발자 온보딩 문서**
  - 아키텍처 설명
  - 코드 컨벤션

---

## 9. 운영 준비 (Operations)

### 🔴 MUST (필수)

- [ ] **관리자 계정 생성**
  - 최소 1명 이상의 ADMIN 계정
  - 최소 1명 이상의 AUDITOR 계정 (감사용)

- [ ] **테스트 사용자 계정 생성**
  - 다양한 역할 (ADMIN, MEMBER, GUEST)
  - 최소 10명 이상의 MEMBER 계정

- [ ] **백업 및 복구 절차 수립**
  - 백업 주기: 매일
  - 백업 보관 기간: 30일
  - 복구 테스트 1회 이상 실시

- [ ] **장애 대응 계획 수립**
  - 장애 발생 시 연락 체계
  - 롤백 절차
  - 긴급 공지 방법

### 🟡 SHOULD (권장)

- [ ] **운영 대시보드 구축**
  - 현재 진행 중인 선거 상태
  - 투표율 현황
  - 시스템 헬스

- [ ] **자동화 스크립트**
  - 데이터베이스 백업 자동화
  - 로그 정리 자동화
  - 배포 자동화 (CI/CD)

- [ ] **알림 채널 설정**
  - 슬랙 또는 이메일
  - 중요 이벤트 알림 (선거 시작, 종료 등)

### 🟢 NICE-TO-HAVE (선택)

- [ ] **ChatOps**
  - 슬랙 봇으로 시스템 제어

---

## 10. 테스트 & 검증

### 🔴 MUST (필수)

- [ ] **단위 테스트 실행**
  ```bash
  cd apps/backend
  npm test
  # 모든 테스트 통과 확인 (46개 테스트)
  ```

- [ ] **E2E 테스트 실행**
  - 로그인 플로우
  - 선거 생성 플로우
  - 추천 플로우
  - 투표 플로우
  - 결과 조회 플로우

- [ ] **부하 테스트 (선택적이지만 권장)**
  ```bash
  # Apache Bench 예시
  ab -n 1000 -c 10 http://localhost:3000/api/elections
  ```

- [ ] **보안 테스트**
  - OWASP ZAP 또는 Burp Suite로 취약점 스캔
  - SQL Injection 테스트
  - XSS 테스트
  - CSRF 테스트

### 🟡 SHOULD (권장)

- [ ] **접근성 테스트**
  - Lighthouse 점수 확인
  - WCAG 2.1 준수 확인

- [ ] **브라우저 호환성 테스트**
  - Chrome, Firefox, Safari, Edge
  - 모바일 브라우저 (iOS Safari, Chrome)

### 🟢 NICE-TO-HAVE (선택)

- [ ] **성능 테스트**
  - 페이지 로드 시간
  - API 응답 시간

---

## 11. 최초 선거 시나리오

### 📝 전체 플로우 개요

```
1. 준비 단계
   └─ 관리자/사용자 계정 생성
   └─ 시스템 설정 확인

2. 선거 생성 (PLANNING)
   └─ 관리자가 새 선거 생성
   └─ 선거 일정 설정

3. 추천 기간 (RECOMMEND)
   └─ 회원들이 후보 추천
   └─ 추천 마감

4. 후보 확정 (CANDIDATE_CONFIRM)
   └─ 관리자가 추천 상위 N명 후보 지정
   └─ 후보들이 수락/거절 응답

5. 투표 기간 (VOTING)
   └─ 회원들이 투표
   └─ 투표 마감

6. 선거 종료 (CLOSED)
   └─ 결과 집계 및 공개
   └─ 당선자 확인

7. 검증
   └─ 데이터 무결성 확인
   └─ 감사 로그 확인
```

---

### 🔧 사전 준비 (30분)

#### 1. 관리자 계정 생성

```bash
# Prisma Studio 실행
cd apps/backend
npm run prisma:studio
```

**또는 직접 SQL:**

```sql
-- 1. 관리자 계정 (ADMIN)
INSERT INTO users (id, employee_no, email, name, department, position, role, is_active, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'ADMIN001',
  'admin@test.com',
  '김관리',
  'IT팀',
  '팀장',
  'ADMIN',
  true,
  NOW(),
  NOW()
);

-- 2. 감사 계정 (AUDITOR)
INSERT INTO users (id, employee_no, email, name, department, position, role, is_active, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'AUDIT001',
  'auditor@test.com',
  '이감사',
  '감사팀',
  '감사',
  'AUDITOR',
  true,
  NOW(),
  NOW()
);
```

#### 2. 테스트 회원 계정 생성 (10명)

```sql
-- 회원 10명 생성 (추천 및 투표용)
INSERT INTO users (id, employee_no, email, name, department, position, role, is_active, created_at, updated_at)
VALUES
  (gen_random_uuid(), 'EMP001', 'user01@test.com', '홍길동', '개발팀', '대리', 'MEMBER', true, NOW(), NOW()),
  (gen_random_uuid(), 'EMP002', 'user02@test.com', '김철수', '기획팀', '과장', 'MEMBER', true, NOW(), NOW()),
  (gen_random_uuid(), 'EMP003', 'user03@test.com', '이영희', '디자인팀', '대리', 'MEMBER', true, NOW(), NOW()),
  (gen_random_uuid(), 'EMP004', 'user04@test.com', '박민수', '개발팀', '부장', 'MEMBER', true, NOW(), NOW()),
  (gen_random_uuid(), 'EMP005', 'user05@test.com', '정수진', '마케팅팀', '팀장', 'MEMBER', true, NOW(), NOW()),
  (gen_random_uuid(), 'EMP006', 'user06@test.com', '최영수', '영업팀', '과장', 'MEMBER', true, NOW(), NOW()),
  (gen_random_uuid(), 'EMP007', 'user07@test.com', '강민지', 'HR팀', '대리', 'MEMBER', true, NOW(), NOW()),
  (gen_random_uuid(), 'EMP008', 'user08@test.com', '조현우', '개발팀', '사원', 'MEMBER', true, NOW(), NOW()),
  (gen_random_uuid(), 'EMP009', 'user09@test.com', '윤서연', '기획팀', '대리', 'MEMBER', true, NOW(), NOW()),
  (gen_random_uuid(), 'EMP010', 'user10@test.com', '임태희', '디자인팀', '팀장', 'MEMBER', true, NOW(), NOW());
```

#### 3. 계정 생성 확인

```bash
# 총 12명 확인 (관리자 1 + 감사 1 + 회원 10)
curl http://localhost:3000/api/users
# 또는 Prisma Studio에서 확인
```

---

### 📅 1단계: 선거 생성 (PLANNING) - 5분

#### 1.1. 관리자 로그인

```bash
# 1. OTP 요청
curl -X POST http://localhost:3000/api/auth/request-otp \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@test.com"}'

# 2. 백엔드 로그에서 OTP 코드 확인
# [AuthService] OTP generated for user admin@test.com: 123456

# 3. OTP 검증 및 로그인
curl -X POST http://localhost:3000/api/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@test.com",
    "code": "123456"
  }'

# 응답에서 accessToken 저장
export TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

#### 1.2. 새 선거 생성

```bash
curl -X POST http://localhost:3000/api/elections \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "2025년 임원 선거",
    "description": "2025년도 임원 선출을 위한 선거입니다.",
    "recommendationStartDate": "2025-11-18T00:00:00.000Z",
    "recommendationEndDate": "2025-11-20T23:59:59.000Z",
    "votingStartDate": "2025-11-22T00:00:00.000Z",
    "votingEndDate": "2025-11-24T23:59:59.000Z",
    "maxRecommendations": 3
  }'

# 응답에서 electionId 저장
export ELECTION_ID="uuid-of-election"
```

#### 1.3. 선거 생성 확인

```bash
curl -X GET http://localhost:3000/api/elections/$ELECTION_ID \
  -H "Authorization: Bearer $TOKEN"

# 상태가 "PLANNING"인지 확인
```

**✅ 체크포인트:**
- [ ] 선거가 PLANNING 상태로 생성됨
- [ ] 일정이 올바르게 설정됨
- [ ] AccessLog에 ELECTION_CREATE 기록됨

---

### 🙋 2단계: 추천 기간 (RECOMMEND) - 10분

#### 2.1. 추천 기간 시작

```bash
# 선거 상태를 RECOMMEND로 변경
curl -X PATCH http://localhost:3000/api/elections/$ELECTION_ID/status \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status": "RECOMMEND"}'
```

#### 2.2. 회원들이 후보 추천 (3명의 회원이 추천)

**회원 1 (user01@test.com) - 홍길동이 추천:**

```bash
# 1. 로그인
curl -X POST http://localhost:3000/api/auth/request-otp \
  -H "Content-Type: application/json" \
  -d '{"email": "user01@test.com"}'

# OTP 코드 확인 후
curl -X POST http://localhost:3000/api/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"email": "user01@test.com", "code": "123456"}'

export TOKEN_USER1="..."

# 2. 회장 후보 추천 (user04 - 박민수)
export CANDIDATE_USER4_ID="user04-uuid"

curl -X POST http://localhost:3000/api/elections/$ELECTION_ID/recommendations \
  -H "Authorization: Bearer $TOKEN_USER1" \
  -H "Content-Type: application/json" \
  -d '{
    "candidateId": "'$CANDIDATE_USER4_ID'",
    "forRole": "PRESIDENT",
    "comment": "리더십이 뛰어나고 책임감이 강합니다."
  }'

# 3. 부회장 후보 추천 (user05 - 정수진)
export CANDIDATE_USER5_ID="user05-uuid"

curl -X POST http://localhost:3000/api/elections/$ELECTION_ID/recommendations \
  -H "Authorization: Bearer $TOKEN_USER1" \
  -H "Content-Type: application/json" \
  -d '{
    "candidateId": "'$CANDIDATE_USER5_ID'",
    "forRole": "VICE_PRESIDENT",
    "comment": "의사소통 능력이 우수합니다."
  }'
```

**회원 2 (user02@test.com) - 김철수가 추천:**

```bash
# 동일한 방식으로 로그인 후
# 회장 후보로 user04 추천 (중복 추천으로 득표수 증가)
# 총무 후보로 user06 추천
```

**회원 3 (user03@test.com) - 이영희가 추천:**

```bash
# 동일한 방식으로 로그인 후
# 회장 후보로 user04 추천 (3표)
# 감사 후보로 user07 추천
```

#### 2.3. 추천 데이터 확인

```bash
# 특정 역할의 추천 현황 조회
curl -X GET "http://localhost:3000/api/elections/$ELECTION_ID/recommendations?role=PRESIDENT" \
  -H "Authorization: Bearer $TOKEN"

# 후보별 추천 수 확인
# user04 (박민수): 3표 (최다 득표)
# user05 (정수진): 1표
# user06 (최영수): 1표
# user07 (강민지): 1표
```

**✅ 체크포인트:**
- [ ] 각 회원이 역할별로 1회씩만 추천 가능 확인
- [ ] 중복 추천 시도 시 에러 발생 확인 (RECOMMEND_DUPLICATE_FOR_ROLE)
- [ ] 자기 자신 추천 시도 시 에러 발생 확인
- [ ] AccessLog에 RECOMMEND 기록됨

---

### ✅ 3단계: 후보 확정 (CANDIDATE_CONFIRM) - 10분

#### 3.1. 후보 확정 기간 시작

```bash
# 선거 상태를 CANDIDATE_CONFIRM으로 변경
curl -X PATCH http://localhost:3000/api/elections/$ELECTION_ID/status \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status": "CANDIDATE_CONFIRM"}'
```

#### 3.2. 관리자가 추천 상위 N명을 후보로 지정

```bash
# 회장 후보 지정 (상위 3명)
curl -X POST http://localhost:3000/api/elections/$ELECTION_ID/candidates \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "forRole": "PRESIDENT",
    "topN": 3
  }'

# 부회장 후보 지정
curl -X POST http://localhost:3000/api/elections/$ELECTION_ID/candidates \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "forRole": "VICE_PRESIDENT",
    "topN": 3
  }'

# 총무, 감사도 동일하게 진행
```

#### 3.3. 후보 목록 확인 (관리자용)

```bash
curl -X GET http://localhost:3000/api/elections/$ELECTION_ID/candidates/all \
  -H "Authorization: Bearer $TOKEN"

# 각 후보의 상태가 "INVITED"인지 확인
```

#### 3.4. 후보들이 수락/거절 응답

**후보 1 (user04 - 박민수) - 수락:**

```bash
# 후보 본인 로그인
curl -X POST http://localhost:3000/api/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"email": "user04@test.com", "code": "123456"}'

export TOKEN_CANDIDATE="..."
export CANDIDATE_ID="candidate-uuid"

# 후보 수락
curl -X PATCH http://localhost:3000/api/candidates/$CANDIDATE_ID/status \
  -H "Authorization: Bearer $TOKEN_CANDIDATE" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "ACCEPTED",
    "statement": "당선되면 회원 여러분을 위해 최선을 다하겠습니다."
  }'
```

**후보 2 (user05 - 정수진) - 수락:**

```bash
# 동일한 방식으로 수락
```

**후보 3 - 거절 (선택):**

```bash
curl -X PATCH http://localhost:3000/api/candidates/$CANDIDATE_ID/status \
  -H "Authorization: Bearer $TOKEN_CANDIDATE" \
  -H "Content-Type: application/json" \
  -d '{"status": "DECLINED"}'
```

#### 3.5. 확정 후보 목록 확인

```bash
# 회원들이 볼 수 있는 확정 후보 목록 (ACCEPTED만)
curl -X GET http://localhost:3000/api/elections/$ELECTION_ID/candidates \
  -H "Authorization: Bearer $TOKEN_USER1"

# voteCount가 0인지 확인 (투표 전이므로)
```

**✅ 체크포인트:**
- [ ] INVITED 상태의 후보만 수락/거절 가능
- [ ] 본인만 자신의 후보 상태 변경 가능
- [ ] ACCEPTED 상태의 후보만 회원에게 노출
- [ ] voteCount가 아직 0으로 숨겨져 있음

---

### 🗳️ 4단계: 투표 기간 (VOTING) - 10분

#### 4.1. 투표 기간 시작

```bash
# 선거 상태를 VOTING으로 변경
curl -X PATCH http://localhost:3000/api/elections/$ELECTION_ID/status \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status": "VOTING"}'
```

#### 4.2. 회원들이 투표 (5명의 회원이 투표)

**회원 1 (user01@test.com) - 홍길동이 투표:**

```bash
# 투표 가능 후보 조회
curl -X GET http://localhost:3000/api/elections/$ELECTION_ID/candidates \
  -H "Authorization: Bearer $TOKEN_USER1"

# 여러 역할에 대해 동시 투표
curl -X POST http://localhost:3000/api/elections/$ELECTION_ID/votes \
  -H "Authorization: Bearer $TOKEN_USER1" \
  -H "Content-Type: application/json" \
  -d '{
    "presidentCandidateId": "'$CANDIDATE_PRESIDENT_1'",
    "vicePresidentCandidateId": "'$CANDIDATE_VP_1'",
    "secretaryCandidateId": "'$CANDIDATE_SEC_1'",
    "treasurerCandidateId": "'$CANDIDATE_TREAS_1'",
    "auditorCandidateId": "'$CANDIDATE_AUD_1'"
  }'

# 투표 완료 응답 확인
# {
#   "success": true,
#   "data": {
#     "message": "투표가 완료되었습니다.",
#     "votedRoles": ["PRESIDENT", "VICE_PRESIDENT", "SECRETARY", "TREASURER", "AUDITOR"]
#   }
# }
```

**회원 2 ~ 5 동일하게 투표:**

```bash
# 각 회원별로 로그인 후 투표
# 일부는 모든 역할에 투표, 일부는 일부 역할만 투표
```

#### 4.3. 투표 상태 조회

```bash
# 자신의 투표 상태 확인
curl -X GET http://localhost:3000/api/elections/$ELECTION_ID/vote-status \
  -H "Authorization: Bearer $TOKEN_USER1"

# 응답 예시:
# {
#   "electionId": "...",
#   "hasVotedAny": true,
#   "byRole": [
#     {"role": "PRESIDENT", "hasVoted": true, "votedAt": "2025-11-22T10:30:00Z"},
#     {"role": "VICE_PRESIDENT", "hasVoted": true, "votedAt": "2025-11-22T10:30:00Z"},
#     ...
#   ]
# }
```

#### 4.4. 중복 투표 시도 (실패 확인)

```bash
# 동일한 역할에 다시 투표 시도
curl -X POST http://localhost:3000/api/elections/$ELECTION_ID/votes \
  -H "Authorization: Bearer $TOKEN_USER1" \
  -H "Content-Type: application/json" \
  -d '{
    "presidentCandidateId": "'$CANDIDATE_PRESIDENT_2'"
  }'

# 에러 응답 확인:
# {
#   "success": false,
#   "error": {
#     "code": "VOTE_DUPLICATE_FOR_ROLE",
#     "message": "PRESIDENT 역할에 대해 이미 투표했습니다."
#   }
# }
```

#### 4.5. 투표 중 결과 조회 시도 (차단 확인)

```bash
# 관리자도 투표 중에는 결과 조회 불가
curl -X GET http://localhost:3000/api/elections/$ELECTION_ID/result \
  -H "Authorization: Bearer $TOKEN"

# 에러 응답:
# {
#   "code": "ELECTION_NOT_CLOSED",
#   "message": "선거가 종료된 후에만 결과를 조회할 수 있습니다."
# }
```

**✅ 체크포인트:**
- [ ] 각 역할별로 1인 1표만 가능
- [ ] 중복 투표 시 에러 발생
- [ ] ballotHash가 생성되어 익명성 보장
- [ ] 투표 중에는 voteCount가 0으로 숨겨짐
- [ ] 투표 중에는 결과 API 접근 불가 (관리자/감사 포함)
- [ ] AccessLog에 VOTE 기록 (candidateId는 기록되지 않음 - 익명성)

---

### 🏆 5단계: 선거 종료 및 결과 공개 (CLOSED) - 5분

#### 5.1. 선거 종료

```bash
# 선거 상태를 CLOSED로 변경
curl -X PATCH http://localhost:3000/api/elections/$ELECTION_ID/status \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status": "CLOSED"}'
```

#### 5.2. 결과 요약 조회 (모든 회원 가능)

```bash
curl -X GET http://localhost:3000/api/elections/$ELECTION_ID/result-summary \
  -H "Authorization: Bearer $TOKEN_USER1"

# 응답 예시:
# {
#   "electionId": "...",
#   "electionName": "2025년 임원 선거",
#   "electionStatus": "CLOSED",
#   "totalEligibleVoters": 10,
#   "totalVoters": 5,
#   "turnoutRate": 50.00,
#   "winners": [
#     {
#       "role": "PRESIDENT",
#       "candidateId": "...",
#       "candidateName": "박민수",
#       "employeeNo": "EMP004",
#       "voteCount": 4,
#       "votePercentage": 80.00
#     },
#     {
#       "role": "VICE_PRESIDENT",
#       "candidateId": "...",
#       "candidateName": "정수진",
#       "employeeNo": "EMP005",
#       "voteCount": 3,
#       "votePercentage": 60.00
#     },
#     ...
#   ]
# }
```

#### 5.3. 상세 결과 조회 (관리자/감사만 가능)

```bash
# 관리자 또는 감사 계정으로 로그인
curl -X GET http://localhost:3000/api/elections/$ELECTION_ID/result \
  -H "Authorization: Bearer $TOKEN"

# 응답에 모든 후보의 득표 수 포함
# {
#   "electionId": "...",
#   "electionName": "2025년 임원 선거",
#   "electionStatus": "CLOSED",
#   "totalEligibleVoters": 10,
#   "totalVoters": 5,
#   "turnoutRate": 50.00,
#   "byRole": [
#     {
#       "role": "PRESIDENT",
#       "totalVotes": 5,
#       "candidates": [
#         {
#           "candidateId": "...",
#           "candidateName": "박민수",
#           "employeeNo": "EMP004",
#           "department": "개발팀",
#           "position": "부장",
#           "voteCount": 4,
#           "votePercentage": 80.00
#         },
#         {
#           "candidateId": "...",
#           "candidateName": "김철수",
#           "employeeNo": "EMP002",
#           "department": "기획팀",
#           "position": "과장",
#           "voteCount": 1,
#           "votePercentage": 20.00
#         }
#       ]
#     },
#     ...
#   ]
# }
```

#### 5.4. 일반 회원이 상세 결과 조회 시도 (차단 확인)

```bash
curl -X GET http://localhost:3000/api/elections/$ELECTION_ID/result \
  -H "Authorization: Bearer $TOKEN_USER1"

# 에러 응답:
# {
#   "code": "AUTH_FORBIDDEN",
#   "message": "접근 권한이 없습니다."
# }
```

**✅ 체크포인트:**
- [ ] 선거가 CLOSED 상태로 변경됨
- [ ] 모든 회원이 결과 요약 조회 가능
- [ ] 관리자/감사만 상세 결과 조회 가능
- [ ] voteCount가 이제 실제 득표 수로 표시됨
- [ ] 투표율이 정확하게 계산됨

---

### 🔍 6단계: 검증 및 감사 (15분)

#### 6.1. 데이터 무결성 검증

```sql
-- 1. 중복 투표 확인 (0건이어야 함)
SELECT voter_id, election_id, for_role, COUNT(*) as vote_count
FROM votes
WHERE election_id = '{ELECTION_ID}'
GROUP BY voter_id, election_id, for_role
HAVING COUNT(*) > 1;

-- 2. 투표 수 vs Candidate.voteCount 일치 확인
SELECT
  c.id,
  c.user_id,
  c.for_role,
  c.vote_count as stored_count,
  COUNT(v.id) as actual_count
FROM candidates c
LEFT JOIN votes v ON c.id = v.candidate_id
WHERE c.election_id = '{ELECTION_ID}'
GROUP BY c.id, c.user_id, c.for_role, c.vote_count
HAVING c.vote_count != COUNT(v.id);
-- 결과가 없어야 정상

-- 3. ballotHash 중복 확인 (0건이어야 함)
SELECT ballot_hash, COUNT(*) as count
FROM votes
WHERE election_id = '{ELECTION_ID}'
GROUP BY ballot_hash
HAVING COUNT(*) > 1;
```

#### 6.2. 감사 로그 확인 (감사 계정)

```bash
# 감사 로그 조회
curl -X GET "http://localhost:3000/api/audit/logs?action=VOTE&electionId=$ELECTION_ID" \
  -H "Authorization: Bearer $TOKEN_AUDITOR"

# 확인 사항:
# - VOTE 액션 로그에 candidateId가 없는지 확인 (익명성 보장)
# - userId와 role만 기록되어 있는지 확인
# - IP 주소 및 User-Agent가 기록되어 있는지 확인
```

#### 6.3. 통계 확인

```bash
# 감사 로그 통계
curl -X GET "http://localhost:3000/api/audit/stats?startDate=2025-11-18&endDate=2025-11-25" \
  -H "Authorization: Bearer $TOKEN_AUDITOR"

# 응답 예시:
# {
#   "totalLogs": 50,
#   "byAction": [
#     {"action": "LOGIN", "count": 12},
#     {"action": "VOTE", "count": 25},  # 5명 x 5역할 = 25
#     {"action": "RECOMMEND", "count": 10},
#     {"action": "ELECTION_STATUS_CHANGE", "count": 4}
#   ],
#   "topUsers": [...]
# }
```

**✅ 체크포인트:**
- [ ] 중복 투표 없음
- [ ] voteCount와 실제 투표 수 일치
- [ ] ballotHash 중복 없음
- [ ] 감사 로그에 투표 기록됨 (candidateId 제외)
- [ ] 모든 상태 전이가 로그에 기록됨

---

### 📊 7단계: 최종 점검 (10분)

#### 7.1. 전체 선거 플로우 재확인

```bash
# 선거 상세 정보 조회
curl -X GET http://localhost:3000/api/elections/$ELECTION_ID \
  -H "Authorization: Bearer $TOKEN"

# 확인 사항:
# - status: "CLOSED"
# - totalCandidates: 예상 수와 일치
# - totalVotes: 예상 수와 일치
```

#### 7.2. 보안 검증

```bash
# 1. Rate Limiting 동작 확인
# 짧은 시간 내 OTP 요청을 6회 이상 시도
for i in {1..6}; do
  curl -X POST http://localhost:3000/api/auth/request-otp \
    -H "Content-Type: application/json" \
    -d '{"email": "admin@test.com"}'
done

# 6번째 요청에서 429 Too Many Requests 응답 확인

# 2. 투표 익명성 확인
# 감사 로그에서 VOTE 액션을 조회했을 때
# candidateId가 metadata에 없는지 확인

# 3. 권한 검증
# 일반 회원이 관리자 기능 시도 시 403 에러
curl -X POST http://localhost:3000/api/elections \
  -H "Authorization: Bearer $TOKEN_USER1" \
  -H "Content-Type: application/json" \
  -d '{...}'
# 403 Forbidden 확인
```

#### 7.3. 성능 확인

```bash
# API 응답 시간 측정
time curl -X GET http://localhost:3000/api/elections/$ELECTION_ID/result-summary \
  -H "Authorization: Bearer $TOKEN"

# 500ms 이내 응답 확인 (권장)
```

**✅ 최종 체크포인트:**
- [ ] 전체 플로우가 정상적으로 완료됨
- [ ] 모든 보안 기능이 동작함
- [ ] API 응답 속도가 적절함
- [ ] 데이터 무결성이 보장됨
- [ ] 감사 로그가 완전함

---

## 🎯 배포 완료 후 확인 사항

### ✅ 최종 체크리스트

- [ ] 모든 MUST 항목 완료
- [ ] 대부분의 SHOULD 항목 완료
- [ ] 최초 선거 시나리오 테스트 성공
- [ ] 보안 취약점 없음
- [ ] 백업 시스템 동작 확인
- [ ] 모니터링 알림 동작 확인
- [ ] 관리자 매뉴얼 작성 완료
- [ ] 긴급 연락망 구축
- [ ] 롤백 계획 수립

---

## 📞 긴급 연락처

```
시스템 관리자: [이름] - [전화번호] - [이메일]
개발 담당자: [이름] - [전화번호] - [이메일]
DB 관리자: [이름] - [전화번호] - [이메일]
```

---

## 📚 관련 문서

- [보안 감사 리포트](./SECURITY_AUDIT_REPORT.md)
- [테스트 전략 가이드](./TEST_STRATEGY.md)
- [테스트 빠른 시작](./QUICK_START_TESTING.md)
- [API 문서](./API_DOCUMENTATION.md) (작성 필요)
- [관리자 매뉴얼](./ADMIN_MANUAL.md) (작성 필요)

---

**배포 준비 완료! 🚀**

이 체크리스트를 순서대로 따라하면 안전하고 성공적인 배포가 가능합니다.
