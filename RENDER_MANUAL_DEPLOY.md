# 🚀 Render 수동 배포 가이드 (Manual Deployment)

> Blueprint 자동 배포 대신 수동으로 설정하는 방법입니다.

---

## 1단계: PostgreSQL 데이터베이스 생성 (3분)

### 1.1. Render 로그인

1. [Render.com](https://render.com) 접속
2. **Get Started for Free** 클릭
3. GitHub 계정으로 로그인

### 1.2. 데이터베이스 생성

1. Dashboard → **New +** → **PostgreSQL**
2. 다음 정보 입력:
   ```
   Name: election-db
   Database: election_db
   User: election_user
   Region: Singapore (또는 가까운 지역)
   Plan: Free
   ```
3. **Create Database** 클릭
4. ✅ 생성 완료 (약 1분)

### 1.3. 데이터베이스 URL 복사

1. 생성된 데이터베이스 클릭
2. **Connections** 섹션에서 **Internal Database URL** 복사
   ```
   postgresql://election_user:xxxxx@dpg-xxxxx.singapore-postgres.render.com/election_db
   ```
3. 📋 메모장에 저장 (다음 단계에서 사용)

---

## 2단계: 백엔드 서비스 생성 (5분)

### 2.1. 새 Web Service 생성

1. Dashboard → **New +** → **Web Service**
2. **Connect a repository** 클릭
3. GitHub 저장소 선택: `Nicefree19/add`
4. **Connect** 클릭

### 2.2. 서비스 설정

**Basic Settings:**

| 항목 | 값 |
|------|-----|
| **Name** | `election-backend` |
| **Region** | Singapore |
| **Branch** | `claude/integrate-alumni-management-013hFeLMtj7GCrq5UeqpHTSt` ⚠️ 중요! |
| **Root Directory** | 비워두기 (루트) |
| **Runtime** | Node |
| **Build Command** | `cd apps/backend && npm install && npx prisma generate && npm run build` |
| **Start Command** | `cd apps/backend && npx prisma migrate deploy && npm run start:prod` |
| **Plan** | Free |

### 2.3. 환경 변수 설정

**Environment Variables** 섹션에서 다음 변수 추가:

```bash
# 1. NODE_ENV
NODE_ENV=production

# 2. PORT
PORT=3000

# 3. DATABASE_URL (1단계에서 복사한 URL)
DATABASE_URL=postgresql://election_user:xxxxx@dpg-xxxxx.singapore-postgres.render.com/election_db

# 4. JWT_SECRET (아래 명령어로 생성)
JWT_SECRET=<생성된 시크릿 키>

# 5. BALLOT_SECRET_SALT (아래 명령어로 생성)
BALLOT_SECRET_SALT=<생성된 시크릿 키>

# 6. CORS_ORIGIN
CORS_ORIGIN=*
```

**시크릿 키 생성 방법:**

로컬 터미널에서 실행:
```bash
# JWT_SECRET 생성
openssl rand -base64 64

# BALLOT_SECRET_SALT 생성
openssl rand -base64 64
```

또는 Makefile 사용:
```bash
make generate-secrets
```

### 2.4. Health Check 설정

**Advanced** 섹션:
- **Health Check Path**: `/api/health`

### 2.5. 배포 시작

1. 모든 설정 확인
2. **Create Web Service** 클릭
3. ✅ 배포 시작 (약 5-7분 소요)

### 2.6. 배포 로그 확인

**Logs** 탭에서 다음 메시지 확인:
```
✓ Built in XXXms
✓ Prisma schema loaded from prisma/schema.prisma
✓ Datasource "db": PostgreSQL database
✓ Migrations: XXX applied
[Nest] LOG [NestApplication] Nest application successfully started
🚀 Server running on http://0.0.0.0:3000
```

### 2.7. 백엔드 URL 확인

배포 완료 후:
- URL: `https://election-backend-xxxx.onrender.com`
- Health Check: `https://election-backend-xxxx.onrender.com/api/health`

브라우저에서 Health Check 접속 시 응답:
```json
{
  "status": "ok",
  "timestamp": "2025-11-18T..."
}
```

---

## 3단계: 데이터베이스 초기화 (2분)

### 3.1. Render Shell 접속

1. Render Dashboard → `election-backend` 선택
2. 우측 상단 **Shell** 버튼 클릭 (터미널 아이콘)
3. Shell 창이 열림

### 3.2. Seed 실행

Shell에서 다음 명령어 실행:

```bash
# 백엔드 디렉토리로 이동
cd apps/backend

# 1. 초기 데이터 생성 (계좌 3개 + 임기 7개)
npm run prisma:seed
```

**예상 출력:**
```
🌱 Seeding database...
✅ Created 3 accounts:
  - 카카오뱅크 사우회 (3333-28-1790885)
  - 세이프박스
  - 신한은행 (폐쇄) (110-502-876387) [폐쇄]

✅ Created 7 terms (2019-2025)

✨ Seed completed successfully!
```

```bash
# 2. 거래내역 마이그레이션 (1,320건)
npm run prisma:migrate-finance
```

**예상 출력:**
```
💰 Migrating finance data...
📊 Processing 1,320 transactions...
✅ Successfully migrated 1,320 transactions
📈 Total Income: ₩XX,XXX,XXX
📉 Total Expense: ₩XX,XXX,XXX
💰 Net Balance: ₩XX,XXX,XXX
✨ Finance data migration completed!
```

### 3.3. 데이터 확인 (선택 사항)

Prisma Studio로 데이터 확인:

```bash
cd apps/backend
npx prisma studio
```

그런 다음 Render가 제공하는 임시 URL로 Prisma Studio 접속 가능합니다.

---

## 4단계: Vercel 프론트엔드 배포 (3분)

### 4.1. Vercel 로그인

1. [Vercel](https://vercel.com) 접속
2. **Sign Up** → GitHub 계정으로 로그인

### 4.2. 프로젝트 Import

1. **Add New Project** 클릭
2. GitHub 저장소 선택: `Nicefree19/add`
3. **Import** 클릭

### 4.3. 프로젝트 설정

**Configure Project:**

| 항목 | 값 |
|------|-----|
| **Framework Preset** | Next.js |
| **Root Directory** | `apps/frontend` ✅ 클릭하여 선택! |
| **Build Command** | `npm run build` (자동 설정됨) |
| **Output Directory** | `.next` (자동 설정됨) |
| **Install Command** | `npm install` (자동 설정됨) |

### 4.4. 환경 변수 설정

**Environment Variables** 섹션:

```
Name: NEXT_PUBLIC_API_URL
Value: https://election-backend-xxxx.onrender.com/api
```

⚠️ **주의**: 2단계에서 받은 백엔드 URL 뒤에 `/api` 추가!

### 4.5. 배포 시작

1. **Deploy** 클릭
2. ✅ 배포 완료 (약 2-3분)
3. URL 확인: `https://election-frontend-xxxx.vercel.app`

---

## 5단계: CORS 업데이트 (1분)

### 5.1. 백엔드 CORS 설정

1. Render Dashboard → `election-backend` 선택
2. **Environment** 탭
3. `CORS_ORIGIN` 변수 값 업데이트:
   ```
   https://election-frontend-xxxx.vercel.app
   ```
   (4단계에서 받은 프론트엔드 URL 입력)
4. **Save Changes** 클릭
5. 자동 재배포 시작 (약 1-2분)

---

## ✅ 배포 완료 확인

### 백엔드 Health Check

```
https://election-backend-xxxx.onrender.com/api/health
```

예상 응답:
```json
{
  "status": "ok",
  "timestamp": "2025-11-18T..."
}
```

### 프론트엔드 접속

```
https://election-frontend-xxxx.vercel.app
```

### 사우회 운영 페이지

```
https://election-frontend-xxxx.vercel.app/admin/management
```

---

## 🎉 최종 URL

### 🌐 프론트엔드 (사용자 접속)
```
https://election-frontend-xxxx.vercel.app
```

### 📊 사우회 운영 페이지 (관리자)
```
https://election-frontend-xxxx.vercel.app/admin/management
```

### 🔧 백엔드 API
```
https://election-backend-xxxx.onrender.com/api
```

---

## 🔄 자동 재배포 설정

### Render 자동 배포

1. Render Dashboard → `election-backend`
2. **Settings** 탭
3. **Auto-Deploy** 섹션
4. Branch: `claude/integrate-alumni-management-013hFeLMtj7GCrq5UeqpHTSt`
5. **Enable** 체크

### Vercel 자동 배포

이미 활성화되어 있음. 코드 푸시 시 자동 재배포:

```bash
git add .
git commit -m "feat: 새 기능 추가"
git push origin claude/integrate-alumni-management-013hFeLMtj7GCrq5UeqpHTSt
```

---

## 🐛 문제 해결

### 문제 1: 백엔드 빌드 실패

**증상:** "Build failed" 에러

**해결:**
1. Render Logs 확인
2. Build Command 다시 확인:
   ```bash
   cd apps/backend && npm install && npx prisma generate && npm run build
   ```
3. Branch가 `claude/integrate-alumni-management-013hFeLMtj7GCrq5UeqpHTSt`인지 확인

### 문제 2: 데이터베이스 연결 실패

**증상:** "Can't reach database server"

**해결:**
1. `DATABASE_URL` 환경 변수 확인
2. PostgreSQL 상태 확인 (Render Dashboard)
3. Internal Database URL 재복사

### 문제 3: Prisma 마이그레이션 실패

**증상:** "Migration failed"

**해결:**
Shell에서 수동 마이그레이션:
```bash
cd apps/backend
npx prisma migrate deploy
```

### 문제 4: 프론트엔드 API 호출 실패

**증상:** "Network Error" 또는 CORS 에러

**해결:**
1. `NEXT_PUBLIC_API_URL` 확인 (Vercel Environment Variables)
2. 백엔드 `CORS_ORIGIN` 확인 (Render Environment Variables)
3. Vercel → **Deployments** → **Redeploy**

### 문제 5: Render Sleep 모드

**증상:** 첫 접속 시 30초~1분 대기

**설명:**
- Render 무료 플랜은 15분 비활성 시 Sleep 모드로 전환
- 첫 요청 시 Cold Start 발생 (약 30초~1분)
- 업그레이드: Paid Plan ($7/월) → 24/7 활성

---

## 💰 비용

- **Render PostgreSQL**: $0/월 (Free Plan, 1GB storage)
- **Render Web Service**: $0/월 (Free Plan, 750 hours/month)
- **Vercel**: $0/월 (Free Plan, unlimited deployments)

**총 비용: 100% 무료** 🎉

---

## 📞 추가 도움

문제가 계속되면:
1. Render Logs 전체 복사
2. Vercel Deployment Logs 확인
3. 브라우저 Console (F12) 에러 메시지 확인

**배포 성공하셨으면 최종 URL을 공유해주세요!** 🚀
