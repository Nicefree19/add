# B0 단계: TechSpec 검토 이슈 및 개선안

## 문서 정보
- 작성일: 2025-11-17
- 검토 대상: docs/TechSpec.md v1.0
- 검토자: Backend Architect
- 목적: NestJS + Prisma + PostgreSQL 관점의 구현 전 이슈 식별 및 해결

---

## 검토 방법론

1. **TechSpec.md** 전체 검토
2. **prisma-schema-draft.prisma** 관계 및 제약조건 분석
3. **API-Spec.md** 엔드포인트 및 트랜잭션 검증
4. **State-Transition-Rules.md** 비즈니스 로직 확인

---

## 🔴 Critical Issues (구현 전 필수 수정)

### ISSUE-1: TransitionDoc.uploadedBy User 관계 부재

**우선순위:** 🔴 Critical
**영향도:** 감사 추적 불가, 데이터 무결성 부족

**현재 상태:**
```prisma
model TransitionDoc {
  uploadedBy  String?  // 단순 문자열
}
```

**문제점:**
- 문서 업로드자 추적 불가
- 관리자 변경 시 이력 손실
- User 삭제 시 참조 무결성 깨짐

**해결책:**
```prisma
model TransitionDoc {
  uploadedBy    String?
  uploader      User?    @relation(fields: [uploadedBy], references: [id], onDelete: SetNull)

  @@index([uploadedBy])
}

// User 모델에 추가
model User {
  uploadedDocs  TransitionDoc[]
}
```

**구현 시 주의사항:**
- `onDelete: SetNull`: 업로더 삭제 시 문서는 유지 (orphan record)
- 인덱스 추가로 "특정 사용자가 업로드한 문서 조회" 성능 확보
- API 응답에 uploader 정보 포함 (이름, 부서)

**검증 방법:**
```typescript
// 테스트 케이스
it('should preserve transition doc when uploader is deleted', async () => {
  const doc = await createTransitionDoc({ uploadedBy: user.id });
  await deleteUser(user.id);

  const preserved = await prisma.transitionDoc.findUnique({
    where: { id: doc.id }
  });

  expect(preserved).toBeDefined();
  expect(preserved.uploadedBy).toBeNull();
});
```

---

### ISSUE-2: Refresh Token 저장소 부재

**우선순위:** 🔴 Critical
**영향도:** 보안 취약점 (탈취 시 무효화 불가)

**현재 상태:**
- TechSpec에서 "JWT Refresh Token" 언급
- Prisma Schema에 저장 모델 없음

**문제점:**
1. Refresh Token 탈취 시 무효화 불가
2. 로그아웃 구현 불가 (토큰은 계속 유효)
3. 토큰 재사용 공격(Replay Attack) 방어 불가
4. NFR-3 (보안 요구사항) 미충족

**해결책:**
```prisma
model RefreshToken {
  id          String    @id @default(cuid())
  userId      String
  token       String    @unique  // bcrypt 해시 저장
  expiresAt   DateTime
  revokedAt   DateTime?
  createdAt   DateTime  @default(now())

  user        User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([expiresAt])
  @@index([revokedAt])
  @@map("refresh_tokens")
}

// User 모델에 추가
model User {
  refreshTokens  RefreshToken[]
}
```

**구현 시 주의사항:**
1. 토큰 저장 전 해시화:
```typescript
import * as bcrypt from 'bcrypt';

async function storeRefreshToken(userId: string, token: string) {
  const hashedToken = await bcrypt.hash(token, 10);

  return await prisma.refreshToken.create({
    data: {
      userId,
      token: hashedToken,
      expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) // 90일
    }
  });
}
```

2. 로그아웃 구현:
```typescript
async function logout(userId: string, token: string) {
  const allTokens = await prisma.refreshToken.findMany({
    where: { userId, revokedAt: null }
  });

  for (const stored of allTokens) {
    const isMatch = await bcrypt.compare(token, stored.token);
    if (isMatch) {
      await prisma.refreshToken.update({
        where: { id: stored.id },
        data: { revokedAt: new Date() }
      });
      break;
    }
  }
}
```

3. Cron Job으로 만료 토큰 정리:
```typescript
@Cron('0 3 * * *') // 매일 03:00
async cleanupExpiredTokens() {
  await prisma.refreshToken.deleteMany({
    where: {
      OR: [
        { expiresAt: { lt: new Date() } },
        { revokedAt: { lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } }
      ]
    }
  });
}
```

**API 변경:**
- `POST /auth/logout` 추가 (TechSpec v1.1 반영됨)
- `POST /auth/refresh` 응답에 새 Refresh Token 포함 (Token Rotation)

---

### ISSUE-3: ElectionRound 상태 변경 이력 추적 부재

**우선순위:** 🔴 Critical
**영향도:** 감사 요구사항 (FR-8.1) 미충족

**현재 상태:**
- AccessLog에 상태 변경 기록하지만 Election 자체 히스토리 없음
- 누가, 왜 상태를 변경했는지 추적 어려움

