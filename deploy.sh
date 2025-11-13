#!/bin/bash

# 자동 배포 스크립트
# Claude가 작업 완료 후 실행하면 GitHub Pages에 자동 배포됨

set -e  # 에러 발생 시 중단

echo "=========================================="
echo "GitHub Pages 자동 배포 시작"
echo "=========================================="

# 1. 현재 브랜치 저장
CURRENT_BRANCH=$(git branch --show-current)
echo "현재 브랜치: $CURRENT_BRANCH"

# 2. 데이터 재생성
echo ""
echo "Step 1: 데이터 파일 생성 중..."
python3 convert_excel_to_json.py
python3 enhanced_data_processor.py
echo "✓ 데이터 파일 생성 완료"

# 3. 현재 브랜치에 커밋 (데이터 파일 업데이트)
echo ""
echo "Step 2: 데이터 파일 커밋 중..."
git add dashboard_data.json enhanced_dashboard_data.json
if git diff --staged --quiet; then
    echo "변경사항 없음 - 커밋 건너뜀"
else
    git commit -m "Update dashboard data [auto-generated]" || true
    git push origin "$CURRENT_BRANCH" || true
    echo "✓ 현재 브랜치에 push 완료"
fi

# 4. gh-pages 브랜치로 배포
echo ""
echo "Step 3: GitHub Pages 배포 중..."

# 임시 디렉토리 생성
TEMP_DIR=$(mktemp -d)
echo "임시 디렉토리: $TEMP_DIR"

# 배포할 파일들 복사
cp -r *.html *.json "$TEMP_DIR/" 2>/dev/null || true
cp -r assets "$TEMP_DIR/" 2>/dev/null || true
cp -r images "$TEMP_DIR/" 2>/dev/null || true

# gh-pages 브랜치로 전환
git fetch origin gh-pages 2>/dev/null || true
git checkout gh-pages 2>/dev/null || git checkout --orphan gh-pages

# 원격 변경사항 pull (충돌 방지)
git pull origin gh-pages --rebase 2>/dev/null || true

# 기존 파일 정리 (Git 제외)
find . -maxdepth 1 -type f ! -name '.git*' ! -name '.nojekyll' -delete 2>/dev/null || true
rm -rf assets images 2>/dev/null || true

# 새 파일 복사
cp -r "$TEMP_DIR"/* . 2>/dev/null || true

# 불필요한 파일 제거
rm -f *.py *.xlsx *.xls *.sh *.md 2>/dev/null || true
rm -rf .github 2>/dev/null || true

# .nojekyll 파일 생성 (GitHub Pages Jekyll 비활성화)
touch .nojekyll

# 커밋 및 푸시
git add -A
if git diff --staged --quiet; then
    echo "배포할 변경사항 없음"
else
    git commit -m "Deploy to GitHub Pages - $(date '+%Y-%m-%d %H:%M:%S')"
    git push -f origin gh-pages
    echo "✓ gh-pages 브랜치에 배포 완료"
fi

# 원래 브랜치로 복귀
git checkout "$CURRENT_BRANCH"

# 임시 디렉토리 삭제
rm -rf "$TEMP_DIR"

echo ""
echo "=========================================="
echo "✓ 배포 완료!"
echo "=========================================="
echo ""
echo "배포된 URL: https://nicefree19.github.io/add/"
echo "1-2분 후 변경사항이 반영됩니다."
echo ""
