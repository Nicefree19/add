# F2: 일반 회원 플로우 UI 구현 완료 ✅

## 구현 개요

일반 회원이 사용하는 전체 선거 플로우를 완벽하게 구현했습니다. 대시보드에서 시작하여 추천, 후보 확인, 투표, 결과 확인까지 모든 단계가 포함되어 있습니다.

---

## 📁 구현된 페이지

### 1. 메인 대시보드 (`/app/(main)/page.tsx`)

**기능:**
- ✅ 진행 중인 선거 목록 표시
- ✅ 종료된 선거 목록 (별도 섹션)
- ✅ 선거 상태 Badge (기획중, 추천중, 투표중, 종료)
- ✅ 현재 단계에 따른 안내 메시지
- ✅ 사용자 정보 카드
- ✅ 로딩 상태 (Skeleton)
- ✅ 에러 처리

**API 호출:**
```typescript
GET /elections?limit=20
```

**주요 컴포넌트:**
- `ElectionCard`: 선거 정보 카드
  - 선거명, 설명
  - 추천/투표 일정
  - 후보 수, 투표 수
  - 현재 단계별 안내 메시지 (before/recommend/wait/voting)
  - "상세 보기" 버튼

**화면 예시:**
```
┌─────────────────────────────────┐
│ 선거 관리 시스템         [로그아웃] │
├─────────────────────────────────┤
│ 환영합니다, 홍길동님!             │
│ 개발팀 · 대리      [MEMBER]      │
└─────────────────────────────────┘

진행 중인 선거
┌──────────────────┬──────────────┐
│ 2024년 제1차...  │ 2024년 제2차  │
│ [추천 진행 중]   │ [투표 진행 중] │
│ 추천: 01.15~01.31│              │
│ 투표: 02.05~02.10│              │
│ [상세 보기]      │              │
└──────────────────┴──────────────┘
```

---

### 2. 선거 상세 (`/app/(main)/elections/[id]/page.tsx`)

**기능:**
- ✅ 선거 기본 정보 표시
- ✅ 선거 일정 표시 (추천/투표 기간)
- ✅ 내 참여 현황 (투표 여부)
- ✅ 현재 단계에 따른 액션 버튼
- ✅ 단계별 버튼 활성화/비활성화

**API 호출:**
```typescript
GET /elections/:id
GET /elections/:id/vote-status
```

**단계별 버튼:**
- `before`: 안내 메시지만 표시
- `recommend`: "후보 추천하기" 버튼
- `wait`: "후보 목록 보기" 버튼
- `voting`: "투표하기" 버튼 (이미 투표한 경우 비활성화)
- `closed`: "결과 보기" 버튼

**화면 예시:**
```
← 돌아가기

2024년 제1차 사우회 임원 선거     [추천 진행 중]
2024년도 사우회 임원 선출을 위한 선거

┌─────────────────────────────────┐
│ 선거 일정                        │
├─────────────────────────────────┤
│ 📅 추천 기간                    │
│    2024년 1월 15일 00:00        │
│    ~ 2024년 1월 31일 23:59      │
│                                 │
│ 🗳️ 투표 기간                    │
│    2024년 2월 5일 00:00         │
│    ~ 2024년 2월 10일 23:59      │
└─────────────────────────────────┘

┌─────────────────────────────────┐
│ 내 참여 현황                     │
├─────────────────────────────────┤
│ ✓ 투표 완료 (투표한 역할: 회장, 총무)│
└─────────────────────────────────┘

┌─────────────────────────────────┐
│ 선거 참여                        │
├─────────────────────────────────┤
│ [후보 추천하기]                  │
│ [후보 목록 보기]                 │
│ [투표하기] (비활성화)            │
└─────────────────────────────────┘
```

---

### 3. 후보 추천 (`/app/(main)/elections/[id]/recommend/page.tsx`)

**기능:**
- ✅ 회장, 총무 각 1명씩 추천
- ✅ 활성 사용자 목록에서 선택 (본인 제외)
- ✅ 사용자 검색 기능
- ✅ 추천 이유 입력 (선택)
- ✅ Form validation (react-hook-form + zod)
- ✅ 중복 추천 방지 (API 에러 처리)
- ✅ 성공 시 확인 화면 및 자동 리디렉션

**API 호출:**
```typescript
GET /elections/:id
GET /users?limit=100
POST /elections/:id/recommendations (회장)
POST /elections/:id/recommendations (총무)
```