**문제점:**
- 감사 추적 불완전
- 상태 변경 롤백 시 이전 상태 불명확
- 관리자 책임 소재 불명확

**해결책 (Option 1 권장):**
```prisma
model ElectionStatusHistory {
  id            String          @id @default(cuid())
  electionId    String
  fromStatus    ElectionStatus?
  toStatus      ElectionStatus
  changedBy     String
  reason        String?
  createdAt     DateTime        @default(now())

  election      ElectionRound   @relation(fields: [electionId], references: [id], onDelete: Cascade)
  user          User            @relation(fields: [changedBy], references: [id], onDelete: SetNull)

  @@index([electionId])
  @@index([createdAt])
  @@map("election_status_history")
}

// ElectionRound 모델에 추가
model ElectionRound {
  statusHistory  ElectionStatusHistory[]
}

// User 모델에 추가
model User {
  electionStatusChanges  ElectionStatusHistory[]
}
```

**구현 시 주의사항:**
1. 상태 변경 시 히스토리 자동 기록:
```typescript
async function changeElectionStatus(
  electionId: string,
  newStatus: ElectionStatus,
  userId: string,
  reason?: string
) {
  const election = await prisma.electionRound.findUnique({
    where: { id: electionId }
  });

  // 트랜잭션으로 원자성 보장
  return await prisma.$transaction([
    // 1. 상태 변경
    prisma.electionRound.update({
      where: { id: electionId },
      data: { status: newStatus, updatedAt: new Date() }
    }),

    // 2. 히스토리 기록
    prisma.electionStatusHistory.create({
      data: {
        electionId,
        fromStatus: election.status,
        toStatus: newStatus,
        changedBy: userId,
        reason
      }
    })
  ]);
}
```

2. API 추가:
```typescript
// GET /elections/:id/status-history
async getStatusHistory(electionId: string) {
  return await prisma.electionStatusHistory.findMany({
    where: { electionId },
    include: {
      user: {
        select: { name: true, employeeNo: true }
      }
    },
    orderBy: { createdAt: 'desc' }
  });
}
```

**검증 방법:**
```typescript
it('should record status change history', async () => {
  await changeElectionStatus(election.id, 'VOTING', admin.id, 'Start voting');

  const history = await prisma.electionStatusHistory.findFirst({
    where: { electionId: election.id }
  });

  expect(history.fromStatus).toBe('CANDIDATE_CONFIRM');
  expect(history.toStatus).toBe('VOTING');
  expect(history.changedBy).toBe(admin.id);
  expect(history.reason).toBe('Start voting');
});
```

---

## 🟡 High Priority Issues (초기 구현 시 고려)

### ISSUE-4: Recommendation.candidateUserId 검증 부재

**우선순위:** 🟡 High
**영향도:** 데이터 무결성, 후보 지정 실패 가능

**해결책:**
```prisma
model Recommendation {
  candidateUserId   String?
  candidateUser     User?   @relation("RecommendedCandidates", fields: [candidateUserId], references: [id], onDelete: SetNull)

  @@index([candidateUserId])
}

model User {
  receivedRecommendations  Recommendation[]  @relation("RecommendedCandidates")
}
```

**구현 시 주의사항:**
- 추천 제출 시 `candidateUserId` 유효성 검증:
```typescript
async function submitRecommendation(dto: CreateRecommendationDto) {
  if (dto.candidateUserId) {
    const user = await prisma.user.findUnique({
      where: { id: dto.candidateUserId }
    });

    if (!user) {
      throw new BadRequestException('RECOMMEND_CANDIDATE_NOT_FOUND');
    }

    if (user.status !== 'ACTIVE') {
      throw new BadRequestException('RECOMMEND_CANDIDATE_INACTIVE');
    }
  }

  // 추천 생성...
}
```

---

### ISSUE-5: Vote 테이블 시각별 인덱스 누락

**우선순위:** 🟡 High
**영향도:** 성능 (NFR-1: 500ms 목표)

**해결책:**
```prisma
model Vote {
  // ...
  @@index([electionId, createdAt])  // 복합 인덱스
  @@index([createdAt])              // 전체 투표 시각별 조회용
}
```

**성능 비교:**
```sql
-- Before (Full Scan)
SELECT COUNT(*) FROM votes
WHERE election_id = 'xxx' AND created_at BETWEEN '2025-01-26 09:00' AND '2025-01-26 10:00';

-- After (Index Scan)
-- 500ms → 50ms (예상)
```

---

### ISSUE-6: NotificationLog 수신자 관계 부재

**우선순위:** 🟡 High
**영향도:** 사용자별 알림 조회 어려움

**해결책:**
```prisma
model NotificationLog {
  recipientId    String?
  recipientEmail String   // 스냅샷

  recipient      User?    @relation(fields: [recipientId], references: [id], onDelete: SetNull)

  @@index([recipientId])
  @@index([recipientEmail])
}

model User {
  receivedNotifications  NotificationLog[]
}
```

