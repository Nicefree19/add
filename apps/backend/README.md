# Employee Association Backend

사우회 선거 관리 시스템 백엔드 API

## 기술 스택

- **Framework**: NestJS
- **Language**: TypeScript
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Authentication**: JWT (JSON Web Token)
- **Validation**: class-validator, class-transformer

## 주요 기능

### ✅ 구현 완료

- **인증 시스템 (AuthModule)**
  - 이메일 OTP 로그인
  - JWT Access/Refresh Token 발급
  - Token 갱신 (Refresh)
  - 역할 기반 접근 제어 (RBAC)

### 📋 예정

- 사용자 관리
- 선거 관리
- 후보 관리
- 추천 관리
- 투표 관리
- 인수인계 문서 관리

## 프로젝트 구조

```
apps/backend/
├── src/
│   ├── auth/                    # 인증 모듈
│   │   ├── dto/                 # Data Transfer Objects
│   │   │   ├── request-otp.dto.ts
│   │   │   ├── verify-otp.dto.ts
│   │   │   ├── refresh-token.dto.ts
│   │   │   └── auth-response.dto.ts
│   │   ├── auth.controller.ts   # 인증 엔드포인트
│   │   ├── auth.service.ts      # 인증 비즈니스 로직
│   │   └── auth.module.ts       # 인증 모듈 설정
│   │
│   ├── common/                  # 공통 레이어
│   │   ├── constants/           # 상수 정의
│   │   │   └── error-codes.ts   # 에러 코드 및 메시지
│   │   ├── decorators/          # 커스텀 데코레이터
│   │   │   ├── public.decorator.ts
│   │   │   ├── roles.decorator.ts
│   │   │   └── current-user.decorator.ts
│   │   ├── dto/                 # 공통 DTO
│   │   │   ├── base-response.dto.ts
│   │   │   └── pagination.dto.ts
│   │   ├── exceptions/          # 예외 클래스
│   │   │   └── business.exception.ts
│   │   ├── filters/             # 예외 필터
│   │   │   └── http-exception.filter.ts
│   │   ├── guards/              # 가드
│   │   │   ├── jwt-auth.guard.ts
│   │   │   └── roles.guard.ts
│   │   └── interceptors/        # 인터셉터
│   │       └── transform-response.interceptor.ts
│   │
│   ├── app.module.ts            # 루트 모듈
│   └── main.ts                  # 엔트리 포인트
│
├── prisma/
│   └── schema.prisma            # 데이터베이스 스키마
│
├── .env.example                 # 환경 변수 예시
├── .gitignore
└── README.md
```

## 설치 및 실행

### 1. 환경 변수 설정

```bash
# .env.example 파일을 .env로 복사
cp .env.example .env

# .env 파일 수정 (필수 항목)
# - DATABASE_URL: PostgreSQL 연결 문자열
# - JWT_SECRET: JWT 서명용 비밀 키
```

### 2. 의존성 설치

```bash
# 프로젝트 루트에서
npm install

# 또는 yarn
yarn install
```

### 3. 데이터베이스 설정

```bash
# Prisma 마이그레이션 실행
npx prisma migrate dev

# Prisma Client 생성
npx prisma generate
```

### 4. 서버 실행

```bash
# 개발 모드
npm run start:dev

# 프로덕션 빌드
npm run build
npm run start:prod
```

서버가 시작되면 `http://localhost:3000/api`에서 접근 가능합니다.

## API 엔드포인트

### 인증 (Authentication)

모든 인증 엔드포인트는 `@Public()` 데코레이터로 표시되어 있어 JWT 토큰 없이 접근 가능합니다.

#### 1. OTP 요청

이메일 주소로 6자리 OTP 코드를 발급받습니다.

