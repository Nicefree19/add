# GitHub Pages 설정 가이드

GitHub Pages를 통해 이 대시보드를 웹사이트로 호스팅하는 방법입니다.

## 📋 설정 단계

### 방법 1: Pull Request를 통한 Main 브랜치 머지 (권장)

1. **Pull Request 생성**
   - GitHub 저장소 페이지로 이동: https://github.com/Nicefree19/add
   - "Pull requests" 탭 클릭
   - "New pull request" 버튼 클릭
   - Base: `main` ← Compare: `claude/dashboard-excel-integration-011CV3f2JJS8dbvTkaRyK6Ti` 선택
   - "Create pull request" 클릭

2. **Pull Request 머지**
   - PR 페이지에서 "Merge pull request" 버튼 클릭
   - "Confirm merge" 클릭

3. **GitHub Pages 활성화**
   - 저장소 설정으로 이동: Settings > Pages
   - Source: `Deploy from a branch` 선택
   - Branch: `main` / `/ (root)` 선택
   - "Save" 클릭

4. **완료!**
   - 몇 분 후 다음 URL에서 접속 가능:
   - `https://nicefree19.github.io/add/`
   - 또는 `https://nicefree19.github.io/add/index.html`

### 방법 2: 현재 브랜치에서 직접 배포

GitHub Pages는 특정 브랜치만 지원하므로, 다음 중 하나를 선택:

#### A. Main 브랜치 직접 업데이트 (로컬에서)

```bash
# main 브랜치로 전환
git checkout main

# 현재 작업 내용 머지
git merge claude/dashboard-excel-integration-011CV3f2JJS8dbvTkaRyK6Ti

# 수동으로 GitHub에서 업데이트
# (Git push가 제한되어 있으므로 GitHub UI 사용)
```

#### B. GitHub UI에서 파일 직접 업로드

1. GitHub 저장소의 `main` 브랜치로 이동
2. "Add file" > "Upload files" 클릭
3. 다음 파일들을 드래그하여 업로드:
   - `index.html` (필수)
   - `members.html` (필수)
   - `expenses.html` (필수)
   - `safebox.html` (필수)
   - `excel_loader.html` (필수)
   - `dashboard_data.json` (필수)
   - `enhanced_dashboard_data.json` (선택, 507KB)
   - 기타 엑셀 파일들 (선택)

## 🎯 페이지 구성

설정 완료 후 다음 페이지들에 접근 가능:

### 메인 페이지들
- **메인 대시보드**: `https://nicefree19.github.io/add/` 또는 `/index.html`
- **회원 관리**: `https://nicefree19.github.io/add/members.html`
- **지출 분석**: `https://nicefree19.github.io/add/expenses.html`
- **세이프박스**: `https://nicefree19.github.io/add/safebox.html`
- **데이터 업로드**: `https://nicefree19.github.io/add/excel_loader.html`

## ⚙️ 주의사항

### 1. 대용량 파일
`enhanced_dashboard_data.json` (507KB) 파일이 크므로 다음 옵션 고려:

**옵션 A: Git LFS 사용**
```bash
git lfs install
git lfs track "*.json"
git add .gitattributes
git add enhanced_dashboard_data.json
git commit -m "Use Git LFS for large JSON files"
```

**옵션 B: 파일 제외하고 동적 생성**
```bash
# .gitignore에 추가
echo "enhanced_dashboard_data.json" >> .gitignore

# 사용자가 방문 시 Python 스크립트 실행하도록 안내
```

**옵션 C: 파일 분할**
- JSON 파일을 여러 작은 파일로 분할
- 필요에 따라 동적으로 로드

### 2. CORS 이슈
GitHub Pages는 정적 호스팅이므로 다음 제한 사항:
- Python 스크립트 실행 불가 (서버 측 코드 미지원)
- 엑셀 파일 업로드는 브라우저에서만 작동 (`excel_loader.html` 사용)
- `enhanced_data_processor.py`는 로컬에서만 실행 가능

### 3. 데이터 업데이트 방법
GitHub Pages에서는 서버 측 스크립트를 실행할 수 없으므로:

**방법 1: 로컬에서 생성 후 업로드**
```bash
# 로컬에서 실행
python3 enhanced_data_processor.py

# 생성된 JSON 파일을 GitHub에 커밋
git add enhanced_dashboard_data.json
git commit -m "Update dashboard data"
git push
```

**방법 2: 브라우저에서 엑셀 업로드**
- `excel_loader.html` 페이지에서 엑셀 파일 업로드
- 브라우저의 localStorage에 저장
- 페이지 새로고침 시 유지

## 📱 모바일 지원

이 대시보드는 반응형 디자인으로 제작되어 모바일에서도 잘 작동합니다.

## 🔧 문제 해결

### GitHub Pages가 표시되지 않을 때
1. 저장소가 Public인지 확인 (Private 저장소는 유료 플랜 필요)
2. Settings > Pages에서 Source가 올바르게 설정되었는지 확인
3. 배포 상태 확인: Actions 탭에서 "pages build and deployment" 확인
4. 5-10분 정도 대기 (첫 배포는 시간이 걸릴 수 있음)

### 404 에러 발생 시
- URL이 정확한지 확인: `https://nicefree19.github.io/add/index.html`
- 브랜치에 `index.html` 파일이 있는지 확인
- 대소문자 확인 (GitHub Pages는 대소문자 구분)

### 데이터가 표시되지 않을 때
- 브라우저 콘솔(F12) 확인
- `dashboard_data.json` 또는 `enhanced_dashboard_data.json` 파일 확인
- localStorage 확인 (개발자 도구 > Application > Local Storage)

## 🚀 빠른 시작

가장 빠른 방법:

1. GitHub 저장소 > Settings > Pages
2. Source: `main` 브랜치 선택
3. Save 클릭
4. 배포 완료 대기 (약 1-5분)
5. 제공된 URL로 접속

## 📞 추가 지원

더 자세한 정보:
- [GitHub Pages 공식 문서](https://docs.github.com/en/pages)
- [GitHub Pages 문제 해결](https://docs.github.com/en/pages/getting-started-with-github-pages/troubleshooting-404-errors-for-github-pages-sites)
