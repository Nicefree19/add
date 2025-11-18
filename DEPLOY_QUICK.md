# ⚡ 원클릭 배포 가이드

> 가장 빠르고 쉬운 배포 방법 (5분 완성)

---

## 🎯 방법 1: Render Blueprint 자동 배포 (추천)

### 1단계: Render로 배포 (1클릭)

아래 버튼 클릭:

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/Nicefree19/add)

**또는 직접 접속:**
```
https://render.com/deploy?repo=https://github.com/Nicefree19/add
```

Render가 자동으로:
- ✅ PostgreSQL 데이터베이스 생성
- ✅ 백엔드 서비스 생성 및 배포
- ✅ 환경 변수 자동 설정

**필요한 작업:**
1. Render 계정 로그인 (GitHub로 가능)
2. **Deploy** 버튼 클릭
3. 배포 완료 대기 (약 5분)

**배포 완료 후:**
- 백엔드 URL 확인: `https://election-backend-xxxx.onrender.com`
- Health Check: `https://election-backend-xxxx.onrender.com/api/health`

---

## 🎨 방법 2: Vercel로 프론트엔드 배포 (1클릭)

### 1단계: Vercel로 배포 (1클릭)

아래 버튼 클릭:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/Nicefree19/add&root-directory=apps/frontend&env=NEXT_PUBLIC_API_URL&envDescription=Backend%20API%20URL&envLink=https://github.com/Nicefree19/add)

**또는 직접 접속:**
```
https://vercel.com/new/clone?repository-url=https://github.com/Nicefree19/add&root-directory=apps/frontend
```

**필요한 작업:**
1. Vercel 계정 로그인 (GitHub로 가능)
2. **Environment Variables** 설정:
   ```
   NEXT_PUBLIC_API_URL=https://election-backend-xxxx.onrender.com/api
   ```
   (방법 1에서 받은 백엔드 URL 입력)
3. **Deploy** 버튼 클릭

**배포 완료 후:**
- 프론트엔드 URL 확인: `https://election-frontend-xxxx.vercel.app`

---

## 🗄️ 3단계: 데이터베이스 초기화 (필수)

### Render Shell에서 Seed 실행

1. Render Dashboard → `election-backend` 선택
2. 우측 상단 **Shell** 버튼 클릭
3. 다음 명령어 실행:

```bash
# 백엔드 디렉토리로 이동
cd apps/backend

# 1. 초기 데이터 Seed (계좌 3개 + 임기 7개)
npm run prisma:seed

# 2. 거래내역 마이그레이션 (1,320건)
npm run prisma:migrate-finance
```

**예상 출력:**
```
✅ Created 3 accounts
✅ Created 7 terms
✨ Seed completed successfully!

💰 Migrating 1,320 transactions...
✅ Finance data migration completed!
```

---

## ✅ 최종 확인

### 백엔드 Health Check

브라우저에서 접속:
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

브라우저에서 접속:
```
https://election-frontend-xxxx.vercel.app
```

### 사우회 운영 페이지

```
https://election-frontend-xxxx.vercel.app/admin/management
```

---

## 🎉 배포 완료!

### 최종 URL

**🌐 프론트엔드 (사용자 접속):**
```
https://election-frontend-xxxx.vercel.app
```

**📊 사우회 운영 페이지:**
```
https://election-frontend-xxxx.vercel.app/admin/management
```

**🔧 백엔드 API:**
```
https://election-backend-xxxx.onrender.com/api
```

---

## 🔄 자동 배포 설정됨

코드를 푸시하면 자동으로 재배포:

```bash
git add .
git commit -m "feat: 새 기능 추가"
git push origin main
```

- ✅ Vercel: 자동 재배포 (약 1분)
- ✅ Render: 자동 재배포 (약 3-5분)

---

## 💡 추가 설정 (선택 사항)

### CORS 업데이트

백엔드에서 프론트엔드 도메인 허용:

1. Render Dashboard → `election-backend`
2. **Environment** 탭
3. `CORS_ORIGIN` 값 변경:
   ```
   https://election-frontend-xxxx.vercel.app
   ```
4. **Save Changes**

### 커스텀 도메인 연결

**Vercel:**
1. Dashboard → Settings → Domains
2. Add Domain: `election.yourdomain.com`
3. DNS 레코드 추가 (안내 표시됨)

**Render:**
1. Dashboard → Settings → Custom Domains
2. Add Domain: `api.yourdomain.com`
3. DNS 레코드 추가 (안내 표시됨)

---

## 🐛 문제 해결

### 백엔드 빌드 실패

**Render Logs 확인:**
1. Render Dashboard → `election-backend`
2. **Logs** 탭 확인

**일반적인 해결 방법:**
- 환경 변수 확인 (DATABASE_URL, JWT_SECRET 등)
- Build Command 확인: `cd apps/backend && npm install && npx prisma generate && npm run build`

### 프론트엔드 API 호출 실패

**환경 변수 확인:**
1. Vercel Dashboard → Settings → Environment Variables
2. `NEXT_PUBLIC_API_URL` 값 확인:
   ```
   https://election-backend-xxxx.onrender.com/api
   ```
3. **Redeploy** 클릭

### Render Sleep 모드

Render 무료 플랜은 15분 비활성 시 Sleep 모드:
- 첫 접속 시 30초~1분 대기 (Cold Start)
- 업그레이드: Paid Plan ($7/월) → 24/7 활성

---

## 📊 비용

- **Render PostgreSQL**: $0/월
- **Render Web Service**: $0/월
- **Vercel**: $0/월

**총 비용: 100% 무료** 🎉

---

**배포 완료! 이제 웹에서 확인하세요! 🚀**
