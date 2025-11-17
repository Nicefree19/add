#!/bin/bash

# ========================================
# 선거 시스템 자동 배포 스크립트
# ========================================

set -e  # 에러 발생 시 중단

echo "========================================="
echo "  선거 시스템 배포 시작"
echo "========================================="
echo ""

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ========================================
# 1. 환경 확인
# ========================================
echo -e "${BLUE}[1/6] 환경 확인...${NC}"

# Docker 확인
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker가 설치되어 있지 않습니다.${NC}"
    echo "설치 방법: https://docs.docker.com/get-docker/"
    exit 1
fi

# Docker Compose 확인
if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}❌ Docker Compose가 설치되어 있지 않습니다.${NC}"
    echo "설치 방법: https://docs.docker.com/compose/install/"
    exit 1
fi

echo -e "${GREEN}✅ Docker 및 Docker Compose 확인 완료${NC}"
echo ""

# ========================================
# 2. 환경 변수 설정
# ========================================
echo -e "${BLUE}[2/6] 환경 변수 설정...${NC}"

if [ ! -f .env ]; then
    echo "📝 .env 파일 생성 중..."
    cp .env.docker.example .env

    # JWT_SECRET 생성
    JWT_SECRET=$(openssl rand -base64 64 | tr -d '\n')
    sed -i "s|your-super-secret-jwt-key-change-this-in-production-min-64-characters|$JWT_SECRET|g" .env

    # BALLOT_SECRET_SALT 생성
    BALLOT_SECRET=$(openssl rand -base64 64 | tr -d '\n')
    sed -i "s|your-super-secret-ballot-salt-change-this-in-production-min-64-characters|$BALLOT_SECRET|g" .env

    # POSTGRES_PASSWORD 생성
    POSTGRES_PASSWORD=$(openssl rand -base64 32 | tr -d '\n')
    sed -i "s|change-this-strong-password|$POSTGRES_PASSWORD|g" .env

    echo -e "${GREEN}✅ .env 파일 생성 및 비밀 키 설정 완료${NC}"
else
    echo -e "${YELLOW}⚠️  .env 파일이 이미 존재합니다. 기존 파일을 사용합니다.${NC}"
fi

echo ""

# ========================================
# 3. Docker 이미지 빌드
# ========================================
echo -e "${BLUE}[3/6] Docker 이미지 빌드...${NC}"
echo "이 작업은 5-10분 정도 소요될 수 있습니다..."

docker-compose build --no-cache

echo -e "${GREEN}✅ Docker 이미지 빌드 완료${NC}"
echo ""

# ========================================
# 4. 컨테이너 시작
# ========================================
echo -e "${BLUE}[4/6] 컨테이너 시작...${NC}"

docker-compose up -d

echo -e "${GREEN}✅ 컨테이너 시작 완료${NC}"
echo ""

# ========================================
# 5. 데이터베이스 초기화 대기
# ========================================
echo -e "${BLUE}[5/6] 데이터베이스 초기화 대기...${NC}"

# PostgreSQL이 준비될 때까지 대기
echo "PostgreSQL이 준비될 때까지 대기 중..."
sleep 10

# 백엔드가 준비될 때까지 대기
echo "백엔드 서비스가 준비될 때까지 대기 중..."
max_attempts=30
attempt=0

while [ $attempt -lt $max_attempts ]; do
    if curl -s http://localhost:3000/api/health > /dev/null 2>&1; then
        echo -e "${GREEN}✅ 백엔드 서비스 준비 완료${NC}"
        break
    fi
    attempt=$((attempt + 1))
    echo "대기 중... ($attempt/$max_attempts)"
    sleep 2
done

if [ $attempt -eq $max_attempts ]; then
    echo -e "${RED}❌ 백엔드 서비스 시작 실패${NC}"
    echo "로그 확인: docker-compose logs backend"
    exit 1
fi

echo ""

# ========================================
# 6. 테스트 계정 생성
# ========================================
echo -e "${BLUE}[6/6] 테스트 계정 생성...${NC}"

# PostgreSQL 컨테이너 내에서 SQL 실행
docker-compose exec -T postgres psql -U postgres -d election_db < apps/backend/scripts/create-test-accounts.sql > /dev/null 2>&1 || {
    echo -e "${YELLOW}⚠️  테스트 계정 생성 중 일부 경고가 있었습니다 (이미 존재하는 경우 정상)${NC}"
}

echo -e "${GREEN}✅ 테스트 계정 생성 완료${NC}"
echo ""

# ========================================
# 배포 완료
# ========================================
echo ""
echo "========================================="
echo -e "${GREEN}  🎉 배포 완료!${NC}"
echo "========================================="
echo ""
echo -e "${BLUE}📱 웹 브라우저에서 접속:${NC}"
echo ""
echo "  프론트엔드:  ${GREEN}http://localhost:3001${NC}"
echo "  백엔드 API:  ${GREEN}http://localhost:3000${NC}"
echo "  Health Check: ${GREEN}http://localhost:3000/api/health${NC}"
echo ""
echo -e "${BLUE}🔑 테스트 계정:${NC}"
echo ""
echo "  관리자:   ${YELLOW}admin@test.com${NC}"
echo "  감사:     ${YELLOW}auditor@test.com${NC}"
echo "  회원:     ${YELLOW}hong.gildong@test.com${NC}"
echo ""
echo -e "${YELLOW}💡 OTP 코드는 백엔드 로그에서 확인하세요:${NC}"
echo "  docker-compose logs -f backend | grep 'OTP generated'"
echo ""
echo -e "${BLUE}📊 유용한 명령어:${NC}"
echo ""
echo "  상태 확인:    ${GREEN}docker-compose ps${NC}"
echo "  로그 확인:    ${GREEN}docker-compose logs -f${NC}"
echo "  중지:        ${GREEN}docker-compose down${NC}"
echo "  재시작:      ${GREEN}docker-compose restart${NC}"
echo ""
echo "========================================="
