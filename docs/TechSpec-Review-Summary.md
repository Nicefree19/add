# TechSpec 검토 및 보완 요약

## 📊 전체 평가

**종합 점수: 8.5/10**

- ✅ 요구사항 정의 명확성: 9/10
- ✅ 기술 스택 적절성: 9/10
- ✅ 보안 고려사항: 8/10
- ⚠️ 구현 상세도: 7/10 (보완 완료)
- ✅ 확장성 고려: 8/10

---

## ✅ 잘 작성된 부분

### 1. **명확한 범위 정의**
- 포함/제외 사항이 명확히 구분됨
- 1단계 구현과 향후 확장이 분리되어 있음
- 사내 SSO, 모바일 앱 등을 2단계로 유예한 것은 현실적

### 2. **체계적인 상태 관리**
- ElectionStatus 5단계 전이 로직 명확
- PLANNING → RECOMMEND → CANDIDATE_CONFIRM → VOTING → CLOSED
- 각 단계의 목적과 전제조건이 잘 정의됨

### 3. **보안 요구사항**
- 1인 1표 보장 (DB 제약조건 + 서비스 레벨)
- 투표 익명성 (ballotHash로 무결성만 검증)
- 감사 로그 3년 보관
- 역할 기반 접근 제어 (MEMBER/ADMIN/AUDITOR)

### 4. **기술 스택 선택**
- Next.js 14 (App Router) + NestJS: 최신이면서 검증된 조합
- Prisma ORM: 타입 안전성 + 개발 생산성
- PostgreSQL: 트랜잭션, 제약조건 지원 우수
- JWT + OTP: 사내 시스템에 적합한 인증 방식

---

## 🔧 보완 완료 사항

### 1. **Prisma Schema 구체화** ✅
**문제:** 원본 TechSpec에서 "별도 문서 참조"로만 언급됨

**해결:**
- `docs/prisma-schema-draft.prisma` 생성
- 9개 주요 엔티티 전체 필드 정의
- 제약조건, 인덱스, Relation 명시
- Enum 타입 정의 (UserRole, ElectionStatus, RoleType 등)

**하이라이트:**
```prisma
// 1인 1표 보장
@@unique([electionId, voterId, forRole])

// 1인 1추천 보장
@@unique([electionId, recommenderId, forRole])
```

---

### 2. **API 설계 상세화** ✅
**문제:** 원본 TechSpec에서 엔드포인트 목록만 제공

**해결:**
- `docs/API-Spec.md` 생성 (43개 API 상세 명세)
- 각 API의 Request/Response 예시
- 에러 코드 체계 정립 (AUTH_*, VOTE_*, ELECTION_* 등)
- Query Parameter, Permission 요구사항 명시

**주요 API:**
- 인증: OTP 요청/검증, 토큰 갱신
- 선거: CRUD, 상태 변경, 조건 검증
- 추천: 제출, 현황 조회 (관리자)
- 후보: 지정, 응답, 목록 조회 (권한별)
- 투표: 제출, 결과 조회 (회원/관리자)
- 알림: 발송, 로그 조회
- 이양: 문서 업로드, 상태 관리
- 감사: 로그 조회

---

### 3. **상태 전이 및 비즈니스 로직** ✅
**문제:** 원본 TechSpec에서 상태 전이 "허용" 여부만 언급

**해결:**
- `docs/State-Transition-Rules.md` 생성
- 상태별 전이 조건 및 검증 로직 (TypeScript 코드 포함)
- 예외 상황 처리 (투표 기간 연장, 후보 사퇴 등)
- 감사 로그 자동 기록 로직
- 데이터 무결성 검증 방법

**주요 로직:**
- `canTransitionToRecommend()`: 추천 시작 가능 여부
- `canTransitionToCandidateConfirm()`: 후보 확정 가능 여부
- `canTransitionToVoting()`: 투표 시작 가능 여부 (각 역할별 최소 1명 ACCEPTED 검증)
- `submitVote()`: 1인 1표 보장, 트랜잭션 처리
- `verifyElectionIntegrity()`: 투표 결과 무결성 검증