**화면 예시:**
```
← 돌아가기

후보 추천
2024년 제1차 사우회 임원 선거

┌─────────────────────────────────┐
│ ℹ️ 회장과 총무 각 1명씩 추천할 수  │
│   있습니다.                      │
└─────────────────────────────────┘

┌─────────────────────────────────┐
│ 후보자 검색                      │
│ 🔍 [검색...]                    │
└─────────────────────────────────┘

┌─────────────────────────────────┐
│ 회장 추천                        │
├─────────────────────────────────┤
│ 후보자 *                        │
│ [선택해주세요 ▼]                │
│ - 김철수 (EMP002) - 개발팀/대리 │
│ - 이영희 (EMP003) - 총무팀/과장 │
│                                 │
│ 추천 이유 (선택)                │
│ [리더십이 뛰어나서...]          │
└─────────────────────────────────┘

┌─────────────────────────────────┐
│ 총무 추천                        │
│ (동일한 구조)                    │
└─────────────────────────────────┘

[취소] [추천 제출]
```

**성공 화면:**
```
┌─────────────────────────────────┐
│         ✓                       │
│     추천 완료!                   │
│                                 │
│ 후보 추천이 성공적으로           │
│ 제출되었습니다.                  │
└─────────────────────────────────┘
```

---

### 4. 후보 목록 (`/app/(main)/elections/[id]/candidates/page.tsx`)

**기능:**
- ✅ ACCEPTED 상태의 후보만 표시
- ✅ 역할별로 그룹화 (회장, 총무, 감사)
- ✅ 후보 카드 (이름, 부서, 직급, 추천 수)
- ✅ 후보 클릭 시 상세 모달
- ✅ 모달에서 소견서 전체 내용 표시
- ✅ 추천 수 표시

**API 호출:**
```typescript
GET /elections/:id
GET /elections/:id/candidates
```

**화면 예시:**
```
← 돌아가기

후보 목록
2024년 제1차 사우회 임원 선거

┌─────────────────────────────────┐
│ 회장 후보                [3명]   │
├─────────────────────────────────┤
│ ┌──────────┬──────────┐        │
│ │ 홍길동   │ 김철수   │        │
│ │ 개발팀·대리│ 총무팀·과장│      │
│ │ 🏆 25    │ 🏆 20    │        │
│ │ 열심히...│ 책임감...│        │
│ │[상세보기]│[상세보기]│        │
│ └──────────┴──────────┘        │
└─────────────────────────────────┘

┌─────────────────────────────────┐
│ 총무 후보                [2명]   │
│ (동일한 구조)                    │
└─────────────────────────────────┘
```

**상세 모달:**
```
┌─────────────────────────────────┐
│ 홍길동                          │
│ 개발팀 · 대리                   │
├─────────────────────────────────┤
│ 지원 역할: [회장]               │
│ 사번: EMP001                    │
│ 이메일: hong@example.com        │
│ 추천 수: 🏆 25명               │
│                                 │
│ 소견서:                         │
│ ┌─────────────────────────┐   │
│ │ 사우회 발전을 위해...    │   │
│ │ 열심히 하겠습니다.       │   │
│ └─────────────────────────┘   │
│                                 │
│                        [닫기]   │
└─────────────────────────────────┘
```

---

### 5. 투표 (`/app/(main)/elections/[id]/vote/page.tsx`)

**기능:**
- ✅ 역할별 후보 라디오 버튼 선택
- ✅ 선택 검증 (모든 역할 선택 필수)
- ✅ 투표 확인 모달
- ✅ 이미 투표한 경우 접근 차단
- ✅ 익명 투표 안내
- ✅ 제출 후 수정 불가 안내

**API 호출:**
```typescript
GET /elections/:id
GET /elections/:id/candidates
GET /elections/:id/vote-status
POST /elections/:id/votes
```

**화면 예시:**
```
← 돌아가기

투표하기
2024년 제1차 사우회 임원 선거

┌─────────────────────────────────┐
│ ⚠️ 투표 유의사항                │
│ • 각 역할별로 1명씩 선택         │
│ • 투표 후 수정 불가              │
│ • 익명 투표 진행                │
└─────────────────────────────────┘

┌─────────────────────────────────┐
│ 회장 투표                        │
│ 3명의 후보 중 1명을 선택하세요   │
├─────────────────────────────────┤
│ ○ 홍길동                        │
│   개발팀 · 대리                 │
│   열심히 하겠습니다...          │
│                                 │
│ ● 김철수 (선택됨)               │
│   총무팀 · 과장                 │
│   책임감을 가지고...            │
└─────────────────────────────────┘

┌─────────────────────────────────┐
│ 총무 투표                        │
│ (동일한 구조)                    │
└─────────────────────────────────┘

[취소] [투표 제출]
```

