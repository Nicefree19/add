# 사우회 운영 통합 페이지 - 로컬 실행 가이드

## 📋 사전 요구사항

다음 프로그램들이 설치되어 있어야 합니다:

- **Node.js** v18 이상
- **npm** v9 이상
- **PostgreSQL** v14 이상

확인 방법:
```bash
node --version  # v18.0.0 이상
npm --version   # v9.0.0 이상
psql --version  # PostgreSQL 14 이상
```

---

## 🚀 빠른 시작 (5분 안에)

### 1단계: 데이터베이스 준비

#### Option A: Docker 사용 (추천)

```bash
# Docker Compose로 PostgreSQL 실행
docker-compose up -d postgres

# 데이터베이스 접속 확인
docker exec -it election-postgres psql -U postgres -d election_db
```

#### Option B: 로컬 PostgreSQL 사용

```bash
# PostgreSQL 데이터베이스 생성
createdb election_dev

# 또는 psql로 접속해서
psql -U postgres
CREATE DATABASE election_dev;
\q
```

---

### 2단계: 환경 변수 설정

#### Backend 환경 변수

```bash
cd apps/backend

# .env 파일 생성
cp .env.example .env

# .env 파일 편집
nano .env  # 또는 code .env
```

`.env` 파일 내용 (중요한 부분만):

```env
# Database
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/election_dev?schema=public"

# JWT Secret (임의의 긴 문자열)
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"

# Ballot Secret (임의의 긴 문자열)
BALLOT_SECRET_SALT="your-ballot-secret-salt-change-this"

# CORS (프론트엔드 주소)
CORS_ORIGIN="http://localhost:3001"

# Node Environment
NODE_ENV="development"
PORT=3000
```

**중요**: `DATABASE_URL`을 자신의 PostgreSQL 설정에 맞게 수정하세요!

---

### 3단계: 의존성 설치

```bash
# Backend 의존성 설치
cd apps/backend
npm install

# Frontend 의존성 설치
cd ../frontend
npm install

# 루트로 돌아가기
cd ../..
```

---

### 4단계: 데이터베이스 마이그레이션

```bash
cd apps/backend

# Prisma Client 생성
npm run prisma:generate

# 데이터베이스 마이그레이션 (테이블 생성)
npm run prisma:migrate:dev
# 프롬프트가 나오면 Enter 키 입력

# 초기 데이터 Seed (계좌 3개 + 임기 7개)
npm run prisma:seed

# 거래내역 마이그레이션 (1,320건) - 선택 사항
npm run prisma:migrate-finance
```

**예상 출력:**
```
✅ Created 3 accounts:
  - 카카오뱅크 사우회 (3333-28-1790885)
  - 세이프박스
  - 신한은행 (폐쇄) (110-502-876387) [폐쇄]

✅ Created 7 terms (2019-2025)

✨ Seed completed successfully!
```

---

### 5단계: Backend 실행

```bash
cd apps/backend

# 개발 모드로 실행 (자동 재시작)
npm run start:dev
```

**성공 확인:**
```
[Nest] LOG [NestApplication] Nest application successfully started
[Nest] LOG [NestApplication] 🚀 Server running on http://localhost:3000
```

브라우저에서 확인: http://localhost:3000/api/health
```json
{
  "status": "ok",
  "timestamp": "2025-11-18T..."
}
```

---

### 6단계: Frontend 실행 (새 터미널)

```bash
# 새 터미널 창 열기
cd apps/frontend

# 개발 서버 실행
npm run dev
```

**성공 확인:**
```
✓ Ready in 2.3s
  ○ Local:        http://localhost:3001
  ○ Network:      http://192.168.x.x:3001
```

---

### 7단계: 접속 및 테스트

#### 메인 페이지 접속

브라우저에서 http://localhost:3001 접속

#### 관리자 로그인

**테스트 계정이 필요한 경우**, 데이터베이스에 직접 추가:

```bash
# Prisma Studio 실행 (GUI)
cd apps/backend
npm run prisma:studio
```

브라우저에서 http://localhost:5555 자동 오픈

**Users 테이블에 테스트 계정 추가:**
- employeeNo: `admin001`
- email: `admin@example.com`
- name: `관리자`
- role: `ADMIN`
- password: (필요한 경우)

#### 사우회 운영 페이지 접속

로그인 후: http://localhost:3001/admin/management

---

## 📊 기능 테스트

### 재무 정산 탭

1. **계좌 현황**: 카카오뱅크, 세이프박스 잔액 확인
2. **요약 통계**: 총 입금액, 총 출금액, 순 금액 확인
3. **차트**:
   - 월별 Bar Chart
   - 카테고리별 Pie Chart
4. **거래내역 테이블**:
   - 검색창에 "회비" 입력 후 검색
   - 유형 필터: "입금"만 선택
   - 날짜 범위: 2024-01-01 ~ 2024-12-31
   - CSV 다운로드 버튼 클릭

### 임원진 이양 탭

1. **선거 선택**: 드롭다운에서 선거 선택
2. **문서 목록**: 인수인계 문서 확인

