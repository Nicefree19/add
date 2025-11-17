#!/bin/bash

# ========================================
# 선거 시스템 로컬 배포 스크립트 (Docker 없이)
# ========================================

set -e

echo "========================================="
echo "  선거 시스템 로컬 배포"
echo "========================================="
echo ""

# 색상
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# ========================================
# 1. 의존성 확인
# ========================================
echo -e "${BLUE}[1/5] 환경 확인...${NC}"

# Node.js 확인
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js가 설치되어 있지 않습니다.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Node.js $(node --version)${NC}"

# npm 확인
if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm이 설치되어 있지 않습니다.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ npm $(npm --version)${NC}"
echo ""

# ========================================
# 2. 백엔드 환경 변수 설정
# ========================================
echo -e "${BLUE}[2/5] 백엔드 환경 변수 설정...${NC}"

cd apps/backend

if [ ! -f .env ]; then
    cp .env.example .env

    # Python으로 비밀 키 생성
    python3 << 'EOF' > /tmp/backend_secrets.env
import secrets
import base64

jwt_secret = base64.b64encode(secrets.token_bytes(64)).decode('utf-8')
ballot_secret = base64.b64encode(secrets.token_bytes(64)).decode('utf-8')

print(f"JWT_SECRET={jwt_secret}")
print(f"BALLOT_SECRET_SALT={ballot_secret}")
EOF

    # .env 파일에 비밀 키 추가
    cat /tmp/backend_secrets.env >> .env

    echo -e "${GREEN}✅ 백엔드 .env 파일 생성${NC}"
else
    echo -e "${YELLOW}⚠️  백엔드 .env 파일이 이미 존재합니다.${NC}"
fi

cd ../..
echo ""

# ========================================
# 3. 의존성 설치
# ========================================
echo -e "${BLUE}[3/5] 의존성 설치...${NC}"

echo "📦 백엔드 의존성 설치..."
cd apps/backend && npm ci --quiet
cd ../..

echo "📦 프론트엔드 의존성 설치..."
cd apps/frontend && npm ci --quiet
cd ../..

echo -e "${GREEN}✅ 의존성 설치 완료${NC}"
echo ""

# ========================================
# 4. 백엔드 빌드
# ========================================
echo -e "${BLUE}[4/5] 백엔드 빌드...${NC}"

cd apps/backend
npm run build
cd ../..

echo -e "${GREEN}✅ 백엔드 빌드 완료${NC}"
echo ""

# ========================================
# 5. 배포 안내
# ========================================
echo -e "${BLUE}[5/5] 배포 준비 완료${NC}"
echo ""

cat << 'INSTRUCTIONS'
========================================
  🎉 배포 준비 완료!
========================================

⚠️  주의: PostgreSQL 데이터베이스가 필요합니다.

📝 다음 단계를 실행하세요:

1. PostgreSQL 시작 (별도 터미널)
   - Docker: docker run -d -p 5432:5432 -e POSTGRES_PASSWORD=postgres postgres:15
   - 또는 로컬 PostgreSQL 서비스 시작

2. 데이터베이스 설정 (별도 터미널)
   cd apps/backend
   npx prisma migrate deploy
   psql -U postgres -d election_db -f scripts/create-test-accounts.sql

3. 백엔드 시작 (별도 터미널)
   cd apps/backend
   npm run start:prod

   또는 개발 모드:
   npm run start:dev

4. 프론트엔드 시작 (별도 터미널)
   cd apps/frontend
   npm run dev

5. 웹 브라우저에서 접속
   프론트엔드: http://localhost:3001
   백엔드: http://localhost:3000

📚 상세 가이드: DEPLOYMENT_GUIDE.md

💡 빠른 시작 (Makefile 사용):
   make setup    # 초기 설정
   make dev      # 개발 서버 시작

========================================
INSTRUCTIONS

echo ""
echo -e "${GREEN}✅ 모든 준비가 완료되었습니다!${NC}"
echo ""
