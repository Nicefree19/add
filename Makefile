.PHONY: help install dev build test docker-up docker-down deploy-backend deploy-frontend logs clean

# 기본 명령어 (help를 표시)
.DEFAULT_GOAL := help

# ========================================
# 도움말
# ========================================
help: ## 사용 가능한 명령어 표시
	@echo "========================================="
	@echo "  선거 시스템 관리 명령어"
	@echo "========================================="
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | \
		awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

# ========================================
# 개발 환경 설정
# ========================================
install: ## 의존성 설치 (백엔드 + 프론트엔드)
	@echo "📦 백엔드 의존성 설치..."
	cd apps/backend && npm ci
	@echo "📦 프론트엔드 의존성 설치..."
	cd apps/frontend && npm ci
	@echo "✅ 의존성 설치 완료!"

install-backend: ## 백엔드 의존성만 설치
	@echo "📦 백엔드 의존성 설치..."
	cd apps/backend && npm ci

install-frontend: ## 프론트엔드 의존성만 설치
	@echo "📦 프론트엔드 의존성 설치..."
	cd apps/frontend && npm ci

# ========================================
# 개발 서버 실행
# ========================================
dev: ## 개발 서버 실행 (백엔드 + 프론트엔드 동시)
	@echo "🚀 개발 서버 시작..."
	@trap 'kill 0' EXIT; \
	(cd apps/backend && npm run start:dev) & \
	(cd apps/frontend && npm run dev) & \
	wait

dev-backend: ## 백엔드 개발 서버만 실행
	@echo "🚀 백엔드 개발 서버 시작..."
	cd apps/backend && npm run start:dev

dev-frontend: ## 프론트엔드 개발 서버만 실행
	@echo "🚀 프론트엔드 개발 서버 시작..."
	cd apps/frontend && npm run dev

# ========================================
# 빌드
# ========================================
build: ## 전체 빌드 (백엔드 + 프론트엔드)
	@echo "🔨 백엔드 빌드..."
	cd apps/backend && npm run build
	@echo "🔨 프론트엔드 빌드..."
	cd apps/frontend && npm run build
	@echo "✅ 빌드 완료!"

build-backend: ## 백엔드 빌드
	@echo "🔨 백엔드 빌드..."
	cd apps/backend && npm run build

build-frontend: ## 프론트엔드 빌드
	@echo "🔨 프론트엔드 빌드..."
	cd apps/frontend && npm run build

# ========================================
# 테스트
# ========================================
test: ## 테스트 실행 (백엔드)
	@echo "🧪 백엔드 테스트 실행..."
	cd apps/backend && npm test

test-watch: ## 테스트 watch 모드
	@echo "🧪 백엔드 테스트 watch 모드..."
	cd apps/backend && npm run test:watch

test-coverage: ## 테스트 커버리지
	@echo "📊 백엔드 테스트 커버리지..."
	cd apps/backend && npm run test:cov

# ========================================
# 데이터베이스
# ========================================
db-migrate: ## Prisma 마이그레이션 실행
	@echo "🗄️  Prisma 마이그레이션 실행..."
	cd apps/backend && npx prisma migrate deploy

db-generate: ## Prisma Client 생성
	@echo "⚙️  Prisma Client 생성..."
	cd apps/backend && npx prisma generate

db-studio: ## Prisma Studio 실행
	@echo "🎨 Prisma Studio 실행..."
	cd apps/backend && npx prisma studio

db-seed: ## 초기 데이터 Seed (계좌 + 임기)
	@echo "🌱 초기 데이터 Seed..."
	cd apps/backend && npm run prisma:seed

db-seed-finance: ## 거래내역 마이그레이션 (1,320건)
	@echo "💰 거래내역 마이그레이션..."
	cd apps/backend && npm run prisma:migrate-finance