**구현 시 주의사항:**
```typescript
async function sendNotification(userId: string, message: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });

  await prisma.notificationLog.create({
    data: {
      recipientId: userId,
      recipientEmail: user.email,  // 스냅샷 저장
      subject: '...',
      body: message,
      type: 'VOTING_START',
      channel: 'EMAIL'
    }
  });

  // 실제 이메일 발송...
}
```

---

## 🟢 Medium Priority Issues (추후 개선)

### ISSUE-7: OtpToken 정리 메커니즘

**해결책:**
```typescript
@Cron('0 2 * * *') // 매일 02:00
async cleanupExpiredOtp() {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const result = await prisma.otpToken.deleteMany({
    where: {
      expiresAt: { lt: sevenDaysAgo }
    }
  });

  console.log(`Cleaned up ${result.count} expired OTP tokens`);
}
```

---

### ISSUE-8: ElectionRound 생성자 정보

**해결책:**
```prisma
model ElectionRound {
  createdBy     String?
  creator       User?    @relation(fields: [createdBy], references: [id], onDelete: SetNull)

  @@index([createdBy])
}
```

---

### ISSUE-9: Candidate 중복 지정 정책 명확화

**TechSpec 확인 필요:**
"한 사용자가 한 선거에서 회장과 총무 후보를 동시에 할 수 있는가?"

**현재 제약조건:**
```prisma
@@unique([electionId, userId, forRole])
// → 동시 가능 (각 역할별로 1회)
```

**만약 동시 불가라면:**
```prisma
@@unique([electionId, userId])  // forRole 제거
```

**TechSpec v1.1에 명시:**
- FR-4.6: 한 사용자는 동일 선거에서 회장과 총무 후보를 **동시에 할 수 있다**.

---

## 🔵 API 설계 이슈

### API-ISSUE-1: 투표 제출 트랜잭션 처리

**해결책:**
```typescript
async submitVotes(electionId: string, votes: VoteDto[]) {
  // 단일 트랜잭션으로 처리
  return await prisma.$transaction(
    votes.map(vote => {
      return prisma.vote.create({
        data: {
          electionId,
          voterId: currentUser.id,
          candidateId: vote.candidateId,
          forRole: vote.forRole,
          ballotHash: generateBallotHash(...)
        }
      });
    })
  );

  // 하나라도 실패 시 전체 롤백
}
```

**TechSpec v1.1 반영:**
- FR-5.7: 회장/총무 투표는 단일 트랜잭션 처리

---

### API-ISSUE-2: 페이지네이션 규칙

**TechSpec v1.1 추가:**
```markdown
### 8.2 페이지네이션

**Query Parameters:**
- `page`: 페이지 번호 (default: 1)
- `limit`: 페이지당 항목 수 (default: 20, max: 100)

**Response:**
{
  "data": {
    "items": [...],
    "pagination": {
      "total": 500,
      "page": 1,
      "limit": 20,
      "totalPages": 25,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```

---

### API-ISSUE-3: Rate Limiting 정책

**TechSpec v1.1 추가:**
```markdown
### NFR-6 (Rate Limiting)
- OTP 요청: 5회/분 (IP 기준)
- 투표 제출: 10회/분 (사용자 기준)
- 일반 API: 100회/분 (사용자 기준)
```

**구현:**
```typescript
// NestJS Throttler
@ThrottlerGuard({ ttl: 60, limit: 5 })
@Post('/auth/request-otp')
async requestOTP() { ... }
```

---

## 🔧 구현 우선순위

### Phase 1 (B0 단계 완료 전 필수)
1. ✅ ISSUE-1: TransitionDoc.uploadedBy 관계 추가
2. ✅ ISSUE-2: RefreshToken 모델 추가
3. ✅ ISSUE-3: ElectionStatusHistory 모델 추가
4. ✅ TechSpec v1.1 작성 완료

### Phase 2 (B1~B2 단계에서 반영)
5. ✅ ISSUE-4: Recommendation.candidateUserId 외래키
6. ✅ ISSUE-5: Vote 인덱스 추가
7. ✅ ISSUE-6: NotificationLog 수신자 관계
8. ✅ ISSUE-8: ElectionRound.createdBy 추가

### Phase 3 (B6 단계에서 반영)
9. ✅ ISSUE-7: OtpToken 정리 Cron
10. ✅ API-ISSUE-3: Rate Limiting 구현

---

## 📋 다음 단계

1. **Prisma Schema v1.1 작성**: 모든 이슈 반영한 최종 스키마
2. **API Spec v1.1 작성**: 페이지네이션, Rate Limiting 반영
3. **B1 단계 진행**: AuthModule 구현 시작

---

## 체크리스트

구현 시작 전 확인:
- [ ] TechSpec v1.1 승인
- [ ] Prisma Schema v1.1 승인
- [ ] 오픈 이슈 해결 (카카오워크, 파일 저장소)
- [ ] 개발 환경 준비 (PostgreSQL, Redis, SMTP)

---

## 참고 문서

- `docs/TechSpec-v1.1-Draft.md`: 개선된 기술 명세서
- `docs/prisma-schema-draft.prisma`: v1.0 스키마 (개선 전)
- `docs/API-Spec.md`: v1.0 API 명세 (개선 전)
