# 🚀 Claude Code 빠른 시작 가이드

## 📁 준비된 파일들

1. **CLAUDE.MD** - 전체 프로젝트 맥락과 요구사항
2. **dashboard_data.json** - 웹 대시보드에 사용할 모든 데이터
3. **사우회_회비_결산_보고서_최종.xlsx** - 원본 엑셀 보고서

---

## 💬 Claude Code에게 전달할 프롬프트

```
안녕하세요! 사우회 회비 인터랙티브 웹 대시보드를 만들고 싶습니다.

첨부된 CLAUDE.MD 파일에 모든 맥락과 요구사항이 정리되어 있습니다.
dashboard_data.json 파일에는 사용할 모든 데이터가 준비되어 있습니다.

다음과 같은 웹 대시보드를 만들어주세요:

1. **메인 페이지 (index.html)**
   - 현재 잔액 요약 카드 (카카오뱅크, 세이프박스, 총액)
   - 주요 통계 카드 (총 입금, 총 출금, 이자 수익, 거래 건수)
   - 차트: 연도별 수입/지출, 월별 추이, 수입/지출 비율
   - 거래 내역 테이블 (검색, 필터, 정렬, 페이지네이션)

2. **기술 스택**
   - HTML5, CSS3 (Tailwind CSS 권장)
   - JavaScript (Vanilla 또는 React)
   - Chart.js 또는 Recharts
   - 반응형 디자인 (모바일 대응)

3. **디자인**
   - 깔끔하고 전문적인 느낌
   - 파란색 계열 (#0070C0) 메인 색상
   - 입금은 녹색, 출금은 빨간색으로 구분
   - 카드 형태의 모던한 UI

4. **기능**
   - 실시간 검색/필터
   - 은행별 필터 (신한은행/카카오뱅크)
   - 세이프박스 거래 포함/제외 토글
   - 금액에 쉼표 표시 (예: 16,494,022원)
   - 날짜 포맷 보기 좋게 (예: 2025년 11월 11일)

데이터는 dashboard_data.json을 fetch로 불러와서 사용하면 됩니다.
단일 HTML 파일로 만들어주시거나, 여러 파일로 구조화해주셔도 좋습니다.

시작해주세요!
```

---

## 🎯 예상 결과물

Claude Code가 만들어줄 파일들:

```
dashboard/
├── index.html          # 메인 대시보드
├── styles.css          # 스타일시트 (또는 Tailwind CDN 사용)
├── script.js           # JavaScript 로직
├── dashboard_data.json # 데이터 파일
└── README.md           # 사용 설명서
```

---

## 📊 dashboard_data.json 구조

```json
{
  "summary": {
    "kakao_balance": 399204,
    "safebox_balance": 16094818,
    "total_balance": 16494022,
    "total_income": 170532068,
    "total_expense": 147959760,
    "total_transactions": 1217
  },
  "transactions": [
    {
      "date": "2025-11-11 11:07:25",
      "type": "출금",
      "amount": 50000,
      "description": "간편이체(김지혜)",
      "bank": "카카오뱅크",
      "category": "regular"
    }
  ],
  "safebox_transactions": [...],
  "yearly_stats": [...],
  "monthly_stats": [...]
}
```

---

## 🔧 로컬 테스트 방법

### 방법 1: Python 서버
```bash
cd dashboard
python -m http.server 8000
# 브라우저에서 http://localhost:8000 접속
```

### 방법 2: VS Code Live Server
1. VS Code에서 index.html 열기
2. 우클릭 → "Open with Live Server"

### 방법 3: 직접 열기
- index.html을 더블클릭하여 브라우저에서 열기
- (CORS 이슈가 있을 수 있으니 위 방법 권장)

---

## 🌐 배포 방법

### GitHub Pages
```bash
# GitHub 저장소 생성 후
git add .
git commit -m "Add dashboard"
git push origin main

# Settings → Pages → Source: main branch
# 몇 분 후 https://username.github.io/repo-name 에서 접속 가능
```

### 사내 서버
- 웹 서버 (Apache, Nginx 등)에 파일 업로드
- 또는 사내 네트워크 공유 폴더에 배치

---

## ✅ 체크리스트

배포 전 확인사항:
- [ ] 모든 금액에 쉼표 표시 확인
- [ ] 모바일에서 정상 작동 확인
- [ ] 검색/필터 기능 테스트
- [ ] 차트가 올바르게 표시되는지 확인
- [ ] 개인정보가 있다면 마스킹 처리
- [ ] 크로스 브라우저 테스트 (Chrome, Safari, Firefox)

---

## 💡 추가 개선 아이디어

나중에 추가할 수 있는 기능들:
1. **엑셀 다운로드** - 필터된 데이터를 엑셀로 내보내기
2. **PDF 다운로드** - 보고서를 PDF로 저장
3. **댓글 기능** - 특정 거래에 설명 추가
4. **알림 설정** - 일정 금액 이상 거래 시 알림
5. **비교 분석** - 전년 대비, 전월 대비 비교
6. **예산 관리** - 월별/분기별 예산 설정 및 추적

---

## 🆘 문제 해결

### CORS 에러 발생 시
→ Python 서버나 Live Server 사용

### 차트가 안 보일 때
→ Chart.js CDN이 제대로 로드되었는지 확인

### 데이터가 안 보일 때
→ 브라우저 개발자 도구(F12) → Console에서 에러 확인

### 모바일에서 레이아웃 깨짐
→ 반응형 CSS 확인 (media queries)

---

**행운을 빕니다! 🎉**