db-reset: ## 데이터베이스 리셋 (주의!)
	@echo "⚠️  데이터베이스를 초기화합니다!"
	@read -p "계속하시겠습니까? [y/N] " confirm && [ $$confirm = y ] || exit 1
	cd apps/backend && npx prisma migrate reset --force

# ========================================
# Docker
# ========================================
docker-up: ## Docker Compose 실행
	@echo "🐳 Docker Compose 실행..."
	docker-compose up -d
	@echo "✅ 컨테이너 실행 완료!"
	@echo "프론트엔드: http://localhost:3001"
	@echo "백엔드: http://localhost:3000"

docker-down: ## Docker Compose 중지
	@echo "🛑 Docker Compose 중지..."
	docker-compose down

docker-logs: ## Docker 로그 확인
	docker-compose logs -f

docker-ps: ## Docker 상태 확인
	docker-compose ps

docker-clean: ## Docker 데이터 삭제 (주의!)
	@echo "⚠️  모든 Docker 데이터를 삭제합니다!"
	@read -p "계속하시겠습니까? [y/N] " confirm && [ $$confirm = y ] || exit 1
	docker-compose down -v
	docker system prune -f

# ========================================
# 배포
# ========================================
deploy-backend: ## 백엔드 배포 (PM2)
	@echo "🚀 백엔드 배포..."
	cd apps/backend && \
	npm ci --production && \
	npx prisma generate && \
	npx prisma migrate deploy && \
	npm run build && \
	pm2 restart ecosystem.config.js --env production

deploy-frontend: ## 프론트엔드 배포 (Vercel)
	@echo "🚀 프론트엔드 배포..."
	cd apps/frontend && vercel --prod

# ========================================
# 로그 & 모니터링
# ========================================
logs-backend: ## 백엔드 로그 확인 (PM2)
	pm2 logs election-backend

logs-frontend: ## 프론트엔드 로그 확인 (Vercel)
	cd apps/frontend && vercel logs

logs-nginx: ## Nginx 로그 확인
	tail -f /var/log/nginx/access.log /var/log/nginx/error.log

# ========================================
# 유틸리티
# ========================================
lint: ## 린트 실행
	@echo "🔍 린트 실행..."
	cd apps/backend && npm run lint || echo "Backend lint 실패"
	cd apps/frontend && npm run lint || echo "Frontend lint 실패"

format: ## 코드 포맷팅
	@echo "✨ 코드 포맷팅..."
	cd apps/backend && npm run format || echo "Backend format 스크립트 없음"
	cd apps/frontend && npm run format || echo "Frontend format 스크립트 없음"

clean: ## 빌드 파일 및 node_modules 삭제
	@echo "🧹 클린업..."
	rm -rf apps/backend/dist
	rm -rf apps/backend/node_modules
	rm -rf apps/frontend/.next
	rm -rf apps/frontend/node_modules
	@echo "✅ 클린업 완료!"

health-check: ## 헬스 체크
	@echo "🏥 헬스 체크..."
	@echo "백엔드:"
	@curl -s http://localhost:3000/api/health | jq . || echo "백엔드 실행 중 아님"
	@echo "\n프론트엔드:"
	@curl -s http://localhost:3001 > /dev/null && echo "✅ 프론트엔드 정상" || echo "❌ 프론트엔드 실행 중 아님"

# ========================================
# Git 관련
# ========================================
git-push: ## Git add, commit, push
	@read -p "커밋 메시지: " msg; \
	git add . && \
	git commit -m "$$msg" && \
	git push

git-status: ## Git 상태 확인
	@git status

# ========================================
# 전체 작업
# ========================================
setup: install db-generate db-migrate ## 초기 설정 (install + db setup)
	@echo "✅ 초기 설정 완료!"
	@echo "개발 서버 시작: make dev"

start: dev ## 개발 서버 시작 (dev의 별칭)

stop: ## PM2 프로세스 중지
	pm2 stop election-backend || echo "PM2 프로세스 없음"