---

## ⚠️ 추가 검토가 필요한 부분

### 1. **파일 저장소 전략**
**현황:** TechSpec에서 "S3 or 사내 NAS"로 모호하게 언급

**권장사항:**
- 사내 정책 확인 필요
- 옵션 1: AWS S3 (간편, 고가용성)
- 옵션 2: 사내 NAS (보안 정책 준수)
- 옵션 3: MinIO (온프렘 S3 호환 스토리지)

**구현 시 고려사항:**
```typescript
// 환경변수로 전략 선택 가능하게 설계
interface FileStorageAdapter {
  upload(file: Buffer, path: string): Promise<string>;
  download(path: string): Promise<Buffer>;
  delete(path: string): Promise<void>;
}

class S3StorageAdapter implements FileStorageAdapter { ... }
class NASStorageAdapter implements FileStorageAdapter { ... }
```

---

### 2. **카카오워크 Webhook 보안**
**현황:** TechSpec에서 "오픈 이슈"로 남김

**권장사항:**
- 사내 보안팀에 카카오워크 Webhook 사용 승인 확인
- 승인 불가 시 이메일만 사용
- Webhook URL을 환경변수로 관리, 서버 측 검증 추가

```typescript
// Webhook 발송 시 서명 검증
async function sendKakaoWorkNotification(message: string) {
  const signature = crypto
    .createHmac('sha256', process.env.KAKAO_WORK_SECRET)
    .update(message)
    .digest('hex');

  await axios.post(process.env.KAKAO_WORK_WEBHOOK_URL, {
    text: message,
    signature
  });
}
```

---

### 3. **OTP 전송 채널**
**현황:** TechSpec에서 "사내 메일 서버 또는 외부 SMTP" 선택 필요

**권장사항:**
- 사내 메일 서버 우선 (비용 절감, 보안 준수)
- 장애 대비 외부 SMTP (SendGrid, AWS SES) 백업 채널 구성
- 발송 실패 시 재시도 로직 + 알림

```typescript
class EmailService {
  async sendOTP(email: string, otp: string): Promise<boolean> {
    try {
      // 1차: 사내 메일 서버
      await this.sendViaInternal(email, otp);
      return true;
    } catch (error) {
      // 2차: 외부 SMTP 백업
      return await this.sendViaExternal(email, otp);
    }
  }
}
```

---

### 4. **선거 결과 공개 범위**
**현황:** TechSpec에서 "오픈 이슈"로 남김

**권장사항:**
사우회 내부 협의 필요:

**옵션 A: 투명성 우선**
- 일반 회원: 전체 득표수 + 득표율 공개
- 장점: 투명성 ↑, 신뢰도 ↑
- 단점: 낙선자 배려 ↓

**옵션 B: 프라이버시 우선**
- 일반 회원: 당선자만 공개
- 관리자/감사자: 전체 결과 조회
- 장점: 낙선자 배려 ↑
- 단점: 투명성 ↓

**옵션 C: 절충안**
- 당선자 득표율 공개
- 낙선자는 "득표율 N% 미만" 으로 익명화

**구현:** API 레벨에서 권한별 응답 분기 처리
```typescript
// 회원용: 요약만
GET /elections/:id/result-summary

// 관리자/감사자: 전체
GET /elections/:id/result (ADMIN/AUDITOR only)
```

---

## 💡 개선 제안

### 1. **Rate Limiting 추가**
**목적:** DDoS, 무차별 OTP 요청 방지

**구현:**
```typescript
// NestJS Throttler 모듈
@ThrottlerGuard({
  ttl: 60,
  limit: 5 // 1분에 5회
})
@Post('/auth/request-otp')
async requestOTP() { ... }
```

---

### 2. **투표 영수증 기능**
**목적:** 투표자에게 투표 완료 증명 제공

**구현:**
- 투표 완료 시 `ballotHash` 반환
- 투표자가 나중에 해시로 투표 존재 여부 확인 가능 (내용은 비공개)

