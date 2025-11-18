# 사우회 재무 데이터 마이그레이션 가이드

## 📋 개요

이 가이드는 사우회 운영자금 정산 데이터를 JSON 파일에서 PostgreSQL 데이터베이스로 마이그레이션하는 방법을 설명합니다.

## 🗂️ 파일 구조

```
/home/user/add/
├── prisma/
│   ├── schema.prisma                    # 데이터베이스 스키마
│   ├── migrations/
│   │   └── 20251118000001_add_finance_models/
│   │       └── migration.sql            # SQL 마이그레이션 파일
│   ├── seed.ts                          # 초기 계좌 및 임기 데이터 Seed
│   └── migrate-finance-data.ts          # JSON → DB 마이그레이션 스크립트
├── enhanced_dashboard_data.json         # 원본 재무 데이터 (1,320건)
└── apps/backend/
    └── src/finance/                     # Finance API 모듈
```

## 🚀 마이그레이션 실행 순서

### 1단계: 데이터베이스 준비

데이터베이스가 실행 중인지 확인합니다:

```bash
# Docker Compose 사용 시
docker-compose up -d postgres

# 또는 로컬 PostgreSQL 사용
# DATABASE_URL 환경 변수 설정 확인
```

### 2단계: Prisma Client 생성

```bash
cd apps/backend
npm run prisma:generate
```

### 3단계: 데이터베이스 마이그레이션 실행

새로운 테이블 (terms, accounts, transactions) 생성:

```bash
npm run prisma:migrate:dev
# 또는
npx prisma migrate deploy  # 프로덕션 환경
```

### 4단계: 초기 Account 및 Term 데이터 Seed

```bash
npm run prisma:seed
```

**생성되는 데이터:**

**계좌 (Accounts):**
- 카카오뱅크 사우회 (3333-28-1790885)
- 세이프박스
- 신한은행 (110-502-876387) - 폐쇄

**임기 (Terms):**
- 2019년 ~ 2025년 (7개)

### 5단계: JSON 데이터 마이그레이션

1,320건의 거래내역을 데이터베이스로 import:

```bash
npm run prisma:migrate-finance
```

**이 스크립트는:**
1. JSON 파일 (`enhanced_dashboard_data.json`) 읽기
2. 기존 거래내역 삭제 (재실행 대비)
3. 1,320건의 거래내역 생성
4. 계좌별 잔액 재계산
5. 데이터 검증 (JSON vs DB 합계 비교)

**예상 출력:**

```
🔄 Starting finance data migration...

📖 Reading JSON file...
✅ Loaded 1320 transactions from JSON

🗑️  Deleting existing transactions...
✅ Deleted 0 existing transactions

💾 Migrating transactions...
  Progress: 100/1320 (8%)
  Progress: 200/1320 (15%)
  ...
  Progress: 1320/1320 (100%)

✅ Migration completed:
  - Success: 1320 transactions
  - Errors: 0 transactions

💰 Recalculating account balances...
  - 카카오뱅크 사우회: 12,178,092원 (794건)
  - 세이프박스: -13,270,956원 (526건)
  - 신한은행 (폐쇄): 0원 (0건)

🔍 Validating data...

📊 Summary Comparison:

  JSON Data:
    Total Transactions: 1320
    Total Income:       158,260,416원
    Total Expense:      289,326,324원
    Net Amount:         -131,065,908원

  Database:
    Total Transactions: 1320
    Total Income:       158,260,416원
    Total Expense:      289,326,324원
    Net Amount:         -131,065,908원

  Match Status:
    Transactions: ✅ Match
    Income:       ✅ Match
    Expense:      ✅ Match

✨ Migration successful! All data validated.
```

## 🔍 검증

### 데이터 확인 (Prisma Studio)

```bash
cd apps/backend
npm run prisma:studio
```

브라우저에서 `http://localhost:5555` 접속하여 데이터 확인

### SQL로 직접 확인

