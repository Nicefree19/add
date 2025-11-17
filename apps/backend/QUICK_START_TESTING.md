# 🚀 테스트 빠른 시작 가이드

## 5분 안에 테스트 실행하기

### 1️⃣ 의존성 설치 (1분)

```bash
cd apps/backend
npm install
```

### 2️⃣ Prisma 클라이언트 생성 (30초)

```bash
npm run prisma:generate
```

### 3️⃣ 테스트 실행 (1분)

```bash
# 모든 테스트 실행
npm test

# 특정 파일만 테스트
npm test -- election.service.spec.ts
npm test -- recommend.service.spec.ts
npm test -- vote.service.spec.ts
```

### 4️⃣ Coverage 확인 (1분)

```bash
npm run test:cov

# Coverage 리포트 확인
open coverage/lcov-report/index.html  # macOS
xdg-open coverage/lcov-report/index.html  # Linux
```

---

## 📊 예상 결과

```
PASS  src/election/election.service.spec.ts
  ElectionService - State Transition Tests
    ✓ PLANNING → RECOMMEND 전이 성공 (85ms)
    ✓ RECOMMEND → CANDIDATE_CONFIRM 전이 성공 (45ms)
    ✓ CANDIDATE_CONFIRM → VOTING 전이 성공 (42ms)
    ✓ VOTING → CLOSED 전이 성공 (38ms)
    ...

PASS  src/recommend/recommend.service.spec.ts
  RecommendService - Duplicate Prevention Tests
    ✓ 첫 번째 추천 생성 성공 (62ms)
    ✓ 다른 역할에 대한 추천 생성 성공 (78ms)
    ...

PASS  src/vote/vote.service.spec.ts
  VoteService - One Person One Vote Tests
    ✓ 첫 번째 투표 생성 성공 (71ms)
    ✓ 중복 투표 시도 실패 (54ms)
    ...

Test Suites: 3 passed, 3 total
Tests:       46 passed, 46 total
Snapshots:   0 total
Time:        8.432 s

Coverage summary:
  Statements   : 92.5% ( 256/276 )
  Branches     : 88.3% ( 144/163 )
  Functions    : 91.2% ( 94/103 )
  Lines        : 93.1% ( 243/261 )
```

---

## 🔍 개발 중 테스트 실행

### Watch 모드 (파일 변경 시 자동 실행)

```bash
npm run test:watch
```

### 특정 테스트만 디버깅

```typescript
// 테스트 파일에서 .only 사용
it.only('디버깅할 테스트', async () => {
  // ...
});
```

---

## ❓ 문제 해결

### 문제: 테스트가 실행되지 않음

```bash
# Prisma 클라이언트 재생성
npm run prisma:generate

# node_modules 재설치
rm -rf node_modules package-lock.json
npm install
```

### 문제: DB 마이그레이션 실패

```bash
# test.db 삭제 후 재시도
rm test.db test.db-journal
npm test
```

### 문제: 타임아웃 에러

```bash
# jest.config.js에서 타임아웃 증가
testTimeout: 30000  # 30초
```

---

## 📝 다음 단계

1. **전체 문서 읽기**: `TEST_STRATEGY.md` 참고
2. **새 테스트 작성**: 기존 테스트를 템플릿으로 활용
3. **CI/CD 설정**: GitHub Actions 등에 통합

---

**Happy Testing! 🎉**