**Endpoint:** `POST /api/auth/request-otp`

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "message": "OTP 코드가 이메일로 발송되었습니다."
  }
}
```

**Error Response (404):**
```json
{
  "success": false,
  "error": {
    "code": "USER_NOT_FOUND",
    "message": "등록되지 않은 이메일입니다."
  }
}
```

#### 2. OTP 검증 및 로그인

OTP 코드를 검증하고 JWT 토큰을 발급받습니다.

**Endpoint:** `POST /api/auth/verify-otp`

**Request Body:**
```json
{
  "email": "user@example.com",
  "code": "123456"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "uuid",
      "employeeNo": "EMP001",
      "email": "user@example.com",
      "name": "홍길동",
      "role": "MEMBER"
    },
    "expiresIn": 1800
  }
}
```

**Error Responses:**
- `401 AUTH_OTP_INVALID`: 유효하지 않은 OTP 코드
- `401 AUTH_OTP_EXPIRED`: 만료된 OTP 코드
- `401 AUTH_OTP_ALREADY_USED`: 이미 사용된 OTP 코드

#### 3. Access Token 갱신

Refresh Token으로 새로운 Access Token을 발급받습니다.

**Endpoint:** `POST /api/auth/refresh`

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 1800
  }
}
```

**Error Responses:**
- `401 AUTH_TOKEN_EXPIRED`: Refresh Token 만료
- `401 AUTH_INVALID_TOKEN`: 유효하지 않은 Token

### 인증이 필요한 API 사용

로그인 후 발급받은 `accessToken`을 사용하여 보호된 엔드포인트에 접근할 수 있습니다.

**Authorization Header:**
```
Authorization: Bearer {accessToken}
```

**예시:**
```bash
curl -X GET http://localhost:3000/api/users/me \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

## 에러 코드

에러 응답은 다음과 같은 형식입니다:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "에러 메시지",
    "details": {}  // 선택사항
  }
}
```

### 인증 관련 에러 코드

| 코드 | HTTP 상태 | 설명 |
|------|-----------|------|
| `AUTH_UNAUTHORIZED` | 401 | 인증되지 않은 사용자 |
| `AUTH_INVALID_TOKEN` | 401 | 유효하지 않은 토큰 |
| `AUTH_TOKEN_EXPIRED` | 401 | 토큰 만료 |
| `AUTH_FORBIDDEN` | 403 | 접근 권한 없음 |
| `AUTH_OTP_INVALID` | 401 | 유효하지 않은 OTP |
| `AUTH_OTP_EXPIRED` | 401 | OTP 만료 |
| `AUTH_OTP_ALREADY_USED` | 401 | 이미 사용된 OTP |

전체 에러 코드는 `src/common/constants/error-codes.ts` 참조

## 토큰 만료 시간

- **Access Token**: 30분
- **Refresh Token**: 7일
- **OTP Code**: 5분

## 개발 가이드

### 새로운 모듈 추가

1. 모듈 디렉토리 생성
2. DTO, Service, Controller, Module 파일 생성
3. `app.module.ts`에 모듈 임포트

### 보호된 엔드포인트 만들기

기본적으로 모든 엔드포인트는 JWT 인증이 필요합니다 (JwtAuthGuard 전역 적용).

```typescript
@Controller('users')
export class UserController {
  // 인증 필요 (기본)
  @Get('/me')
  async getMe(@CurrentUser() user: CurrentUserPayload) {
    return user;
  }
}
```

### 공개 엔드포인트 만들기

`@Public()` 데코레이터를 사용하여 인증을 건너뜁니다.

```typescript
@Controller('public')
export class PublicController {
  @Public()
  @Get('/health')
  async healthCheck() {
    return { status: 'ok' };
  }
}
```

### 역할 기반 접근 제어

`@Roles()` 데코레이터로 특정 역할만 접근 가능하도록 설정합니다.

```typescript
import { Roles } from '../common/decorators/roles.decorator';

@Controller('admin')
export class AdminController {
  @Roles('ADMIN')
  @Get('/dashboard')
  async getDashboard() {
    return { message: 'Admin only' };
  }
}
```

## TODO

### 즉시 해야 할 일

- [ ] 이메일 발송 서비스 구현 (현재는 로그로만 출력)
- [ ] 실제 SMTP 서버 연동
- [ ] 테스트 코드 작성

### 향후 개선 사항

- [ ] API 문서화 (Swagger)
- [ ] Rate Limiting
- [ ] 로깅 시스템 개선
- [ ] 헬스 체크 엔드포인트
- [ ] Docker 설정

## 라이선스

MIT