**확인 모달:**
```
┌─────────────────────────────────┐
│ 투표 확인                        │
│ 투표를 제출하시겠습니까?         │
│ 제출 후에는 수정할 수 없습니다.  │
├─────────────────────────────────┤
│ 회장    김철수 (EMP002)         │
│ 총무    이영희 (EMP003)         │
│                                 │
│                  [취소] [투표제출]│
└─────────────────────────────────┘
```

**이미 투표한 경우:**
```
┌─────────────────────────────────┐
│         ✓                       │
│     투표 완료                    │
│                                 │
│ 이미 투표를 완료했습니다.        │
└─────────────────────────────────┘
```

---

### 6. 결과 (`/app/(main)/elections/[id]/results/page.tsx`)

**기능:**
- ✅ 투표율 표시 (전체/참여/비율)
- ✅ 투표율 프로그레스 바
- ✅ 역할별 당선자 표시
- ✅ 득표수 표시
- ✅ 선거 종료 전 "집계 중" 표시
- ✅ 관리자/감사 전용 상세 결과 안내

**API 호출:**
```typescript
GET /elections/:id
GET /elections/:id/result-summary
```

**화면 예시:**
```
← 돌아가기

선거 결과                [종료]
2024년 제1차 사우회 임원 선거

┌─────────────────────────────────┐
│ 투표 참여 현황                   │
│ 전체 유권자 대비 투표 참여율     │
├─────────────────────────────────┤
│   150명        112명      74.7% │
│ 전체 유권자    투표 참여   투표율 │
│                                 │
│ [━━━━━━━━━━━━━━━━━━━━] 74.7% │
└─────────────────────────────────┘

┌─────────────────────────────────┐
│ 🏆 당선자                       │
├─────────────────────────────────┤
│ ┌─────────────────────────┐   │
│ │ 🏅 회장                 │   │
│ │ 홍길동                  │   │
│ │ 개발팀 · 대리           │   │
│ │                   58표  │   │
│ └─────────────────────────┘   │
│                                 │
│ ┌─────────────────────────┐   │
│ │ 🏅 총무                 │   │
│ │ 김철수                  │   │
│ │ 총무팀 · 과장           │   │
│ │                   45표  │   │
│ └─────────────────────────┘   │
└─────────────────────────────────┘

┌─────────────────────────────────┐
│ ℹ️ 득표 수 등 상세한 결과는      │
│   관리자와 감사만 확인 가능      │
└─────────────────────────────────┘
```

**집계 중 화면:**
```
┌─────────────────────────────────┐
│         📊                      │
│      집계 중                     │
│                                 │
│ 선거가 종료된 후 결과를          │
│ 확인할 수 있습니다.              │
└─────────────────────────────────┘
```

---

## 🎨 새로 추가된 컴포넌트

### 1. Badge (`components/ui/badge.tsx`)

**Variants:**
- `default`: 기본 (파란색)
- `secondary`: 보조 (회색)
- `destructive`: 위험 (빨간색)
- `outline`: 테두리만
- `success`: 성공 (녹색)
- `warning`: 경고 (노란색)
- `info`: 정보 (파란색)

**사용 예:**
```tsx
<Badge variant="success">투표 진행 중</Badge>
<Badge variant="warning">후보 확정 중</Badge>
<Badge>MEMBER</Badge>
```

---

### 2. Dialog (`components/ui/dialog.tsx`)

**컴포넌트:**
- `Dialog`: 모달 래퍼
- `DialogContent`: 모달 내용
- `DialogHeader`: 모달 헤더
- `DialogTitle`: 제목
- `DialogDescription`: 설명
- `DialogFooter`: 푸터 (버튼 영역)

**사용 예:**
```tsx
<Dialog open={isOpen} onOpenChange={setIsOpen}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>제목</DialogTitle>
      <DialogDescription>설명</DialogDescription>
    </DialogHeader>
    <div>내용</div>
    <DialogFooter>
      <Button onClick={handleConfirm}>확인</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

---

### 3. Skeleton (`components/ui/skeleton.tsx`)

**사용 예:**
```tsx
<Skeleton className="h-6 w-3/4" />
<Skeleton className="h-32 w-full" />
```

---

## 📦 새로 추가된 타입 (`types/election.ts`)

### Election 관련
```typescript
enum ElectionStatus {
  PLANNING, RECOMMEND, CANDIDATE_CONFIRM, VOTING, CLOSED
}