```sql
-- 계좌 목록 조회
SELECT * FROM accounts;

-- 거래내역 통계
SELECT
  type,
  COUNT(*) as count,
  SUM(amount) as total
FROM transactions
WHERE deleted_at IS NULL
GROUP BY type;

-- 계좌별 실제 잔액 계산
SELECT
  a.name,
  a.balance as stored_balance,
  SUM(CASE WHEN t.type = 'INCOME' THEN t.amount ELSE -t.amount END) as calculated_balance,
  COUNT(t.id) as transaction_count
FROM accounts a
LEFT JOIN transactions t ON t.account_id = a.id AND t.deleted_at IS NULL
GROUP BY a.id, a.name, a.balance;

-- 연도별 통계
SELECT
  EXTRACT(YEAR FROM date) as year,
  type,
  COUNT(*) as count,
  SUM(amount) as total
FROM transactions
WHERE deleted_at IS NULL
GROUP BY year, type
ORDER BY year DESC, type;
```

## 🛠️ 문제 해결

### Prisma 엔진 다운로드 오류

```bash
Error: Failed to fetch sha256 checksum...
```

**해결책:**

```bash
export PRISMA_ENGINES_CHECKSUM_IGNORE_MISSING=1
npm run prisma:generate
```

### 마이그레이션 재실행

데이터를 다시 import해야 하는 경우:

```bash
# 거래내역만 삭제하고 재실행
npm run prisma:migrate-finance
# (스크립트가 자동으로 기존 데이터 삭제 후 재생성)
```

전체 데이터베이스 리셋:

```bash
npx prisma migrate reset  # ⚠️ 모든 데이터 삭제
npm run prisma:seed
npm run prisma:migrate-finance
```

### 데이터 불일치

JSON과 DB 합계가 맞지 않는 경우:

1. `enhanced_dashboard_data.json` 파일 경로 확인
2. `migrate-finance-data.ts`의 카테고리 매핑 규칙 확인
3. 내부 이체 거래 처리 로직 확인

## 📊 데이터 구조

### Account 모델

```prisma
model Account {
  id            String    @id
  name          String    // "카카오뱅크 사우회"
  accountNumber String?   // "3333-28-1790885"
  bankCode      BankCode  // KAKAO_BANK, SAFE_BOX, SHINHAN_BANK
  balance       Decimal   // 실제 잔액 (거래내역 기반 계산)
  isActive      Boolean   // 활성 여부
  transactions  Transaction[]
}
```

### Transaction 모델

```prisma
model Transaction {
  id          String          @id
  accountId   String
  date        DateTime
  amount      Decimal         // 양수 (항상)
  type        TransactionType // INCOME, EXPENSE
  category    String          // "회비수입", "식비", "경조사비" 등
  description String          // 거래 설명
  termId      String?         // 연도별 임기 (2019~2025)
  createdById String?         // 작성자 (마이그레이션 데이터는 null)
}
```

### Term 모델

```prisma
model Term {
  id          String   @id
  name        String   // "2019년", "2020년" 등
  startDate   DateTime
  endDate     DateTime
  isActive    Boolean  // 현재 활성 임기 (2025년만 true)
  transactions Transaction[]
}
```

## 🎯 다음 단계

마이그레이션 완료 후:

1. **Frontend API 연동**
   - `apps/frontend/app/(main)/admin/management/_components/FinanceTab.tsx`
   - 임시 데이터를 실제 API 호출로 대체

2. **거래내역 테이블 구현**
   - 필터링 (날짜, 계좌, 카테고리, 유형)
   - 검색 (설명 필드)
   - 정렬 (날짜, 금액)
   - 페이지네이션

3. **차트 구현**
   - 월별 수입/지출 추이
   - 카테고리별 분포
   - 연도별 비교

4. **권한 관리 테스트**
   - ADMIN: 모든 기능
   - AUDITOR: 조회 전용
   - MEMBER: 제한적 조회

## 📞 문의

문제가 발생하면 다음을 확인하세요:

1. 데이터베이스 연결 (`DATABASE_URL`)
2. Prisma Client 생성 여부 (`node_modules/.prisma/client`)
3. 마이그레이션 실행 여부 (`prisma/migrations` 폴더)
4. JSON 파일 경로 (`enhanced_dashboard_data.json`)
