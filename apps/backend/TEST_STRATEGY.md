# 테스트 전략 및 실행 가이드

## 📖 목차

1. [테스트 DB 전략](#테스트-db-전략)
2. [테스트 환경 설정](#테스트-환경-설정)
3. [테스트 실행 방법](#테스트-실행-방법)
4. [테스트 케이스 요약](#테스트-케이스-요약)
5. [Best Practices](#best-practices)

---

## 1. 테스트 DB 전략

### 📊 SQLite vs PostgreSQL

#### ✅ **선택: SQLite (권장)**

테스트 환경에서는 **SQLite**를 사용합니다.

**이유:**
- ✅ **빠른 속도**: 메모리/파일 기반으로 빠른 테스트 실행
- ✅ **격리성**: 각 테스트가 독립적인 파일 DB 사용 가능
- ✅ **설정 간편**: 별도 DB 서버 불필요
- ✅ **CI/CD 친화적**: GitHub Actions 등에서 추가 설정 없이 사용
- ✅ **개발자 편의성**: 로컬에서 즉시 테스트 가능

**단점:**
- ⚠️ PostgreSQL과 100% 호환되지 않음 (일부 고급 기능 차이)
- ⚠️ 프로덕션 환경과 다른 DB 엔진

#### 📌 **대안: PostgreSQL (선택적)**

프로덕션과 동일한 환경에서 테스트하려면 PostgreSQL 사용 가능합니다.

**방법:**
```bash
# Docker로 테스트 PostgreSQL 실행
docker run -d \
  --name postgres-test \
  -e POSTGRES_PASSWORD=test \
  -e POSTGRES_DB=test_db \
  -p 5433:5432 \
  postgres:15-alpine

# .env.test 수정
DATABASE_URL="postgresql://postgres:test@localhost:5433/test_db"
```

**장점:**
- ✅ 프로덕션과 동일한 환경
- ✅ PostgreSQL 고유 기능 테스트 가능

**단점:**
- ❌ 추가 설정 필요
- ❌ CI/CD에서 Docker 설정 필요
- ❌ 속도가 SQLite보다 느림

---

## 2. 테스트 환경 설정

### 📁 파일 구조

```
apps/backend/
├── src/
│   ├── election/
│   │   ├── election.service.ts
│   │   └── election.service.spec.ts        # 테스트 파일
│   ├── recommend/
│   │   ├── recommend.service.ts
│   │   └── recommend.service.spec.ts
│   ├── vote/
│   │   ├── vote.service.ts
│   │   └── vote.service.spec.ts
│   └── ...
├── test/
│   ├── setup.ts                            # Jest 전역 설정
│   ├── global-setup.ts                     # 테스트 시작 전 실행
│   ├── global-teardown.ts                  # 테스트 종료 후 실행
│   └── helpers/
│       ├── test-database.helper.ts         # DB 헬퍼
│       └── test-data-builder.ts            # 테스트 데이터 빌더
├── .env.test                               # 테스트 환경 변수
├── jest.config.js                          # Jest 설정
├── package.json
└── tsconfig.json
```

### 🔧 설정 파일

#### `.env.test`
```env
NODE_ENV=test
DATABASE_URL="file:./test.db"
JWT_SECRET="test-jwt-secret-key-for-testing-only"
BALLOT_SECRET_SALT="test-ballot-secret-salt"
API_PORT=3001
```

#### `jest.config.js`
- SQLite 사용
- 테스트 타임아웃 10초
- Coverage 설정
- Global setup/teardown 설정

---

## 3. 테스트 실행 방법

### 🚀 초기 설정

```bash
# 1. 의존성 설치
cd apps/backend
npm install

# 2. Prisma 클라이언트 생성
npm run prisma:generate

# 3. 테스트 DB 마이그레이션 (자동으로 global-setup에서 실행됨)
# 수동 실행: npm run prisma:migrate:test
```

### ▶️ 테스트 실행 명령어

```bash
# 모든 테스트 실행
npm test

# Watch 모드 (개발 중)
npm run test:watch

# Coverage 확인
npm run test:cov

# 특정 파일만 테스트
npm test -- election.service.spec.ts

# 특정 describe 블록만 테스트
npm test -- -t "State Transition Tests"

# 디버그 모드
npm run test:debug
```

### 📊 테스트 실행 흐름

```
1. global-setup.ts 실행
   ├── 기존 test.db 파일 삭제
   └── Prisma 마이그레이션 실행 (test.db 생성)

2. 각 테스트 파일 실행
   ├── beforeAll: 테스트 모듈 생성, DB 연결
   ├── beforeEach: DB 데이터 클린업
   ├── 테스트 케이스 실행
   └── afterAll: DB 연결 종료

3. global-teardown.ts 실행
   └── test.db 파일 삭제
```

---

## 4. 테스트 케이스 요약

### 🔴 **우선순위 1: Election 상태 전이 로직**

**파일:** `src/election/election.service.spec.ts`

**테스트 케이스:**

#### ✅ 성공 케이스 (7개)
- PLANNING → RECOMMEND 전이 성공
- RECOMMEND → CANDIDATE_CONFIRM 전이 성공
- CANDIDATE_CONFIRM → VOTING 전이 성공
- VOTING → CLOSED 전이 성공
- 모든 상태 → CANCELLED 전이 성공 (3개)

#### ❌ 실패 케이스 (6개)
- PLANNING → VOTING 직접 전이 시도 (단계 건너뛰기)
- RECOMMEND → PLANNING 역순 전이 시도
- CLOSED → 다른 상태로 전이 시도
- CANCELLED → 다른 상태로 전이 시도
- 같은 상태로 전이 시도
- 존재하지 않는 선거 ID로 상태 변경 시도
- 날짜 검증 실패

#### 📊 통합 시나리오 (1개)
- 선거 생성부터 종료까지 전체 상태 전이

**총 테스트:** 14개

---

### 🟡 **우선순위 2: Recommendation 중복 방지 로직**

**파일:** `src/recommend/recommend.service.spec.ts`

**테스트 케이스:**

#### ✅ 성공 케이스 (4개)
- 첫 번째 추천 생성 성공
- 다른 역할에 대한 추천 생성 성공
- 다른 사람에 대한 추천 생성 성공
- 최대 추천 수 이내 추천 성공

#### ❌ 실패 케이스 (8개)
- 같은 선거, 같은 역할에 대한 중복 추천 시도
- DB 제약 조건 확인 (@@unique 테스트)
- 자기 자신 추천 시도
- 최대 추천 수 초과 시도
- 추천 기간이 아닐 때 추천 시도
- 존재하지 않는 후보 추천 시도
- 비활성화된 사용자 추천 시도

#### 📊 통합 시나리오 (1개)
- 여러 사용자가 여러 역할에 대해 추천하는 시나리오

**총 테스트:** 13개

---

### 🟢 **우선순위 3: Vote 1인 1표 로직**

**파일:** `src/vote/vote.service.spec.ts`

**테스트 케이스:**

#### ✅ 성공 케이스 (5개)
- 첫 번째 투표 생성 성공
- 다른 역할에 대한 투표 생성 성공
- 여러 역할에 대한 동시 투표 성공
- ballotHash 생성 확인
- ballotHash가 매번 달라야 함

#### ❌ 실패 케이스 (12개)
- 같은 선거, 같은 역할에 대한 중복 투표 시도
- DB 제약 조건 확인 (@@unique 테스트)
- 투표 기간이 아닐 때 투표 시도 (3개)
- ACCEPTED 상태가 아닌 후보에 대한 투표 시도 (2개)
- 존재하지 않는 후보에 대한 투표 시도
- 다른 선거의 후보에 대한 투표 시도
- 잘못된 역할의 후보에 대한 투표 시도
- 빈 투표 시도

#### 📊 통합 시나리오 (2개)
- 여러 사용자가 여러 역할에 대해 투표하는 시나리오
- 투표 상태 조회 시나리오

**총 테스트:** 19개

---

### 📈 전체 통계

| 우선순위 | 테스트 파일 | 성공 케이스 | 실패 케이스 | 통합 시나리오 | 총 테스트 |
|---------|-----------|-----------|-----------|-------------|---------|
| 1 (HIGH) | election.service.spec.ts | 7 | 6 | 1 | **14** |
| 2 (MEDIUM) | recommend.service.spec.ts | 4 | 8 | 1 | **13** |
| 3 (LOW) | vote.service.spec.ts | 5 | 12 | 2 | **19** |
| **합계** | | **16** | **26** | **4** | **46** |

---

## 5. Best Practices

### ✅ 테스트 작성 원칙

#### 1. **AAA 패턴 사용**
```typescript
it('테스트 케이스 이름', async () => {
  // Arrange (Given): 테스트 준비
  const election = await dataBuilder.createElection();
  const user = await dataBuilder.createUser();

  // Act (When): 동작 실행
  const result = await service.updateStatus(election.id, { status: 'RECOMMEND' });

  // Assert (Then): 결과 검증
  expect(result.status).toBe('RECOMMEND');
});
```

#### 2. **명확한 테스트 이름**
```typescript
// ✅ 좋은 예
it('같은 선거, 같은 역할에 대한 중복 추천 시도')

// ❌ 나쁜 예
it('중복 테스트')
```

#### 3. **독립적인 테스트**
- 각 테스트는 다른 테스트에 의존하지 않아야 함
- `beforeEach`에서 DB 클린업으로 격리 보장

#### 4. **TestDataBuilder 활용**
```typescript
// ✅ 좋은 예: 재사용 가능한 빌더 사용
const election = await dataBuilder.createElectionInVotingPeriod();

// ❌ 나쁜 예: 매번 수동으로 데이터 생성
const election = await prisma.electionRound.create({
  data: {
    name: '...',
    status: 'VOTING',
    // ... 많은 필드
  },
});
```

#### 5. **예외 테스트 패턴**
```typescript
// BusinessException 테스트
await expect(
  service.create(/* ... */)
).rejects.toThrow(BusinessException);

await expect(
  service.create(/* ... */)
).rejects.toMatchObject({
  code: ErrorCode.SPECIFIC_ERROR,
});
```

### 🔧 디버깅 팁

#### 1. **특정 테스트만 실행**
```typescript
// it.only: 하나의 테스트만 실행
it.only('디버깅할 테스트', async () => { /* ... */ });

// describe.only: 하나의 그룹만 실행
describe.only('특정 그룹', () => { /* ... */ });
```

#### 2. **테스트 스킵**
```typescript
// it.skip: 테스트 건너뛰기
it.skip('일시적으로 비활성화', async () => { /* ... */ });
```

#### 3. **콘솔 로그 활성화**
`test/setup.ts`에서 콘솔 mock 주석 해제

### 🚨 주의사항

1. **비동기 처리**
   - 모든 DB 작업은 `await` 사용
   - Promise rejection은 `rejects.toThrow()` 사용

2. **트랜잭션 격리**
   - 각 테스트 간 데이터 격리 보장
   - `beforeEach`에서 DB 클린업 필수

3. **타임아웃 설정**
   - 기본 10초 설정
   - 느린 테스트는 개별 타임아웃 조정 가능

---

## 6. CI/CD 통합

### GitHub Actions 예시

```yaml
name: Backend Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: |
          cd apps/backend
          npm ci

      - name: Generate Prisma Client
        run: |
          cd apps/backend
          npm run prisma:generate

      - name: Run tests
        run: |
          cd apps/backend
          npm run test:cov

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./apps/backend/coverage/lcov.info
```

---

## 7. 트러블슈팅

### ❓ 문제: Prisma Client 생성 안 됨

**해결:**
```bash
npm run prisma:generate
```

### ❓ 문제: 마이그레이션 실패

**해결:**
```bash
# test.db 삭제 후 재실행
rm apps/backend/test.db
npm test
```

### ❓ 문제: 타임아웃 에러

**해결:**
```typescript
// 개별 테스트 타임아웃 조정
it('느린 테스트', async () => {
  // ...
}, 30000); // 30초
```

### ❓ 문제: DB 락 에러

**해결:**
```typescript
// afterAll에서 연결 확실히 종료
afterAll(async () => {
  await dbHelper.disconnect();
  await prisma.$disconnect();
});
```

---

## 📚 참고 자료

- [Jest 공식 문서](https://jestjs.io/)
- [Prisma Testing Guide](https://www.prisma.io/docs/guides/testing)
- [NestJS Testing](https://docs.nestjs.com/fundamentals/testing)
- [SQLite for Testing](https://www.sqlite.org/testing.html)

---

## ✅ 체크리스트

테스트 작성 시 확인 사항:

- [ ] AAA 패턴 준수
- [ ] 명확한 테스트 이름
- [ ] 성공/실패 케이스 모두 작성
- [ ] DB 제약 조건 테스트 포함
- [ ] TestDataBuilder 활용
- [ ] 예외 상황 테스트
- [ ] 통합 시나리오 작성
- [ ] 독립적인 테스트 (격리)
- [ ] 적절한 타임아웃 설정
- [ ] 주석으로 Given/When/Then 표시

---

**작성일:** 2025-11-17
**버전:** 1.0.0