enum ElectionRole {
  PRESIDENT, TREASURER, AUDITOR
}

interface Election {
  id, name, description, status,
  recommendationStartDate, recommendationEndDate,
  votingStartDate, votingEndDate,
  maxRecommendations, isActive,
  candidateCount?, recommendationCount?, voteCount?
}
```

### Candidate 관련
```typescript
enum CandidateStatus {
  INVITED, ACCEPTED, DECLINED
}

interface Candidate {
  id, userId, electionId, forRole,
  statement, status, voteCount,
  user: { name, email, employeeNo, department, position },
  recommendationCount?
}
```

### Vote 관련
```typescript
interface CreateVoteDto {
  votes: {
    [ElectionRole]: candidateId
  }
}

interface VoteStatusResponse {
  hasVoted, votedRoles
}
```

### Result 관련
```typescript
interface ResultSummaryResponse {
  electionId, electionName, status,
  totalVoters, totalVotes, turnoutRate,
  results: RoleSummary[]
}

interface RoleSummary {
  role, winner, totalVotes
}
```

---

## 🛠️ 유틸리티 함수 (`lib/utils/election.ts`)

```typescript
// 선거 상태를 한글로 변환
getElectionStatusText(status: ElectionStatus): string

// 선거 상태에 따른 Badge variant
getElectionStatusVariant(status): 'default' | 'secondary' | ...

// 역할을 한글로 변환
getRoleText(role: ElectionRole): string

// 날짜 포맷팅
formatDate(dateString): string
formatDateTime(dateString): string

// 현재 진행 중인 단계 확인
getCurrentPhase(election): 'before' | 'recommend' | 'wait' | 'voting' | 'closed'
```

---

## 📡 API 함수 (`lib/api/elections.ts`, `lib/api/users.ts`)

### Elections API
```typescript
getElections(params?)         // GET /elections
getElection(id)               // GET /elections/:id
getCandidates(electionId)     // GET /elections/:id/candidates
createRecommendation(...)     // POST /elections/:id/recommendations
getVoteStatus(electionId)     // GET /elections/:id/vote-status
createVotes(electionId, data) // POST /elections/:id/votes
getResultSummary(electionId)  // GET /elections/:id/result-summary
getResultDetail(electionId)   // GET /elections/:id/result (관리자용)
```

### Users API
```typescript
getUsers(params?)             // GET /users
```

---

## ✅ 주요 기능

### 1. 상태 관리
- ✅ 로딩 상태 (Skeleton)
- ✅ 에러 상태 (Alert)
- ✅ 성공 상태 (Success screen)
- ✅ 빈 상태 (Empty state)

### 2. 폼 처리
- ✅ React Hook Form + Zod validation
- ✅ 실시간 validation
- ✅ 에러 메시지 표시
- ✅ 제출 중 로딩
- ✅ 제출 후 자동 리디렉션

### 3. UX 개선
- ✅ 확인 모달
- ✅ 성공 피드백
- ✅ 에러 피드백
- ✅ 로딩 스피너
- ✅ 스켈레톤 로딩
- ✅ 단계별 안내 메시지

### 4. 보안
- ✅ 이미 투표한 경우 재투표 방지
- ✅ 본인 추천 방지 (클라이언트)
- ✅ 익명 투표 (서버)
- ✅ 역할 기반 접근 제어 준비

---

## 🎯 페이지별 플로우

### 추천 플로우
```
1. 대시보드에서 "상세 보기"
2. 선거 상세에서 "후보 추천하기"
3. 추천 페이지:
   - 회장, 총무 각 1명 선택
   - 추천 이유 작성 (선택)
   - "추천 제출"
4. 성공 화면 → 2초 후 선거 상세로 이동
```

### 투표 플로우
```
1. 대시보드에서 "상세 보기"
2. 선거 상세에서 "투표하기"
3. 투표 페이지:
   - 역할별 후보 선택
   - "투표 제출"
   - 확인 모달 표시
   - "투표 제출" 확인
4. 성공 화면 → 2초 후 선거 상세로 이동
```

### 결과 확인 플로우
```
1. 대시보드에서 종료된 선거 "상세 보기"
2. 선거 상세에서 "결과 보기"
3. 결과 페이지:
   - 투표율 확인
   - 당선자 확인
