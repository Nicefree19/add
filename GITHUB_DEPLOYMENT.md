# 🚀 GitHub 배포 가이드

> GitHub에서 직접 웹 배포하는 3가지 방법

---

## 방법 1: GitHub Actions 자동 배포 ⚡ (이미 설정됨!)

### ✅ 현재 상태
GitHub Actions CI/CD가 **이미 설정**되어 있습니다!
- `.github/workflows/backend-ci.yml` ✓
- `.github/workflows/frontend-ci.yml` ✓
- `.github/workflows/github-pages.yml` ✓

### 🎯 자동 배포 실행하기

#### Option A: main 브랜치로 머지 (프로덕션 배포)

```bash
# 1. main 브랜치 생성
git checkout -b main

# 2. 푸시
git push -u origin main

# 3. GitHub Actions 자동 실행!
# - 테스트 ✓
# - 빌드 ✓
# - 보안 스캔 ✓
# - Vercel 배포 ✓ (프론트엔드)
# - 서버 배포 ✓ (백엔드, SSH 설정 시)
```

**GitHub에서 확인:**
- https://github.com/Nicefree19/add/actions
- 실시간으로 배포 진행 상황 확인 가능

#### Option B: Pull Request로 Preview 배포

```bash
# 1. 현재 브랜치에서 PR 생성
# GitHub 웹에서:
# - "Pull requests" → "New pull request"
# - Base: main (없으면 생성)
# - Compare: claude/code-review-refactoring-01Gx78mCtCGKLQvpPVohrSDQ

# 2. PR 생성하면 자동으로:
# - Vercel Preview URL 생성
# - Lighthouse 성능 테스트
# - PR 댓글에 결과 표시
```

**Preview URL 예시:**
- `https://election-system-pr-123.vercel.app`

---

## 방법 2: GitHub Pages 무료 호스팅 🌐

### 프론트엔드를 무료로 호스팅!

**URL:** `https://nicefree19.github.io/add/`

### 설정 방법 (3단계)

#### 1. GitHub Pages 활성화

GitHub 저장소 → **Settings** → **Pages**

```
Source: Deploy from a branch
Branch: main (또는 gh-pages)
Folder: / (root)
```

**Save** 클릭!

#### 2. 코드 푸시

```bash
# main 브랜치로 푸시
git checkout -b main
git push -u origin main

# 또는 현재 브랜치 푸시
git push origin claude/code-review-refactoring-01Gx78mCtCGKLQvpPVohrSDQ
```

#### 3. GitHub Actions 실행 확인

- https://github.com/Nicefree19/add/actions
- "Deploy to GitHub Pages" 워크플로우 확인
- 완료되면 URL 접속 가능!

### ✨ 배포 완료!

약 2-3분 후:
- **프론트엔드:** https://nicefree19.github.io/add/
- **자동 배포:** 코드 푸시 시 자동 업데이트

**⚠️ 주의:**
- GitHub Pages는 **프론트엔드만** 호스팅
- 백엔드는 별도 배포 필요 (Vercel, Docker 등)

---

## 방법 3: GitHub + Vercel 연동 🔗 (권장!)

### 가장 강력한 조합!

#### 설정 방법

1. **Vercel 대시보드** 접속
   - https://vercel.com/new

2. **GitHub 저장소 Import**
   - "Nicefree19/add" 선택
   - Root Directory: `apps/frontend`

3. **자동 연동 완료!**
   - GitHub에 푸시 → 자동 배포
   - PR 생성 → Preview URL 자동 생성
   - main 머지 → 프로덕션 배포

#### GitHub Secrets 설정 (자동 배포용)

GitHub 저장소 → **Settings** → **Secrets** → **Actions**

**New repository secret** 클릭:

| Secret 이름 | 값 | 획득 방법 |
|-------------|----|-----------|
| `VERCEL_TOKEN` | your-token | [Vercel Tokens](https://vercel.com/account/tokens) |
| `VERCEL_ORG_ID` | org-id | `vercel link` 후 `.vercel/project.json` |
| `VERCEL_PROJECT_ID` | project-id | `vercel link` 후 `.vercel/project.json` |

```bash
# Vercel CLI로 ID 확인
cd apps/frontend
npm install -g vercel
vercel login
vercel link

# .vercel/project.json 파일 확인
cat .vercel/project.json
```

---

## 📊 배포 방법 비교

| 방법 | 프론트엔드 | 백엔드 | 자동 배포 | 무료 | 권장 용도 |
|------|-----------|--------|----------|------|-----------|
| **GitHub Actions + Vercel** | ✅ | ✅* | ✅ | ✅ | 프로덕션 |
| **GitHub Pages** | ✅ | ❌ | ✅ | ✅ | 데모/포트폴리오 |
| **Pull Request Preview** | ✅ | ❌ | ✅ | ✅ | 리뷰/테스트 |

*백엔드는 별도 서버 필요

---

## 🎯 빠른 시작 (지금 바로!)

### 1분 안에 GitHub에서 배포:

```bash
# 1. main 브랜치 생성 및 푸시
git checkout -b main
git push -u origin main

# 2. GitHub에서 확인
# https://github.com/Nicefree19/add/actions

# 3. 완료!
# - GitHub Pages: https://nicefree19.github.io/add/
# - GitHub Actions 실행 중...
```

---

## 🔧 트러블슈팅

### GitHub Actions가 실행되지 않아요

**확인 사항:**
1. `.github/workflows/*.yml` 파일이 있는지 확인
2. main 브랜치에 푸시했는지 확인
3. GitHub Actions가 활성화되어 있는지 확인
   - Settings → Actions → General → Allow all actions

### GitHub Pages가 표시되지 않아요

**확인 사항:**
1. Settings → Pages에서 Source가 설정되어 있는지 확인
2. GitHub Actions 워크플로우가 성공했는지 확인
   - Actions 탭에서 "Deploy to GitHub Pages" 확인
3. 약 5분 대기 (첫 배포 시)

### Vercel 자동 배포가 안 돼요

**확인 사항:**
1. GitHub Secrets에 VERCEL_TOKEN 등이 설정되어 있는지 확인
2. Vercel에서 프로젝트가 생성되어 있는지 확인
3. frontend-ci.yml 워크플로우 로그 확인

---

## 📱 배포 결과 확인

### GitHub Pages
- **URL:** https://nicefree19.github.io/add/
- **업데이트:** 코드 푸시 시 자동 (2-3분)

### Vercel (GitHub 연동 시)
- **프로덕션:** https://election-system.vercel.app
- **Preview:** https://election-system-pr-N.vercel.app
- **업데이트:** 즉시 (푸시 시 자동)

### GitHub Actions
- **모니터링:** https://github.com/Nicefree19/add/actions
- **알림:** 실패 시 이메일 자동 발송

---

## 🎉 완료!

이제 GitHub에 코드만 푸시하면:
1. ✅ 자동 테스트
2. ✅ 자동 빌드
3. ✅ 자동 배포
4. ✅ 웹에서 즉시 확인

**다음 단계:**
- [ ] main 브랜치 푸시
- [ ] GitHub Actions 실행 확인
- [ ] 배포된 URL 접속
- [ ] 테스트 계정으로 로그인

**문의:**
- GitHub Issues: https://github.com/Nicefree19/add/issues
- Actions 로그: https://github.com/Nicefree19/add/actions
