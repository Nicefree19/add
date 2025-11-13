# 자동 배포 설정 가이드

Claude가 작업하면 자동으로 GitHub Pages에 반영되도록 설정하는 방법입니다.

## 방법 1: Claude 브랜치에서 직접 배포 (가장 간단) ⭐ 추천

### 1단계: GitHub Pages 소스 변경
1. https://github.com/Nicefree19/add/settings/pages 접속
2. "Source" 섹션에서:
   - Branch: `claude/dashboard-excel-integration-011CV3f2JJS8dbvTkaRyK6Ti` 선택
   - Folder: `/ (root)` 선택
3. **Save** 클릭

### 완료!
- 이제 Claude가 이 브랜치에 push하면 자동으로 배포됩니다
- 1-2분 후 https://nicefree19.github.io/add/ 에 반영
- PR이나 merge 작업 불필요

---

## 방법 2: GitHub Actions 워크플로우 사용 (권장)

### 1단계: PR 한 번만 Merge
1. https://github.com/Nicefree19/add/pulls 접속
2. "New pull request" 클릭
3. base: `main` ← compare: `claude/dashboard-excel-integration-011CV3f2JJS8dbvTkaRyK6Ti`
4. PR 생성 후 **Merge**

### 2단계: GitHub Pages 소스 확인
1. https://github.com/Nicefree19/add/settings/pages 접속
2. "Source" 섹션:
   - Source: `GitHub Actions` 선택
   - 또는 Branch: `gh-pages` / Folder: `/ (root)` 선택

### 완료!
- Claude가 `claude/**` 브랜치에 push → 자동으로 GitHub Pages 배포
- deploy.yml 워크플로우가 자동 실행
- Python 스크립트도 자동 실행되어 최신 데이터 생성

---

## 방법 3: 수동 배포 스크립트 (백업용)

권한 문제가 있을 경우, 로컬에서 실행:

```bash
./deploy.sh
```

단, gh-pages 브랜치 push 권한이 필요합니다.

---

## 🎯 추천 순서

1. **방법 1** 시도 (가장 빠르고 간단)
2. 방법 1이 안 되면 **방법 2** 사용 (한 번만 PR merge)
3. 둘 다 안 되면 방법 3으로 백업

---

## 현재 상태

✅ 신한은행 입금자명 추가 기능 완성
✅ 내부 이체 제외 기능 완성
✅ 자동 배포 스크립트 준비
⏳ GitHub Pages 설정 필요 (위 방법 중 하나 선택)

