# 🚀 빠른 배포 가이드

> 지금 바로 웹에서 확인할 수 있는 3가지 배포 방법

---

## 방법 1: Vercel로 배포 (가장 빠름 - 3분) ⚡

### 웹 브라우저만으로 배포 가능!

1. **Vercel 가입**
   - https://vercel.com 접속
   - GitHub 계정으로 로그인

2. **프로젝트 Import**
   - Dashboard → "New Project" 클릭
   - GitHub에서 "Nicefree19/add" 저장소 선택
   - Import 클릭

3. **설정**
   ```
   Framework Preset: Next.js
   Root Directory: apps/frontend
   Build Command: npm run build
   Output Directory: .next
   ```

4. **Environment Variables 추가**
   ```
   NEXT_PUBLIC_API_URL = http://localhost:3000
   ```
   (나중에 백엔드 URL로 변경 가능)

5. **Deploy 클릭**

✅ **완료!** 약 2분 후 URL 생성됨
   - 예: `https://election-system-abc123.vercel.app`

### 프론트엔드만 배포되므로, 백엔드는 별도로 실행 필요:

```bash
# 백엔드 실행 (로컬)
cd apps/backend
npm ci
npm run build
npm run start:prod
```

---

## 방법 2: Docker로 한번에 배포 (권장) 🐳

### 전체 스택(DB + 백엔드 + 프론트엔드)을 한번에!

#### 사전 요구사항
- Docker Desktop 설치: https://www.docker.com/products/docker-desktop

#### 배포 명령어

```bash
# 1. 자동 배포 스크립트 실행
./deploy.sh

# 또는 수동으로:

# 2. 환경 변수 설정
cp .env.docker.example .env

# 3. Docker Compose 실행
docker-compose up -d

# 4. 로그 확인
docker-compose logs -f
```

#### 접속

- **프론트엔드**: http://localhost:3001
- **백엔드 API**: http://localhost:3000
- **Health Check**: http://localhost:3000/api/health

#### 테스트 계정

- 관리자: `admin@test.com`
- 감사: `auditor@test.com`
- 회원: `hong.gildong@test.com`

OTP 코드는 백엔드 로그에서 확인:
```bash
docker-compose logs backend | grep "OTP generated"
```

#### 중지

```bash
docker-compose down
```

---

## 방법 3: 로컬에서 직접 실행 (개발용) 💻

### Node.js만 있으면 실행 가능!

#### 사전 요구사항
- Node.js 18+ 설치: https://nodejs.org
- PostgreSQL 설치 (또는 Docker)

#### 1. PostgreSQL 시작

**Option A: Docker 사용**
```bash
docker run -d \
  --name election-postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=election_db \
  -p 5432:5432 \
  postgres:15
```

**Option B: 로컬 PostgreSQL**
```bash
# Ubuntu/Debian
sudo systemctl start postgresql

# macOS (Homebrew)
brew services start postgresql
```

#### 2. 백엔드 설정 및 실행

```bash
# 의존성 설치
cd apps/backend
npm ci

# 환경 변수 설정
cp .env.example .env
nano .env  # DATABASE_URL, JWT_SECRET 등 설정

# Prisma 설정
npx prisma generate
npx prisma migrate deploy

# 테스트 계정 생성
psql -U postgres -d election_db -f scripts/create-test-accounts.sql

# 백엔드 실행
npm run start:dev
```

#### 3. 프론트엔드 실행 (새 터미널)

```bash
cd apps/frontend
npm ci

# 환경 변수 설정 (선택)
echo "NEXT_PUBLIC_API_URL=http://localhost:3000" > .env.local

# 프론트엔드 실행
npm run dev
```

#### 4. 접속

- 프론트엔드: http://localhost:3001
- 백엔드: http://localhost:3000

---

## 🎯 Makefile로 한번에! (가장 편함)

```bash
# 1. 초기 설정 (최초 1회)
make setup

# 2. 개발 서버 시작 (백엔드 + 프론트엔드 동시)
make dev

# 3. 테스트
make test

# 4. 빌드
make build

# 5. Docker 실행
make docker-up

# 6. Docker 중지
make docker-down

# 7. Health Check
make health-check

# 8. 도움말
make help
```

---

## 📊 배포 방법 비교

| 방법 | 난이도 | 속도 | 전체 스택 | 용도 |
|------|--------|------|-----------|------|
| **Vercel** | ⭐ 매우 쉬움 | ⚡ 3분 | ❌ 프론트엔드만 | 프론트엔드 데모 |
| **Docker** | ⭐⭐ 쉬움 | ⚡⚡ 10분 | ✅ 전체 | 프로덕션 테스트 |
| **로컬 실행** | ⭐⭐⭐ 보통 | ⚡⚡⚡ 15분 | ✅ 전체 | 개발 |
| **Makefile** | ⭐⭐ 쉬움 | ⚡⚡ 5분 | ✅ 전체 | 개발 |

---

## 🔧 트러블슈팅

### 포트가 이미 사용 중입니다

```bash
# 3000번 포트 사용 중인 프로세스 확인
lsof -i :3000

# 프로세스 종료
kill -9 <PID>
```

### Docker 컨테이너가 시작되지 않습니다

```bash
# 로그 확인
docker-compose logs backend
docker-compose logs postgres

# 컨테이너 재시작
docker-compose restart

# 완전 재시작
docker-compose down -v
docker-compose up -d
```

### OTP를 받을 수 없습니다

개발 환경에서는 이메일 전송이 설정되지 않았습니다.
백엔드 로그에서 OTP 코드를 확인하세요:

```bash
# Docker
docker-compose logs backend | grep "OTP generated"

# 로컬
# 터미널에 출력된 로그 확인
```

### DATABASE_URL 오류

`.env` 파일의 `DATABASE_URL`을 확인하세요:

```bash
# Docker 사용 시
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/election_db?schema=public"

# Docker Compose 사용 시
DATABASE_URL="postgresql://postgres:postgres@postgres:5432/election_db?schema=public"
```

---

## 📱 배포 후 확인사항

### ✅ 체크리스트

- [ ] 프론트엔드가 브라우저에서 열림
- [ ] 백엔드 Health Check 응답: http://localhost:3000/api/health
- [ ] 로그인 OTP 요청 가능
- [ ] 백엔드 로그에서 OTP 코드 확인 가능
- [ ] 테스트 계정으로 로그인 성공

### 🎉 성공!

축하합니다! 선거 시스템이 성공적으로 배포되었습니다.

다음 단계:
- [ ] 실제 이메일 서비스 연동 (SendGrid/AWS SES)
- [ ] 프로덕션 서버 배포
- [ ] 커스텀 도메인 설정
- [ ] SSL 인증서 설정

자세한 내용은 [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)를 참고하세요.
