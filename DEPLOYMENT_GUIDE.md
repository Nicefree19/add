# 🚀 배포 가이드 (Deployment Guide)

> 선거 시스템을 자동으로 배포하고 웹에서 확인하는 완전 가이드

**작성일:** 2025-11-17
**버전:** 1.0.0

---

## 📋 목차

1. [빠른 시작 (Quick Start)](#1-빠른-시작-quick-start)
2. [GitHub Actions 자동 배포 설정](#2-github-actions-자동-배포-설정)
3. [Vercel 프론트엔드 배포](#3-vercel-프론트엔드-배포)
4. [Docker로 로컬 실행](#4-docker로-로컬-실행)
5. [프로덕션 서버 배포](#5-프로덕션-서버-배포)
6. [모니터링 및 관리](#6-모니터링-및-관리)
7. [트러블슈팅](#7-트러블슈팅)

---

## 1. 빠른 시작 (Quick Start)

### 🎯 목표
- GitHub에 코드 푸시하면 자동으로 테스트/빌드/배포
- 프론트엔드는 Vercel에서 즉시 확인 가능
- 백엔드는 서버 또는 Docker로 배포

### ✅ 사전 요구사항

- [ ] Git 설치
- [ ] GitHub 계정
- [ ] Node.js 18+ 설치
- [ ] (선택) Docker 설치
- [ ] (선택) Vercel 계정

---

## 2. GitHub Actions 자동 배포 설정

### 2.1. GitHub Secrets 설정

GitHub 저장소 → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**

#### 백엔드 배포용 Secrets

| Secret 이름 | 설명 | 예시 |
|-------------|------|------|
| `DEPLOY_HOST` | 배포 서버 IP/도메인 | `123.456.789.0` |
| `DEPLOY_USER` | 배포 서버 사용자명 | `deploy` |
| `DEPLOY_SSH_KEY` | SSH Private Key | `-----BEGIN RSA PRIVATE KEY-----...` |

```bash
# SSH Key 생성 (로컬에서 실행)
ssh-keygen -t rsa -b 4096 -C "deploy@election-system"

# Public key를 서버에 복사
ssh-copy-id -i ~/.ssh/id_rsa.pub deploy@your-server.com

# Private key를 GitHub Secret에 추가
cat ~/.ssh/id_rsa
# 전체 내용을 복사하여 DEPLOY_SSH_KEY에 붙여넣기
```

#### 프론트엔드 배포용 Secrets (Vercel)

| Secret 이름 | 설명 | 획득 방법 |
|-------------|------|-----------|
| `VERCEL_TOKEN` | Vercel API Token | [Vercel Dashboard](https://vercel.com/account/tokens) → Create |
| `VERCEL_ORG_ID` | Vercel Organization ID | `vercel link` 실행 후 `.vercel/project.json` 확인 |
| `VERCEL_PROJECT_ID` | Vercel Project ID | `vercel link` 실행 후 `.vercel/project.json` 확인 |
| `NEXT_PUBLIC_API_URL` | 백엔드 API URL | `https://api.yourdomain.com` |

```bash
# Vercel CLI 설치 및 링크
npm install -g vercel
cd apps/frontend
vercel link

# .vercel/project.json 확인
cat .vercel/project.json
# orgId와 projectId를 GitHub Secrets에 추가
```

### 2.2. 워크플로우 자동 실행

이제 코드를 푸시하면 자동으로:

```bash
# 1. 코드 수정
git add .
git commit -m "feat: 새 기능 추가"

# 2. GitHub에 푸시
git push origin main

# 3. GitHub Actions 자동 실행
# - 백엔드: 테스트 → 빌드 → 배포
# - 프론트엔드: 린트 → 빌드 → Vercel 배포

# 4. 배포 완료 확인
# GitHub 저장소 → Actions 탭에서 진행 상황 확인
```

### 2.3. Pull Request 자동 Preview

PR을 생성하면 자동으로 Preview 배포:

```bash
# 1. 새 브랜치 생성
git checkout -b feature/new-feature

# 2. 코드 수정 후 푸시
git add .
git commit -m "feat: 새 기능 개발"
git push origin feature/new-feature

# 3. GitHub에서 Pull Request 생성

# 4. 자동으로 Preview URL 생성됨
# PR 댓글에 Preview URL이 표시됨
# 예: https://election-system-pr-123.vercel.app
```

---

## 3. Vercel 프론트엔드 배포

### 3.1. Vercel Dashboard로 배포 (가장 쉬운 방법)

1. [Vercel](https://vercel.com) 가입/로그인
2. **New Project** 클릭
3. GitHub 저장소 연결
4. **Root Directory:** `apps/frontend` 입력
5. **Environment Variables** 추가:
   ```
   NEXT_PUBLIC_API_URL=https://api.yourdomain.com
   ```
6. **Deploy** 클릭

✅ 배포 완료! URL이 생성됨: `https://election-system.vercel.app`

### 3.2. Vercel CLI로 배포

```bash
# 1. Vercel CLI 설치
npm install -g vercel

# 2. 프론트엔드 디렉토리로 이동
cd apps/frontend

# 3. Vercel 로그인
vercel login

# 4. 프로젝트 링크 (최초 1회)
vercel link

# 5. 배포
vercel --prod

# 6. 배포 완료!
# URL: https://your-project.vercel.app
```

### 3.3. 커스텀 도메인 설정

1. Vercel Dashboard → 프로젝트 선택
2. **Settings** → **Domains**
3. 도메인 추가 (예: `election.yourdomain.com`)
4. DNS 레코드 추가 (Vercel이 안내)

```
# DNS 레코드 예시
Type: CNAME
Name: election
Value: cname.vercel-dns.com
```

---

## 4. Docker로 로컬 실행

### 4.1. 환경 변수 설정

```bash
# 1. 환경 변수 파일 복사
cp .env.docker.example .env

# 2. 비밀 키 생성
openssl rand -base64 64  # JWT_SECRET
openssl rand -base64 64  # BALLOT_SECRET_SALT

# 3. .env 파일 수정
nano .env

# 필수 수정 항목:
# - JWT_SECRET
# - BALLOT_SECRET_SALT
# - POSTGRES_PASSWORD
```

### 4.2. Docker Compose 실행

```bash
# 1. 전체 스택 실행 (PostgreSQL + Backend + Frontend)
docker-compose up -d

# 2. 로그 확인
docker-compose logs -f

# 3. 상태 확인
docker-compose ps

# 4. 접속
# 프론트엔드: http://localhost:3001
# 백엔드: http://localhost:3000/api/health

# 5. 중지
docker-compose down

# 6. 데이터까지 삭제 (주의!)
docker-compose down -v
```

### 4.3. 데이터베이스 초기화

```bash
# 1. 컨테이너 내부 접속
docker-compose exec backend sh

# 2. Prisma 마이그레이션
npx prisma migrate deploy

# 3. 테스트 계정 생성
docker-compose exec postgres psql -U postgres -d election_db -f /docker-entrypoint-initdb.d/create-test-accounts.sql

# 4. 확인
docker-compose exec postgres psql -U postgres -d election_db -c "SELECT email, name, role FROM users;"
```

---

## 5. 프로덕션 서버 배포

### 5.1. 서버 준비 (Ubuntu 22.04 기준)

```bash
# 1. 서버 접속
ssh root@your-server.com

# 2. 업데이트
apt update && apt upgrade -y

# 3. Node.js 18 설치
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs

# 4. PM2 설치
npm install -g pm2

# 5. PostgreSQL 설치
apt install -y postgresql postgresql-contrib

# 6. Nginx 설치
apt install -y nginx

# 7. 배포 사용자 생성
adduser deploy
usermod -aG sudo deploy
```

### 5.2. 백엔드 배포

```bash
# 1. 배포 디렉토리 생성
sudo mkdir -p /opt/election-backend
sudo chown deploy:deploy /opt/election-backend

# 2. 코드 클론
cd /opt/election-backend
git clone https://github.com/your-org/election-system.git .

# 3. 백엔드 디렉토리로 이동
cd apps/backend

# 4. 환경 변수 설정
nano .env.production
# .env.example을 참고하여 작성

# 5. 의존성 설치
npm ci --production

# 6. Prisma 설정
npx prisma generate
npx prisma migrate deploy

# 7. 빌드
npm run build

# 8. PM2로 실행
pm2 start ecosystem.config.js --env production

# 9. 부팅 시 자동 시작
pm2 startup systemd
pm2 save

# 10. 상태 확인
pm2 status
pm2 logs election-backend
```

### 5.3. Nginx 설정

```bash
# 1. Nginx 설정 파일 생성
sudo nano /etc/nginx/sites-available/election

# 2. 설정 내용 (아래 예시 참고)
```

```nginx
# /etc/nginx/sites-available/election

# HTTP → HTTPS 리다이렉트
server {
    listen 80;
    server_name api.yourdomain.com election.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

# 백엔드 API
server {
    listen 443 ssl http2;
    server_name api.yourdomain.com;

    # SSL 인증서 (Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/api.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.yourdomain.com/privkey.pem;

    # SSL 설정
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # API 프록시
    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 90s;
    }

    # 헬스 체크
    location /api/health {
        proxy_pass http://localhost:3000/api/health;
        access_log off;
    }
}
```

```bash
# 3. 설정 활성화
sudo ln -s /etc/nginx/sites-available/election /etc/nginx/sites-enabled/

# 4. 설정 테스트
sudo nginx -t

# 5. Nginx 재시작
sudo systemctl restart nginx

# 6. SSL 인증서 설치 (Let's Encrypt)
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d api.yourdomain.com

# 7. 자동 갱신 설정
sudo certbot renew --dry-run
```

### 5.4. 방화벽 설정

```bash
# UFW 활성화
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable

# 상태 확인
sudo ufw status
```

---

## 6. 모니터링 및 관리

### 6.1. PM2 모니터링

```bash
# 실시간 모니터링
pm2 monit

# 상태 확인
pm2 status

# 로그 확인
pm2 logs election-backend

# 재시작
pm2 restart election-backend

# 중지
pm2 stop election-backend

# 삭제
pm2 delete election-backend
```

### 6.2. Health Check 확인

```bash
# 백엔드 헬스 체크
curl https://api.yourdomain.com/api/health

# 상세 헬스 체크
curl https://api.yourdomain.com/api/health/detailed

# 프론트엔드 확인
curl https://election.yourdomain.com
```

### 6.3. 로그 확인

```bash
# 백엔드 로그
tail -f /opt/election-backend/apps/backend/logs/pm2-error.log
tail -f /opt/election-backend/apps/backend/logs/pm2-out.log

# Nginx 로그
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log

# 시스템 로그
journalctl -u nginx -f
journalctl -u postgresql -f
```

---

## 7. 트러블슈팅

### 문제 1: GitHub Actions 배포 실패

**증상:** Actions에서 "Host key verification failed" 에러

**해결:**
```bash
# 1. 서버에서 known_hosts 추가
ssh-keyscan -H your-server.com >> ~/.ssh/known_hosts

# 2. 또는 GitHub Actions에 StrictHostKeyChecking 비활성화
# .github/workflows/backend-ci.yml에 추가:
# script_stop: true
```

### 문제 2: Vercel 배포 시 환경 변수 오류

**증상:** API 호출 시 CORS 에러 또는 404

**해결:**
```bash
# Vercel Dashboard에서 Environment Variables 확인
# NEXT_PUBLIC_API_URL이 올바른지 확인

# 로컬 테스트
NEXT_PUBLIC_API_URL=https://api.yourdomain.com npm run build
npm start
```

### 문제 3: Docker 컨테이너 DB 연결 실패

**증상:** Backend 컨테이너가 계속 재시작됨

**해결:**
```bash
# 1. PostgreSQL 로그 확인
docker-compose logs postgres

# 2. DATABASE_URL 확인 (.env 파일)
# 올바른 형식: postgresql://user:password@postgres:5432/db_name

# 3. 컨테이너 재시작
docker-compose restart backend
```

### 문제 4: PM2 프로세스 자동 시작 안 됨

**증상:** 서버 재부팅 후 애플리케이션 실행 안 됨

**해결:**
```bash
# PM2 startup 재설정
pm2 unstartup systemd
pm2 startup systemd
pm2 save
```

### 문제 5: Nginx 502 Bad Gateway

**증상:** Nginx에서 502 에러 발생

**해결:**
```bash
# 1. 백엔드 실행 확인
pm2 status

# 2. 백엔드 포트 확인
netstat -tuln | grep 3000

# 3. Nginx 설정 확인
sudo nginx -t

# 4. 방화벽 확인
sudo ufw status
```

---

## 📱 웹에서 확인하기

### 프론트엔드 접속
- **Vercel 배포:** https://election-system.vercel.app
- **커스텀 도메인:** https://election.yourdomain.com

### 백엔드 API 확인
- **Health Check:** https://api.yourdomain.com/api/health
- **API Docs:** https://api.yourdomain.com/api/docs (Swagger)

### 테스트 계정으로 로그인
```
관리자: admin@test.com
감사: auditor@test.com
회원: hong.gildong@test.com
```

OTP 코드는 백엔드 로그 또는 이메일에서 확인

---

## 🎉 완료!

이제 선거 시스템이 자동으로 배포되고 웹에서 확인할 수 있습니다!

### 다음 단계
- [ ] 실제 도메인 구매 및 연결
- [ ] SSL 인증서 설정
- [ ] 이메일 서비스 연동 (SendGrid/AWS SES)
- [ ] 모니터링 도구 설치 (DataDog/Sentry)
- [ ] 백업 자동화 설정

### 문의 및 지원
- GitHub Issues: https://github.com/your-org/election-system/issues
- 문서: https://docs.yourdomain.com
