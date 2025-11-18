# 🚀 즉시 배포 가이드 (Deploy Now)

> 웹에서 즉시 확인할 수 있도록 배포하는 가이드입니다.

**예상 소요 시간:** 10분
**비용:** 100% 무료

---

## 📋 배포 아키텍처

- **백엔드**: Render.com (무료 플랜)
- **프론트엔드**: Vercel (무료 플랜)
- **데이터베이스**: Render PostgreSQL (무료 플랜)

---

## 🎯 1단계: Render.com 백엔드 배포 (5분)

### 1.1. Render 계정 생성

1. [Render.com](https://render.com) 접속
2. **Get Started for Free** 클릭
3. GitHub 계정으로 로그인

### 1.2. 데이터베이스 생성

1. Dashboard → **New +** → **PostgreSQL**
2. 다음 정보 입력:
   - **Name**: `election-db`
   - **Database**: `election_db`
   - **User**: `election_user`
   - **Region**: Singapore (가장 가까운 지역)
   - **Plan**: Free
3. **Create Database** 클릭
4. ✅ **Internal Database URL** 복사 (나중에 사용)

### 1.3. 백엔드 서비스 생성

1. Dashboard → **New +** → **Web Service**
2. **Connect a repository** → GitHub 저장소 선택
3. 다음 정보 입력:

   **Basic Settings:**
   - **Name**: `election-backend`
   - **Region**: Singapore
   - **Branch**: `claude/integrate-alumni-management-013hFeLMtj7GCrq5UeqpHTSt` (또는 `main`)
   - **Root Directory**: `.` (루트)
   - **Runtime**: Node
   - **Build Command**:
     ```bash
     cd apps/backend && npm install && npx prisma generate && npm run build
     ```
   - **Start Command**:
     ```bash
     cd apps/backend && npx prisma migrate deploy && npm run start:prod
     ```

   **Advanced Settings:**
   - **Plan**: Free
   - **Health Check Path**: `/api/health`

4. **Environment Variables** 추가:
   ```
   NODE_ENV=production
   PORT=3000
   DATABASE_URL=<1.2단계에서 복사한 Internal Database URL>
   JWT_SECRET=<랜덤한 긴 문자열 - 아래 명령어로 생성>
   BALLOT_SECRET_SALT=<랜덤한 긴 문자열 - 아래 명령어로 생성>
   CORS_ORIGIN=*
   ```

   **시크릿 키 생성 (로컬 터미널):**
   ```bash
   # JWT_SECRET
   openssl rand -base64 64

   # BALLOT_SECRET_SALT
   openssl rand -base64 64
   ```

5. **Create Web Service** 클릭
6. ✅ 배포 완료 대기 (약 5분)
7. 배포 완료 후 **URL 복사** (예: `https://election-backend.onrender.com`)

### 1.4. 백엔드 테스트

브라우저에서 접속:
```
https://election-backend.onrender.com/api/health
```

예상 응답:
```json
{
  "status": "ok",
  "timestamp": "2025-11-18T..."
}
```

---

## 🎨 2단계: Vercel 프론트엔드 배포 (3분)

### 2.1. Vercel 계정 생성

1. [Vercel](https://vercel.com) 접속
2. **Sign Up** → GitHub 계정으로 로그인
3. GitHub 저장소 접근 권한 승인

### 2.2. 프로젝트 배포

1. **Add New Project** 클릭
2. GitHub 저장소 선택: `Nicefree19/add`
3. **Import** 클릭
4. 다음 정보 입력:

   **Project Settings:**
   - **Framework Preset**: Next.js
   - **Root Directory**: `apps/frontend` ✅ (중요!)
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`
   - **Install Command**: `npm install`

   **Environment Variables:**
   ```
   NEXT_PUBLIC_API_URL=https://election-backend.onrender.com/api
   ```

   ⚠️ **주의**: 1단계에서 복사한 백엔드 URL 뒤에 `/api` 추가!

5. **Deploy** 클릭
6. ✅ 배포 완료 대기 (약 2분)
7. 배포 완료 후 **URL 복사** (예: `https://election-frontend.vercel.app`)

### 2.3. 백엔드 CORS 업데이트

1. Render Dashboard → `election-backend` 선택
2. **Environment** 탭
3. `CORS_ORIGIN` 값 업데이트:
   ```
   https://election-frontend.vercel.app
   ```
4. **Save Changes** → 자동 재배포 대기

---

## 🗄️ 3단계: 데이터베이스 초기화 (2분)

### 3.1. Render Shell로 Seed 실행

1. Render Dashboard → `election-backend` 선택
2. **Shell** 탭 클릭
3. 다음 명령어 실행:

   ```bash
   # 1. Prisma 마이그레이션 (이미 시작 시 자동 실행됨)
   cd apps/backend && npx prisma migrate deploy

   # 2. 초기 데이터 Seed (계좌 3개 + 임기 7개)
   npm run prisma:seed

   # 3. 거래내역 마이그레이션 (1,320건)
   npm run prisma:migrate-finance

   # 4. 확인
   npx prisma studio
   ```

### 3.2. 데이터 확인

```bash
# 계좌 확인
cd apps/backend
npx prisma studio
```

Prisma Studio가 열리면:
- **accounts**: 3개 확인
- **terms**: 7개 확인
- **transactions**: 1,320개 확인

---

## ✅ 4단계: 최종 확인 및 테스트

### 4.1. 프론트엔드 접속

브라우저에서 접속:
```
https://election-frontend.vercel.app
```

### 4.2. 사우회 운영 페이지 접속

1. 로그인 (테스트 계정 필요 시 Prisma Studio로 추가)
2. 관리자 메뉴 → **사우회 운영** 클릭
3. URL 확인:
   ```
   https://election-frontend.vercel.app/admin/management
   ```

### 4.3. 기능 테스트

#### 재무 정산 탭
- [ ] 계좌 현황 카드 3개 표시
- [ ] 요약 통계 (총 입금액, 총 출금액, 순 금액) 표시
- [ ] 월별 Bar Chart 표시
- [ ] 카테고리별 Pie Chart 표시
- [ ] 거래내역 테이블 표시 (1,320건)
- [ ] 검색 기능 동작 ("회비" 검색)
- [ ] 날짜 필터 동작 (2024-01-01 ~ 2024-12-31)
- [ ] CSV 다운로드 버튼 동작

#### 임원진 이양 탭
- [ ] 선거 드롭다운 표시
- [ ] 문서 목록 표시

---

## 🌐 배포 완료!

### 최종 URL

**프론트엔드 (사용자 접속 URL):**
```
https://election-frontend.vercel.app
```

**사우회 운영 페이지:**
```
https://election-frontend.vercel.app/admin/management
```

**백엔드 API:**
```
https://election-backend.onrender.com/api
```

**Health Check:**
```
https://election-backend.onrender.com/api/health
```

---

## 🔧 자동 배포 설정 (선택 사항)

### GitHub Push 시 자동 배포

현재 설정:
- ✅ Vercel: `claude/**` 브랜치 푸시 시 자동 배포
- ✅ Render: 연결된 브랜치 푸시 시 자동 배포

테스트:
```bash
# 코드 수정
git add .
git commit -m "feat: 새 기능 추가"

# 푸시
git push origin claude/integrate-alumni-management-013hFeLMtj7GCrq5UeqpHTSt

# 자동 배포 확인
# Vercel: https://vercel.com/dashboard
# Render: https://dashboard.render.com
```

---

## 🎨 커스텀 도메인 연결 (선택 사항)

### Vercel 도메인 연결

1. Vercel Dashboard → 프로젝트 선택
2. **Settings** → **Domains**
3. 도메인 추가 (예: `election.yourdomain.com`)
4. DNS 레코드 추가:
   ```
   Type: CNAME
   Name: election
   Value: cname.vercel-dns.com
   ```

### Render 도메인 연결

1. Render Dashboard → `election-backend` 선택
2. **Settings** → **Custom Domains**
3. 도메인 추가 (예: `api.yourdomain.com`)
4. DNS 레코드 추가:
   ```
   Type: CNAME
   Name: api
   Value: election-backend.onrender.com
   ```

---

## 🐛 문제 해결

### 문제 1: 백엔드 배포 실패

**증상:** "Build failed" 에러

**해결:**
1. Render Logs 확인
2. Build Command 확인:
   ```bash
   cd apps/backend && npm install && npx prisma generate && npm run build
   ```
3. 환경 변수 확인 (DATABASE_URL, JWT_SECRET 등)

### 문제 2: 프론트엔드 API 호출 실패

**증상:** "Network Error" 또는 CORS 에러

**해결:**
1. `NEXT_PUBLIC_API_URL` 확인:
   ```
   https://election-backend.onrender.com/api
   ```
2. 백엔드 `CORS_ORIGIN` 확인:
   ```
   https://election-frontend.vercel.app
   ```
3. Vercel → **Settings** → **Environment Variables** → **Redeploy**

### 문제 3: 데이터베이스 연결 실패

**증상:** "Can't reach database server"

**해결:**
1. Render Dashboard → `election-db` 선택
2. **Internal Database URL** 복사
3. `election-backend` → **Environment** → `DATABASE_URL` 업데이트

### 문제 4: Render 무료 플랜 Sleep 모드

**증상:** 첫 접속 시 느림 (15분 이상 비활성 시)

**해결:**
- Render 무료 플랜은 비활성 시 Sleep 모드로 전환됩니다
- 첫 요청 시 약 30초~1분 대기 (Cold Start)
- 업그레이드 옵션: Paid Plan ($7/월) → 24/7 활성

---

## 📊 비용

- **Render PostgreSQL**: $0/월 (Free Plan)
- **Render Web Service**: $0/월 (Free Plan, Sleep after 15 min)
- **Vercel**: $0/월 (Free Plan, Unlimited deployments)

**총 비용: $0/월** 🎉

---

## 🎯 다음 단계

배포 완료 후:
- [ ] 프로덕션 환경에서 전체 기능 테스트
- [ ] 성능 모니터링 (Vercel Analytics, Render Metrics)
- [ ] 사용자 피드백 수집
- [ ] 커스텀 도메인 연결
- [ ] SSL 인증서 자동 설정 확인 (Vercel/Render 자동 제공)

---

**배포 완료! 🚀**

최종 URL을 팀원들과 공유하고 웹에서 확인하세요!