```typescript
// 영수증 검증 API
GET /elections/:id/verify-ballot?hash=abc123

Response:
{
  "voted": true,
  "timestamp": "2025-01-26T14:30:00Z"
  // candidateId, forRole은 비공개
}
```

---

### 3. **백업 및 재해 복구**
**목적:** 선거 데이터 손실 방지

**권장:**
- DB 일일 자동 백업 (pg_dump)
- 중요 테이블 (votes, candidates) 별도 백업
- 투표 진행 중 실시간 복제 (Streaming Replication)

---

### 4. **성능 최적화**
**목적:** 투표 마감 직전 트래픽 급증 대비

**권장:**
- Redis 캐싱:
  - 선거 정보 (ElectionRound) → TTL 5분
  - 후보 목록 (Candidate) → TTL 10분
- DB 인덱스 최적화:
  - `votes(electionId, createdAt)` 복합 인덱스
  - `candidates(electionId, status)` 복합 인덱스

```typescript
// Redis 캐싱 예시
async getElection(id: string): Promise<ElectionRound> {
  const cached = await this.redis.get(`election:${id}`);
  if (cached) return JSON.parse(cached);

  const election = await this.prisma.electionRound.findUnique({ ... });
  await this.redis.setex(`election:${id}`, 300, JSON.stringify(election));

  return election;
}
```

---

## 📦 전달 문서 목록

| 문서명 | 경로 | 설명 |
|--------|------|------|
| TechSpec (원본) | - | 사용자 제공 |
| Prisma Schema | `docs/prisma-schema-draft.prisma` | DB 스키마 완전 정의 |
| API 명세서 | `docs/API-Spec.md` | 43개 API 상세 명세 |
| 상태 전이 규칙 | `docs/State-Transition-Rules.md` | 비즈니스 로직 + 코드 |
| 검토 요약 (본 문서) | `docs/TechSpec-Review-Summary.md` | 보완 사항 + 제안 |

---

## 🎯 다음 단계 제안

### 옵션 A: 프로토타입 구현 (2주)
**목표:** 핵심 기능만 빠르게 구현해 검증

**범위:**
- 인증 (이메일 OTP)
- 선거 생성 + 상태 관리
- 추천 + 후보 관리
- 투표 + 결과 조회 (간단)

**제외:**
- 알림 시스템
- 이양 문서 관리
- 감사 로그 상세

---

### 옵션 B: 전체 구현 (4-6주)
**목표:** 모든 기능 완전 구현

**Phase 1 (2주):**
- 백엔드: Auth, User, Election, Recommend, Candidate, Vote 모듈
- 프론트: 로그인, 선거 목록, 추천, 후보 조회, 투표

**Phase 2 (2주):**
- 백엔드: Notification, Transition, Audit 모듈
- 프론트: 관리자 대시보드, 결과 조회, 이양 관리

**Phase 3 (1-2주):**
- 테스트 (Unit, Integration, E2E)
- 배포 (Docker, CI/CD)
- 문서화

---

### 옵션 C: 문서만 보완 후 대기
**목표:** 구현은 나중에, 문서만 완성

**작업:**
- 파일 저장소 전략 확정
- 카카오워크 사용 여부 확인
- 선거 결과 공개 범위 합의
- TechSpec 최종본 작성

---

## ✅ 최종 체크리스트

구현 시작 전 확인 사항:

- [ ] 사내 보안 정책 확인 (OTP 전송, 파일 저장소)
- [ ] 카카오워크 Webhook 사용 승인
- [ ] 선거 결과 공개 범위 합의
- [ ] 사우회 회원 데이터 확보 (110명)
- [ ] 개발 환경 준비 (PostgreSQL, Redis, SMTP)
- [ ] 도메인 및 인프라 할당

---

## 📞 문의 사항

TechSpec 관련 추가 질문이나 보완 요청이 있으면 말씀해 주세요:
- 특정 API 로직 상세화
- DB 스키마 수정
- 프론트엔드 라우팅 설계
- 배포 전략
