# 🔒 보안/무결성 점검 보고서 (Q3)

**작성일**: 2025-11-17
**대상**: 사우회 선거 시스템 백엔드 API
**점검 범위**: Auth, Vote, Recommend, Candidate, User, Admin API

---

## 📋 목차

1. [보안 이슈 요약](#보안-이슈-요약)
2. [HIGH 위험도 이슈](#high-위험도-이슈)
3. [MEDIUM 위험도 이슈](#medium-위험도-이슈)
4. [LOW 위험도 이슈](#low-위험도-이슈)
5. [권장 보안 강화 사항](#권장-보안-강화-사항)
6. [수정 우선순위 및 작업 계획](#수정-우선순위-및-작업-계획)

---

## 보안 이슈 요약

| 위험도 | 발견 건수 | 즉시 수정 필요 | 단기 수정 | 장기 개선 |
|--------|----------|---------------|----------|----------|
| 🔴 HIGH | **5건** | 5건 | 0건 | 0건 |
| 🟡 MEDIUM | **8건** | 0건 | 8건 | 0건 |
| 🟢 LOW | **6건** | 0건 | 0건 | 6건 |
| **합계** | **19건** | **5건** | **8건** | **6건** |

---

## 🔴 HIGH 위험도 이슈

### H1. 투표 익명성 위배 - 감사 로그에 투표 내용 기록

**파일**: `apps/backend/src/audit/audit.service.ts:86-105`

**문제점**:
```typescript
// ❌ 현재 (위험)
async logVote(
  userId: string,
  electionId: string,
  candidateId: string,  // ❌ 후보 ID 로깅 → 투표 내용 유추 가능
  ipAddress: string,
  userAgent: string,
) {
  return this.log({
    userId,
    ipAddress,
    userAgent,
    action: 'VOTE',
    resource: `election:${electionId}`,
    metadata: {
      electionId,
      candidateId,  // ❌ 민감 정보 저장
    },
    statusCode: 201,
  });
}
```

**위험 시나리오**:
1. 관리자/감사가 AccessLog 테이블 조회
2. `userId` + `candidateId` 조합으로 누가 누구에게 투표했는지 알 수 있음
3. **투표 익명성 완전 위배** → 법적/윤리적 문제

**영향도**:
- ⚠️ **투표 무결성 위배**
- ⚠️ **개인정보보호법 위반 가능성**
- ⚠️ **선거 공정성 훼손**

**수정 방안**:

```typescript
// ✅ 수정안 1: candidateId 제거 (권장)
async logVote(
  userId: string,
  electionId: string,
  // candidateId 매개변수 제거
  ipAddress: string,
  userAgent: string,
) {
  return this.log({
    userId,
    ipAddress,
    userAgent,
    action: 'VOTE',
    resource: `election:${electionId}`,
    metadata: {
      electionId,
      // candidateId 제거
      votedAt: new Date().toISOString(),
    },
    statusCode: 201,
  });
}

// ✅ 수정안 2: 해시화 (익명성 보장)
async logVote(
  userId: string,
  electionId: string,
  ballotHash: string,  // ✅ 해시값만 기록
  ipAddress: string,
  userAgent: string,
) {
  return this.log({
    userId,
    ipAddress,
    userAgent,
    action: 'VOTE',
    resource: `election:${electionId}`,
    metadata: {
      electionId,
      ballotHash,  // ✅ 해시값으로 무결성 검증만 가능
    },
    statusCode: 201,
  });
}
```

**우선순위**: 🔥 **즉시 수정 (P0)**

---

### H2. 투표 진행 중 득표 수(voteCount) 실시간 노출

**파일**:
- `apps/backend/src/candidate/candidate.controller.ts:76-81` (getCandidates)
- `apps/backend/src/candidate/dto/candidate-response.dto.ts`

**문제점**:
```typescript
// ❌ 현재: 투표 진행 중에도 voteCount 노출
@Get('elections/:electionId/candidates')
async getCandidates(@Param('electionId') electionId: string) {
  const result = await this.candidateService.getCandidates(electionId);
  // result에 voteCount 포함됨
  return BaseResponseDto.success(result);
}
```

**위험 시나리오**:
1. 투표 진행 중 실시간으로 득표 수 확인 가능
2. **밴드왜건 효과** (Bandwagon Effect): 많이 받은 후보에게 몰표
3. **언더독 효과** (Underdog Effect): 적게 받은 후보 지지
4. 투표 결과에 영향을 미쳐 선거 공정성 훼손

**영향도**:
- ⚠️ **선거 공정성 심각 훼손**
- ⚠️ **유권자 투표 행태 조작 가능**

**수정 방안**:

```typescript
// ✅ 수정안: 선거 상태에 따라 voteCount 필터링
async getCandidates(electionId: string) {
  const election = await this.prisma.electionRound.findUnique({
    where: { id: electionId },
  });

  const candidates = await this.prisma.candidate.findMany({
    where: {
      electionId,
      status: CandidateStatus.ACCEPTED,
    },
    include: {
      user: true,
      _count: {
        select: {
          recommendations: true,
        },
      },
    },
  });

  // ✅ 투표 진행 중(VOTING)이면 voteCount 숨김
  return candidates.map((candidate) => ({
    ...candidate,
    voteCount: election.status === 'CLOSED' ? candidate.voteCount : undefined,  // ✅ 투표 종료 후에만 노출
    recommendationCount: candidate._count.recommendations,
  }));
}
```

**또는 DTO 레벨에서 처리**:

```typescript
// ✅ CandidateResponseDto 수정
export class CandidateResponseDto {
  // ... 기존 필드들 ...

  /**
   * 득표 수 (선거 종료 후에만 노출)
   */
  voteCount?: number;  // ✅ optional로 변경

  static fromPrisma(candidate: any, electionStatus?: string): CandidateResponseDto {
    return {
      id: candidate.id,
      userId: candidate.userId,
      // ... 기타 필드들 ...
      // ✅ CLOSED 상태에서만 voteCount 노출
      voteCount: electionStatus === 'CLOSED' ? candidate.voteCount : undefined,
    };
  }
}
```

**우선순위**: 🔥 **즉시 수정 (P0)**

---

### H3. 투표 결과 API 권한 체크 미흡

**파일**: `apps/backend/src/vote/vote.controller.ts:100-107`

**문제점**:
```typescript
// ✅ 현재는 올바름 (ADMIN, AUDITOR만 접근 가능)
@Roles(UserRole.ADMIN, UserRole.AUDITOR)
@Get(':electionId/result')
async getResultDetail(
  @Param('electionId', ParseUUIDPipe) electionId: string,
): Promise<BaseResponseDto<ResultDetailResponseDto>> {
  const result = await this.voteService.getResultDetail(electionId);
  return BaseResponseDto.success(result);
}
```

**그러나 추가 검증 필요**:
1. **선거 종료 여부 확인**: CLOSED 상태에서만 조회 가능해야 함
2. **결과 발표 시점 제어**: 관리자가 명시적으로 "결과 발표" 액션을 수행한 후에만 조회 가능

**수정 방안**:

```typescript
// ✅ 수정안: 선거 상태 검증 추가
@Roles(UserRole.ADMIN, UserRole.AUDITOR)
@Get(':electionId/result')
async getResultDetail(
  @Param('electionId', ParseUUIDPipe) electionId: string,
): Promise<BaseResponseDto<ResultDetailResponseDto>> {
  // ✅ 선거 상태 확인
  const election = await this.electionService.findOne(electionId);

  if (election.status !== ElectionStatus.CLOSED) {
    throw new BusinessException(
      ErrorCode.ELECTION_NOT_CLOSED,
      '선거가 종료된 후에만 결과를 조회할 수 있습니다.',
    );
  }

  const result = await this.voteService.getResultDetail(electionId);
  return BaseResponseDto.success(result);
}
```

**또는 ElectionRound에 `isResultPublished` 플래그 추가**:

```prisma
// prisma/schema.prisma
model ElectionRound {
  // ... 기존 필드들 ...
  isResultPublished Boolean @default(false) @map("is_result_published")
}
```

```typescript
// ✅ 결과 발표 플래그 확인
if (!election.isResultPublished) {
  throw new BusinessException(
    ErrorCode.ELECTION_RESULT_NOT_PUBLISHED,
    '결과가 아직 발표되지 않았습니다.',
  );
}
```

**우선순위**: 🔥 **즉시 수정 (P0)**

---

### H4. Rate Limiting 미구현 - 무차별 대입 공격 취약

**파일**: 전체 API 엔드포인트

**문제점**:
- OTP 요청 API에 Rate Limiting 없음 → 무차별 대입 공격 가능
- 투표 API에 Rate Limiting 없음 → DDoS 공격 가능
- 로그인 시도 횟수 제한 없음 → Brute Force 공격 가능

**위험 시나리오**:
1. **OTP 무차별 대입**: `/auth/request-otp`를 반복 호출하여 OTP 코드 추측
2. **투표 API 남용**: 대량 요청으로 서버 다운
3. **계정 탈취**: 로그인 시도 무제한 반복

**영향도**:
- ⚠️ **서비스 가용성 위협**
- ⚠️ **계정 보안 취약**

**수정 방안**:

```bash
# 1. NestJS Throttler 설치
npm install @nestjs/throttler
```

```typescript
// ✅ app.module.ts에 Throttler 추가
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';

@Module({
  imports: [
    // Rate Limiting 설정
    ThrottlerModule.forRoot([{
      ttl: 60000,  // 1분
      limit: 10,   // 최대 10회 요청
    }]),
    // ... 기타 모듈들
  ],
  providers: [
    // 전역 Throttler Guard
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    // ... 기존 Guards
  ],
})
export class AppModule {}
```

```typescript
// ✅ 특정 엔드포인트에 커스텀 Rate Limit 적용
import { Throttle } from '@nestjs/throttler';

// OTP 요청: 1분에 3회 제한
@Throttle({ default: { limit: 3, ttl: 60000 } })
@Public()
@Post('request-otp')
async requestOtp(@Body() dto: RequestOtpDto) {
  const result = await this.authService.requestOtp(dto);
  return BaseResponseDto.success(result);
}

// OTP 검증: 1분에 5회 제한
@Throttle({ default: { limit: 5, ttl: 60000 } })
@Public()
@Post('verify-otp')
async verifyOtp(@Body() dto: VerifyOtpDto) {
  const result = await this.authService.verifyOtp(dto);
  return BaseResponseDto.success(result);
}

// 투표: 1분에 10회 제한
@Throttle({ default: { limit: 10, ttl: 60000 } })
@Post(':electionId/votes')
async createVotes(/* ... */) {
  // ...
}
```

**우선순위**: 🔥 **즉시 수정 (P0)**

---

### H5. JWT Secret 하드코딩 가능성

**파일**: `apps/backend/src/auth/auth.module.ts` (추정)

**문제점**:
```typescript
// ❌ 잠재적 위험: JWT Secret이 코드에 하드코딩되어 있을 가능성
JwtModule.register({
  secret: 'my-secret-key',  // ❌ 하드코딩
  signOptions: { expiresIn: '1h' },
})
```

**위험 시나리오**:
1. 소스 코드가 유출되면 JWT 위조 가능
2. 모든 사용자 계정 탈취 가능

**영향도**:
- ⚠️ **전체 시스템 보안 붕괴**

**수정 방안**:

```typescript
// ✅ 환경 변수로 관리
import { ConfigService } from '@nestjs/config';

@Module({
  imports: [
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),  // ✅ 환경 변수
        signOptions: {
          expiresIn: configService.get<string>('JWT_EXPIRES_IN', '30m'),
        },
      }),
    }),
  ],
})
export class AuthModule {}
```

```env
# .env (Git에 커밋하지 말 것!)
JWT_SECRET=super-secure-random-256-bit-key-change-in-production-abc123xyz456
JWT_EXPIRES_IN=30m
JWT_REFRESH_EXPIRES_IN=7d

# Ballot Hash Secret
BALLOT_SECRET_SALT=another-super-secure-random-salt-for-ballot-hash-xyz789
```

```.gitignore
# 환경 변수 파일 제외
.env
.env.local
.env.production
```

**우선순위**: 🔥 **즉시 수정 (P0)**

---

## 🟡 MEDIUM 위험도 이슈

### M1. 입력 Validation 부분 누락

**파일**: 여러 DTO 파일

**문제점**:
```typescript
// ✅ 대부분 validation 있음
export class CreateVoteDto {
  @IsOptional()
  @IsUUID('4', { message: '회장 후보 ID는 유효한 UUID여야 합니다.' })
  presidentCandidateId?: string;
}

// ❌ 그러나 일부 필드에서 추가 검증 필요
export class CreateElectionDto {
  @IsString()
  name: string;  // ✅ 있음

  @IsOptional()
  @IsString()
  description?: string;  // ❌ 길이 제한 없음 → DoS 가능

  @IsInt()
  @Min(1)
  maxRecommendations: number;  // ❌ Max 제한 없음 → 비정상적으로 큰 값 가능
}
```

**수정 방안**:

```typescript
// ✅ 추가 validation
import { IsString, Length, Min, Max } from 'class-validator';

export class CreateElectionDto {
  @IsString()
  @Length(1, 200, { message: '선거명은 1-200자여야 합니다.' })
  name: string;

  @IsOptional()
  @IsString()
  @Length(0, 2000, { message: '설명은 2000자 이하여야 합니다.' })
  description?: string;

  @IsInt()
  @Min(1, { message: '최대 추천 수는 최소 1명입니다.' })
  @Max(10, { message: '최대 추천 수는 10명을 초과할 수 없습니다.' })
  maxRecommendations: number;
}

// 추천 이유 길이 제한
export class CreateRecommendationDto {
  // ... 기존 필드들 ...

  @IsOptional()
  @IsString()
  @Length(0, 1000, { message: '추천 이유는 1000자 이하여야 합니다.' })
  reason?: string;
}

// 후보 공약 길이 제한
export class UpdateCandidateStatusDto {
  // ... 기존 필드들 ...

  @IsOptional()
  @IsString()
  @Length(0, 3000, { message: '공약은 3000자 이하여야 합니다.' })
  statement?: string;
}
```

**우선순위**: ⚡ **단기 수정 (P1)**

---

### M2. 사용자 활성화 상태 검증 누락

**파일**: 여러 서비스 파일

**문제점**:
```typescript
// ❌ 투표 생성 시 투표자의 활성화 상태 확인 안 함
async createVotes(electionId: string, userId: string, dto: CreateVoteDto) {
  // userId가 비활성 사용자여도 투표 가능
}

// ❌ 추천 생성 시 추천자의 활성화 상태 확인 안 함
async create(electionId: string, recommenderId: string, dto: CreateRecommendationDto) {
  // recommenderId가 비활성 사용자여도 추천 가능
}
```

**수정 방안**:

```typescript
// ✅ 투표 생성 시 검증 추가
async createVotes(electionId: string, userId: string, dto: CreateVoteDto) {
  // ✅ 투표자 활성화 상태 확인
  const voter = await this.prisma.user.findUnique({
    where: { id: userId },
  });

  if (!voter || !voter.isActive) {
    throw new BusinessException(
      ErrorCode.USER_INACTIVE,
      '비활성화된 사용자는 투표할 수 없습니다.',
    );
  }

  // ... 기존 로직
}

// ✅ 추천 생성 시 검증 추가
async create(electionId: string, recommenderId: string, dto: CreateRecommendationDto) {
  // ✅ 추천자 활성화 상태 확인
  const recommender = await this.prisma.user.findUnique({
    where: { id: recommenderId },
  });

  if (!recommender || !recommender.isActive) {
    throw new BusinessException(
      ErrorCode.USER_INACTIVE,
      '비활성화된 사용자는 추천할 수 없습니다.',
    );
  }

  // ... 기존 로직
}
```

**우선순위**: ⚡ **단기 수정 (P1)**

---

### M3. OTP 코드 보안 강화 필요

**파일**: `apps/backend/src/auth/auth.service.ts:300-302`

**문제점**:
```typescript
// ❌ 현재: Math.random() 사용 (예측 가능성 있음)
private generateOtpCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}
```

**위험도**: Medium (예측 가능성은 낮지만 암호학적으로 안전하지 않음)

**수정 방안**:

```typescript
// ✅ crypto 모듈 사용 (암호학적으로 안전)
import { randomInt } from 'crypto';

private generateOtpCode(): string {
  return randomInt(100000, 999999).toString();
}

// ✅ 또는 더 강력한 OTP 생성
import { randomBytes } from 'crypto';

private generateOtpCode(): string {
  const buffer = randomBytes(3);
  const num = buffer.readUIntBE(0, 3) % 900000 + 100000;
  return num.toString();
}
```

**우선순위**: ⚡ **단기 수정 (P1)**

---

### M4. OTP 재사용 공격 방지 미흡

**파일**: `apps/backend/src/auth/auth.service.ts:65-119`

**문제점**:
- 현재는 `isUsed` 플래그로 재사용 방지
- 그러나 **같은 이메일에 대한 OTP를 여러 개 발급할 수 있음**
- 공격자가 여러 OTP를 발급받아 무차별 대입 가능

**수정 방안**:

```typescript
// ✅ OTP 요청 시 기존 미사용 OTP 무효화
async requestOtp(dto: RequestOtpDto): Promise<{ message: string }> {
  const { email } = dto;

  const user = await this.prisma.user.findUnique({
    where: { email },
  });

  if (!user || !user.isActive) {
    throw new BusinessException(/* ... */);
  }

  // ✅ 기존 미사용 OTP 모두 무효화
  await this.prisma.otpToken.updateMany({
    where: {
      userId: user.id,
      purpose: 'login',
      isUsed: false,
      expiresAt: { gte: new Date() },  // 아직 만료되지 않은 것만
    },
    data: {
      isUsed: true,  // 무효화
      usedAt: new Date(),
    },
  });

  // 새 OTP 생성
  const otpCode = this.generateOtpCode();
  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + this.OTP_EXPIRY_MINUTES);

  await this.prisma.otpToken.create({
    data: {
      userId: user.id,
      token: otpCode,
      purpose: 'login',
      expiresAt,
      isUsed: false,
    },
  });

  this.logger.log(`OTP generated for user ${user.email}: ${otpCode}`);

  return {
    message: 'OTP 코드가 이메일로 발송되었습니다.',
  };
}
```

**우선순위**: ⚡ **단기 수정 (P1)**

---

### M5. 비밀번호/인증 정보 로그 노출 위험

**파일**: 여러 로깅 지점

**문제점**:
```typescript
// ❌ 잠재적 위험: 로그에 민감 정보 출력 가능성
this.logger.log(`OTP generated for user ${user.email}: ${otpCode}`);
// ❌ 프로덕션에서 OTP 코드 노출 위험
```

**수정 방안**:

```typescript
// ✅ 환경별 로깅 레벨 조정
const isDevelopment = process.env.NODE_ENV === 'development';

if (isDevelopment) {
  this.logger.log(`OTP generated for user ${user.email}: ${otpCode}`);
} else {
  this.logger.log(`OTP generated for user ${user.email}`);  // OTP 코드 제거
}

// ✅ 또는 마스킹
this.logger.log(
  `OTP generated for user ${user.email}: ${otpCode.slice(0, 2)}****`
);
```

**우선순위**: ⚡ **단기 수정 (P1)**

---

### M6. CORS 설정 검증 필요

**파일**: `apps/backend/src/main.ts` (추정)

**문제점**:
- CORS 설정이 너무 관대할 경우 CSRF 공격 가능
- 또는 CORS 미설정으로 프론트엔드 연결 불가

**수정 방안**:

```typescript
// ✅ main.ts에서 CORS 설정
async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // CORS 설정
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',  // ✅ 특정 도메인만 허용
    credentials: true,  // 쿠키 전송 허용
    methods: ['GET', 'POST', 'PATCH', 'DELETE'],  // 허용할 HTTP 메서드
    allowedHeaders: ['Content-Type', 'Authorization'],  // 허용할 헤더
  });

  // 프로덕션에서는 여러 도메인 허용 가능
  if (process.env.NODE_ENV === 'production') {
    app.enableCors({
      origin: [
        'https://election.example.com',
        'https://admin.election.example.com',
      ],
      credentials: true,
      methods: ['GET', 'POST', 'PATCH', 'DELETE'],
    });
  }

  await app.listen(3000);
}
```

**우선순위**: ⚡ **단기 수정 (P1)**

---

### M7. SQL Injection 방지 확인 (Prisma 사용으로 대부분 안전)

**파일**: 전체 서비스 파일

**현재 상태**: ✅ **대부분 안전**
- Prisma ORM 사용으로 SQL Injection 자동 방지
- 모든 쿼리가 Parameterized Query로 실행됨

**주의사항**:
- `$executeRawUnsafe()` 사용 시 주의 필요
- 현재 코드에서는 사용하지 않음 → 안전

**확인 필요**:
```typescript
// ❌ 사용하지 말 것
await prisma.$executeRawUnsafe(`DELETE FROM users WHERE id = '${userId}'`);

// ✅ 사용해야 함
await prisma.$executeRaw`DELETE FROM users WHERE id = ${userId}`;
```

**우선순위**: ⚡ **단기 검증 (P2)**

---

### M8. XSS 방지 (프론트엔드 주요 대상이나 백엔드도 확인)

**파일**: Response DTO들

**현재 상태**: ✅ **대부분 안전**
- NestJS가 JSON 응답 시 자동 이스케이프
- React도 자동 이스케이프

**주의사항**:
- 사용자 입력 데이터를 그대로 HTML로 렌더링하지 말 것
- `dangerouslySetInnerHTML` 사용 금지

**추가 보안**:
```typescript
// ✅ Helmet 미들웨어 추가 (프로덕션 권장)
import helmet from '@fastify/helmet';  // Fastify 사용 시
// 또는
import helmet from 'helmet';  // Express 사용 시

// main.ts
app.use(helmet());  // XSS, CSP 등 보안 헤더 자동 설정
```

**우선순위**: ⚡ **단기 개선 (P2)**

---

## 🟢 LOW 위험도 이슈

### L1. 민감 정보 응답에서 선택적 제외 필요

**파일**: 여러 Response DTO

**문제점**:
```typescript
// ❌ 사용자 정보에 모든 필드 노출
export class UserResponseDto {
  id: string;
  employeeNo: string;
  email: string;  // ❌ 이메일 전체 노출 (부분 마스킹 고려)
  name: string;
  department: string | null;
  position: string | null;
  role: string;
  isActive: boolean;  // ❌ 활성화 상태 노출 (내부 정보)
  createdAt: Date;
  updatedAt: Date;
}
```

**수정 방안**:

```typescript
// ✅ 컨텍스트별 DTO 분리
export class PublicUserDto {
  id: string;
  name: string;
  department: string | null;
  position: string | null;
  // email, isActive, role 등 제외
}

export class PrivateUserDto extends PublicUserDto {
  employeeNo: string;
  email: string;
  role: string;
  isActive: boolean;
}

// ✅ 이메일 마스킹
export function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  const maskedLocal = local.slice(0, 2) + '***';
  return `${maskedLocal}@${domain}`;
}

// 사용 예
{
  email: maskEmail(user.email),  // "us***@example.com"
}
```

**우선순위**: 🔵 **장기 개선 (P3)**

---

### L2. 감사 로그에 IP 주소 수집 (GDPR 고려)

**파일**: `apps/backend/src/audit/audit.service.ts`

**문제점**:
- IP 주소는 개인정보로 간주될 수 있음 (GDPR, 개인정보보호법)
- 장기 보관 시 법적 이슈 가능

**수정 방안**:

```typescript
// ✅ IP 주소 해시화 또는 익명화
import { createHash } from 'crypto';

function hashIpAddress(ip: string): string {
  return createHash('sha256')
    .update(ip + process.env.IP_HASH_SALT)
    .digest('hex')
    .slice(0, 16);  // 16자리만 저장
}

// 사용
async log(data: AccessLogData) {
  return await this.prisma.accessLog.create({
    data: {
      // ...
      ipAddress: hashIpAddress(data.ipAddress),  // ✅ 해시화
      // ...
    },
  });
}

// ✅ 또는 IP 보관 기간 설정 (30일 후 삭제)
async cleanupOldLogs() {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  await this.prisma.accessLog.deleteMany({
    where: {
      createdAt: { lt: thirtyDaysAgo },
    },
  });
}
```

**우선순위**: 🔵 **장기 개선 (P3)**

---

### L3. 에러 메시지에서 내부 정보 노출 방지

**파일**: 여러 Exception 처리

**현재 상태**: ✅ **대부분 안전**
- BusinessException으로 사용자 친화적 메시지 반환

**주의사항**:
```typescript
// ❌ 내부 에러 상세 정보 노출 금지
catch (error) {
  throw new Error(error.stack);  // ❌ Stack trace 노출
}

// ✅ 사용자에게는 일반적인 메시지만
catch (error) {
  this.logger.error(`Internal error: ${error.stack}`);  // 서버 로그에만 기록
  throw new BusinessException(
    ErrorCode.SYSTEM_INTERNAL_ERROR,
    '서버 오류가 발생했습니다.',  // ✅ 일반적인 메시지
  );
}
```

**우선순위**: 🔵 **장기 검증 (P3)**

---

### L4. API 버전 관리 부재

**문제점**:
- API 변경 시 하위 호환성 유지 어려움

**수정 방안**:

```typescript
// ✅ API 버전 관리
@Controller('v1/elections')  // 버전 접두사
export class ElectionController {
  // ...
}

// main.ts
app.setGlobalPrefix('api/v1');  // 전역 버전 설정
```

**우선순위**: 🔵 **장기 개선 (P3)**

---

### L5. 헬스체크 엔드포인트 추가 권장

**문제점**:
- 서버 상태 확인 엔드포인트 없음

**수정 방안**:

```typescript
// ✅ health.controller.ts 생성
@Controller('health')
export class HealthController {
  @Public()
  @Get()
  check() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }

  @Public()
  @Get('db')
  async checkDb(@Inject(PrismaService) prisma: PrismaService) {
    try {
      await prisma.$queryRaw`SELECT 1`;
      return { status: 'ok', database: 'connected' };
    } catch (error) {
      return { status: 'error', database: 'disconnected' };
    }
  }
}
```

**우선순위**: 🔵 **장기 개선 (P3)**

---

### L6. 로깅 레벨 및 구조화 개선

**문제점**:
- 로그가 일관되지 않은 형식
- 구조화된 로깅 미사용

**수정 방안**:

```bash
# Winston 또는 Pino 사용
npm install nest-winston winston
```

```typescript
// ✅ 구조화된 로깅
import { WinstonModule } from 'nest-winston';
import * as winston from 'winston';

WinstonModule.forRoot({
  transports: [
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      format: winston.format.json(),
    }),
    new winston.transports.File({
      filename: 'logs/combined.log',
      format: winston.format.json(),
    }),
  ],
});
```

**우선순위**: 🔵 **장기 개선 (P3)**

---

## 권장 보안 강화 사항

### 1. 추가 감사 로깅 포인트

현재 감사 로그가 있지만, 다음 액션들도 추가로 로깅 권장:

```typescript
// ✅ 추가 로깅 포인트
- 선거 정보 수정 (ELECTION_UPDATE)
- 후보 상태 변경 (CANDIDATE_STATUS_CHANGE)
- 사용자 역할 변경 (USER_ROLE_CHANGE)
- 사용자 활성화/비활성화 (USER_ACTIVATION_CHANGE)
- 결과 조회 (RESULT_VIEW) - 누가 언제 결과를 조회했는지
- OTP 요청 실패 (OTP_REQUEST_FAILED)
- 로그인 실패 (LOGIN_FAILED)
- 권한 없는 접근 시도 (UNAUTHORIZED_ACCESS)
```

**구현 예시**:

```typescript
// ✅ 결과 조회 로깅
@Roles(UserRole.ADMIN, UserRole.AUDITOR)
@Get(':electionId/result')
async getResultDetail(
  @Param('electionId') electionId: string,
  @CurrentUser('userId') userId: string,
  @Req() request: Request,
) {
  const result = await this.voteService.getResultDetail(electionId);

  // ✅ 감사 로그 기록
  await this.auditService.log({
    userId,
    ipAddress: request.ip,
    userAgent: request.headers['user-agent'],
    action: 'RESULT_VIEW',
    resource: `election:${electionId}`,
    metadata: { electionId },
  });

  return BaseResponseDto.success(result);
}
```

---

### 2. 숨겨야 할 필드 정리

#### 투표 진행 중 (VOTING 상태)
```typescript
// ❌ 노출 금지
- voteCount (후보별 득표 수)
- 실시간 투표율

// ✅ 노출 가능
- 후보 정보 (이름, 소속, 공약)
- 선거 기본 정보
```

#### 투표 종료 후 (CLOSED 상태)
```typescript
// ✅ 노출 가능
- voteCount (득표 수)
- 투표율
- 당선자 정보

// ❌ 노출 금지 (관리자/감사 제외)
- 개별 투표 레코드 (voterId + candidateId 조합)
- ballotHash
```

#### 사용자 정보
```typescript
// ✅ 공개 정보
- id, name, department, position

// ❌ 제한 정보 (본인 또는 관리자만)
- email (전체), employeeNo, role, isActive

// ✅ 부분 공개 (마스킹)
- email: "us***@example.com"
```

---

## 수정 우선순위 및 작업 계획

### 🔥 Phase 1: 즉시 수정 (1-2일)

| 우선순위 | 이슈 | 파일 | 예상 시간 |
|---------|------|------|----------|
| P0-1 | H1. 투표 로깅 익명성 | audit.service.ts | 30분 |
| P0-2 | H2. voteCount 숨김 | candidate.service.ts | 1시간 |
| P0-3 | H3. 결과 API 권한 강화 | vote.controller.ts | 30분 |
| P0-4 | H4. Rate Limiting | app.module.ts | 1시간 |
| P0-5 | H5. JWT Secret 환경변수화 | auth.module.ts | 30분 |

**총 예상 시간**: 3.5시간

---

### ⚡ Phase 2: 단기 수정 (3-5일)

| 우선순위 | 이슈 | 파일 | 예상 시간 |
|---------|------|------|----------|
| P1-1 | M1. Validation 강화 | 모든 DTO | 2시간 |
| P1-2 | M2. 사용자 활성화 검증 | vote/recommend services | 1시간 |
| P1-3 | M3. OTP 보안 강화 | auth.service.ts | 30분 |
| P1-4 | M4. OTP 재사용 방지 | auth.service.ts | 1시간 |
| P1-5 | M5. 로깅 마스킹 | 전체 | 1시간 |
| P1-6 | M6. CORS 설정 | main.ts | 30분 |
| P1-7 | 추가 감사 로깅 | 여러 controllers | 2시간 |

**총 예상 시간**: 8시간

---

### 🔵 Phase 3: 장기 개선 (1-2주)

| 우선순위 | 이슈 | 파일 | 예상 시간 |
|---------|------|------|----------|
| P3-1 | L1. 민감 정보 마스킹 | DTO들 | 2시간 |
| P3-2 | L2. IP 해시화 | audit.service.ts | 1시간 |
| P3-3 | L4. API 버전 관리 | 전체 controllers | 2시간 |
| P3-4 | L5. 헬스체크 | health.controller.ts | 1시간 |
| P3-5 | L6. 구조화 로깅 | 전체 | 3시간 |

**총 예상 시간**: 9시간

---

## ✅ 체크리스트

### 즉시 수정 필요 (P0)
- [ ] 투표 로그에서 candidateId 제거
- [ ] 투표 진행 중 voteCount 숨김 처리
- [ ] 결과 API 선거 상태 검증 추가
- [ ] Rate Limiting 구현
- [ ] JWT Secret 환경 변수화

### 단기 수정 (P1)
- [ ] DTO Validation 강화
- [ ] 사용자 활성화 상태 검증
- [ ] OTP 보안 강화
- [ ] OTP 재사용 방지
- [ ] 로그 마스킹
- [ ] CORS 설정 확인
- [ ] 추가 감사 로깅 포인트

### 장기 개선 (P3)
- [ ] 민감 정보 마스킹
- [ ] IP 주소 해시화
- [ ] API 버전 관리
- [ ] 헬스체크 엔드포인트
- [ ] 구조화된 로깅

---

**보고서 작성**: 2025-11-17
**다음 리뷰 일정**: Phase 1 완료 후 (2-3일 후)