```

---

## 🔄 상태 전이

```
before (추천 시작 전)
  ↓ 추천 시작일 도래
recommend (추천 진행 중)
  ↓ 추천 종료일 경과
wait (후보 확정 중)
  ↓ 투표 시작일 도래
voting (투표 진행 중)
  ↓ 투표 종료일 경과
closed (종료)
```

**각 상태별 가능한 액션:**
- `before`: 정보 확인만 가능
- `recommend`: 후보 추천 가능
- `wait`: 후보 목록 확인 가능
- `voting`: 투표 가능 (1회만)
- `closed`: 결과 확인 가능

---

## 📱 반응형 디자인

- ✅ 모바일: 1열 카드 레이아웃
- ✅ 태블릿: 2열 그리드
- ✅ 데스크톱: 2~3열 그리드
- ✅ 모든 화면 크기에서 최적화된 UI

---

## 🎨 디자인 시스템

### 색상 사용
- **기획 중**: Gray (secondary)
- **추천 진행 중**: Blue (info)
- **후보 확정 중**: Yellow (warning)
- **투표 진행 중**: Green (success)
- **종료**: Default

### 아이콘 사용
- 📅 Calendar: 일정
- 🗳️ Vote: 투표
- 👥 Users: 사용자/후보
- 🏆 Trophy: 결과/득표
- 🏅 Award: 추천 수
- ✓ CheckCircle2: 완료
- ⚠️ AlertTriangle: 경고
- 📊 TrendingUp: 집계

---

## 🚀 성능 최적화

- ✅ 병렬 API 호출 (`Promise.all`)
- ✅ 조건부 렌더링
- ✅ 메모이제이션 가능 컴포넌트 분리
- ✅ Skeleton을 통한 인지 성능 향상

---

## 🧪 테스트 시나리오

### 추천 페이지
- [ ] 활성 사용자 목록 로드
- [ ] 본인은 목록에서 제외됨
- [ ] 검색 기능 동작
- [ ] 회장, 총무 모두 선택 필수
- [ ] 제출 성공 시 성공 화면
- [ ] 중복 추천 시 에러 메시지

### 투표 페이지
- [ ] 후보 목록 로드
- [ ] 역할별 1명씩만 선택 가능
- [ ] 모든 역할 선택 필수
- [ ] 확인 모달 표시
- [ ] 투표 제출 성공
- [ ] 이미 투표한 경우 접근 차단

### 결과 페이지
- [ ] 종료된 선거만 결과 표시
- [ ] 투표율 올바르게 계산
- [ ] 당선자 정보 표시
- [ ] 진행 중 선거는 "집계 중" 표시

---

## 📝 TODO (향후 개선)

### 추천 페이지
- [ ] 이미 추천한 경우 수정/삭제 기능
- [ ] 추천한 후보 표시
- [ ] 추천 현황 미리보기

### 투표 페이지
- [ ] 후보 상세 보기 버튼
- [ ] 투표 전 후보 비교 기능

### 결과 페이지
- [ ] 투표 참여 추이 그래프
- [ ] 역할별 통계

---

## ✅ 완료 체크리스트

- [x] 타입 정의 (election.ts)
- [x] API 함수 (elections.ts, users.ts)
- [x] 유틸리티 함수 (election.ts)
- [x] Badge 컴포넌트
- [x] Dialog 컴포넌트
- [x] Skeleton 컴포넌트
- [x] 메인 대시보드 (/)
- [x] 선거 상세 (/elections/[id])
- [x] 추천 페이지 (/elections/[id]/recommend)
- [x] 후보 목록 (/elections/[id]/candidates)
- [x] 투표 페이지 (/elections/[id]/vote)
- [x] 결과 페이지 (/elections/[id]/results)
- [x] 빌드 테스트 통과
- [x] Git 커밋 및 푸시

---

## 🎉 결과

**일반 회원이 사용하는 전체 선거 플로우가 완벽하게 구현되었습니다!**

- ✅ 6개 페이지 구현
- ✅ 3개 새로운 UI 컴포넌트
- ✅ 완전한 타입 안정성
- ✅ 로딩/에러/성공 상태 처리
- ✅ 폼 validation
- ✅ 반응형 디자인
- ✅ 프로덕션 빌드 성공

이제 백엔드 API와 연동하여 실제로 추천, 투표, 결과 확인이 가능합니다!

다음 단계(F3)에서는 관리자 기능을 구현할 예정입니다.