---

## 🛠️ 문제 해결

### 문제 1: 데이터베이스 연결 오류

```
Error: Can't reach database server at `localhost:5432`
```

**해결책:**
1. PostgreSQL이 실행 중인지 확인
   ```bash
   # Mac
   brew services list | grep postgres

   # Linux
   sudo systemctl status postgresql

   # Docker
   docker ps | grep postgres
   ```

2. `.env` 파일의 `DATABASE_URL` 확인
3. 포트 번호 확인 (기본: 5432)

---

### 문제 2: Prisma 마이그레이션 오류

```
Error: P1001: Can't connect to database
```

**해결책:**
```bash
# 데이터베이스 수동 생성
psql -U postgres
CREATE DATABASE election_dev;
\q

# 다시 마이그레이션
npm run prisma:migrate:dev
```

---

### 문제 3: Frontend API 호출 실패

```
Network Error: Failed to fetch
```

**해결책:**
1. Backend가 실행 중인지 확인 (http://localhost:3000/api/health)
2. CORS 설정 확인 (`.env`의 `CORS_ORIGIN`)
3. 브라우저 콘솔에서 에러 확인 (F12)

---

### 문제 4: 포트가 이미 사용 중

```
Error: Port 3000 is already in use
```

**해결책:**
```bash
# 포트 사용 중인 프로세스 확인
# Mac/Linux
lsof -i :3000

# Windows
netstat -ano | findstr :3000

# 프로세스 종료 또는 다른 포트 사용
PORT=3002 npm run start:dev
```

---

## 🔍 데이터 확인

### Prisma Studio로 데이터 확인

```bash
cd apps/backend
npm run prisma:studio
```

http://localhost:5555 에서 확인 가능:
- **accounts**: 계좌 3개
- **terms**: 임기 7개 (2019-2025)
- **transactions**: 거래내역 1,320건 (마이그레이션 실행 시)

### SQL로 직접 확인

```bash
psql -U postgres -d election_dev

-- 계좌 목록
SELECT * FROM accounts;

-- 거래내역 통계
SELECT
  type,
  COUNT(*) as count,
  SUM(amount) as total
FROM transactions
WHERE deleted_at IS NULL
GROUP BY type;

-- 최근 거래 10건
SELECT
  date,
  type,
  category,
  description,
  amount
FROM transactions
ORDER BY date DESC
LIMIT 10;
```

---

## 📱 API 테스트 (선택 사항)

### cURL로 API 테스트

```bash
# Health Check
curl http://localhost:3000/api/health

# 계좌 목록 (인증 필요)
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  http://localhost:3000/finance/accounts

# 거래내역 조회
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  "http://localhost:3000/finance/transactions?page=1&pageSize=10"
```

### Postman Collection

1. Postman 설치
2. 새 컬렉션 생성: "Alumni Management API"
3. 요청 추가:
   - `GET http://localhost:3000/finance/accounts`
   - `GET http://localhost:3000/finance/transactions`
   - `GET http://localhost:3000/finance/summary?groupBy=month`

---

## 🎯 다음 단계

실행이 성공했다면:

1. **데이터 추가**: Prisma Studio로 테스트 데이터 추가
2. **UI 테스트**: 모든 필터링, 정렬, 검색 기능 테스트
3. **CSV 다운로드**: 엑셀로 열어서 한글 확인
4. **차트 확인**: 월별/카테고리별 차트 시각화 확인

---

## 💡 유용한 명령어

```bash
# Backend 로그 확인
cd apps/backend
npm run start:dev

# Frontend 빌드 (프로덕션)
cd apps/frontend
npm run build
npm run start

# 데이터베이스 리셋 (주의!)
cd apps/backend
npx prisma migrate reset  # 모든 데이터 삭제
npm run prisma:seed       # 초기 데이터 재생성

# Prisma 스키마 포맷팅
npx prisma format

# 의존성 업데이트
npm update
```

---

## 📞 도움이 필요한 경우

1. **로그 확인**: Backend/Frontend 터미널 로그 확인
2. **브라우저 콘솔**: F12 → Console 탭에서 에러 확인
3. **데이터베이스 확인**: Prisma Studio로 데이터 상태 확인
4. **환경 변수 확인**: `.env` 파일 설정 재확인

---

## ✅ 체크리스트

실행 전 체크:
- [ ] Node.js v18+ 설치
- [ ] PostgreSQL 실행 중
- [ ] `.env` 파일 생성 및 설정
- [ ] Backend 의존성 설치 완료
- [ ] Frontend 의존성 설치 완료
- [ ] Prisma 마이그레이션 완료
- [ ] Seed 데이터 생성 완료

실행 확인:
- [ ] Backend 실행 중 (http://localhost:3000/api/health)
- [ ] Frontend 실행 중 (http://localhost:3001)
- [ ] 로그인 가능
- [ ] /admin/management 접속 가능
- [ ] 계좌 현황 표시
- [ ] 차트 표시
- [ ] 거래내역 테이블 표시

---

**Happy Coding! 🚀**
