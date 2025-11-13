# 사우회 회비 관리 대시보드

엑셀 파일을 기반으로 한 인터랙티브 재무 관리 및 회비 추적 시스템입니다.

## 주요 기능

### 💼 재무 관리
- 📊 **실시간 재무 현황**: 총 입금, 출금, 잔액을 한눈에 확인
- 📈 **차트 분석**: 연도별, 월별 수입/지출 추이 시각화
- 🔍 **거래 내역 검색**: 날짜, 카테고리, 금액별 필터링 및 정렬
- 💾 **엑셀 연동**: 엑셀 파일을 업로드하여 자동으로 데이터 생성
- 🔒 **세이프박스 관리**: 안전 자산 별도 추적

### 👥 회원 관리 (NEW!)
- **개인별 회비 추적**: 각 회원의 납부 이력 및 총액 관리
- **회원 활동 분석**: 활동 회원 vs 비활동 회원 구분
- **납부 통계**: 회원별 평균 납부액, 최근 납부일 추적
- **시각화**: 회원별 납부액 및 건수 차트

### 💸 지출 분석 (NEW!)
- **카테고리별 분류**: 자동 지출 카테고리 분류 (송금, ATM, 카드 등)
- **지출 추이 분석**: 월별 카테고리별 지출 변화 추적
- **상세 내역**: 각 카테고리별 거래 내역 및 통계
- **시각화**: 파이 차트, 막대 차트, 추이 그래프

## 사용 방법

### 1. 브라우저에서 열기

프로젝트를 다운로드한 후, 다음 파일 중 하나를 브라우저에서 엽니다:

#### 📄 페이지 구성
- `index.html` - **메인 대시보드**: 전체 재무 현황 및 거래 내역
- `members.html` - **회원 관리**: 회원별 회비 납부 현황 및 통계
- `expenses.html` - **지출 분석**: 카테고리별 지출 상세 분석
- `safebox.html` - **세이프박스**: 안전 자산 운용 내역
- `excel_loader.html` - **데이터 업로드**: 엑셀 파일 업로드 및 데이터 생성

### 2. 엑셀 파일 업로드

1. `excel_loader.html` 파일을 브라우저에서 엽니다
2. "사우회_회비_결산_보고서_최종.xlsx" 파일을 드래그하거나 선택합니다
3. 자동으로 데이터가 처리되고 통계가 표시됩니다
4. "대시보드로 이동" 버튼을 클릭하여 메인 대시보드로 이동합니다

### 3. Python 스크립트 사용 (선택사항)

명령줄에서 엑셀 파일을 JSON으로 변환하려면:

#### 기본 데이터 생성
```bash
python3 convert_excel_to_json.py
```
→ `dashboard_data.json` 파일 생성 (기본 거래 데이터)

#### 향상된 데이터 생성 (권장)
```bash
python3 enhanced_data_processor.py
```
→ `enhanced_dashboard_data.json` 파일 생성 (회원 분석, 지출 카테고리, 월별 추이 포함)

**주의**: 향상된 데이터를 생성하면 회원 관리 및 지출 분석 페이지를 사용할 수 있습니다.

## 파일 구조

```
.
├── index.html                                    # 메인 대시보드
├── members.html                                  # 회원 관리 페이지 (NEW)
├── expenses.html                                 # 지출 분석 페이지 (NEW)
├── safebox.html                                  # 세이프박스 상세 페이지
├── excel_loader.html                             # 엑셀 업로드 페이지
├── dashboard_data.json                           # 기본 대시보드 데이터 (자동 생성)
├── enhanced_dashboard_data.json                  # 향상된 데이터 (자동 생성, NEW)
├── convert_excel_to_json.py                      # 기본 데이터 변환 스크립트
├── enhanced_data_processor.py                    # 향상된 데이터 처리 스크립트 (NEW)
├── excel_to_dashboard.py                         # 엑셀 분석 스크립트
├── 사우회_회비_결산_보고서_최종.xlsx              # 원본 엑셀 데이터
├── 251111_사우회회비 통장 거래 내역(카카오뱅크계좌).xlsx
└── 신한은행_거래내역조회_20251111111910.xls
```

## 엑셀 파일 형식

대시보드는 다음 형식의 엑셀 파일을 지원합니다:

### 전체 거래 내역 시트
| 거래일시 | 구분 | 거래금액 | 내용 | 은행 | 년도 |
|---------|------|---------|------|------|------|
| 2021-01-01 13:23:05 | 입금 | 200000 | 회비 | 카카오뱅크 | 2021 |
| 2021-01-15 09:45:20 | 출금 | 50000 | ATM출금 | 카카오뱅크 | 2021 |

### 세이프박스 거래내역 시트
| 거래일시 | 구분 | 거래금액 | 내용 |
|---------|------|---------|------|
| 2021-04-20 11:02:19 | 출금 | -5000000 | 세이프박스 |
| 2021-04-20 21:50:02 | 입금 | 3000000 | 세이프박스 |

## 기술 스택

- **Frontend**: HTML5, CSS3 (Tailwind CSS), JavaScript (Vanilla)
- **차트**: Chart.js
- **엑셀 처리**: SheetJS (xlsx.js)
- **Backend (선택)**: Python 3 + pandas + openpyxl

## 브라우저 호환성

- Chrome (권장)
- Firefox
- Safari
- Edge

## 🌐 GitHub Pages로 배포하기

이 대시보드를 GitHub Pages로 호스팅하여 온라인에서 바로 사용할 수 있습니다.

### 빠른 설정 (3단계)

1. **GitHub 저장소 Settings로 이동**
   - `https://github.com/Nicefree19/add/settings/pages`

2. **GitHub Pages 활성화**
   - Source: "Deploy from a branch" 선택
   - Branch: `main` 브랜치, `/ (root)` 폴더 선택
   - "Save" 클릭

3. **접속**
   - 배포 완료 후 (약 1-5분) 다음 URL에서 접속:
   - **`https://nicefree19.github.io/add/`**

### 상세 가이드

자세한 설정 방법은 [GITHUB_PAGES_SETUP.md](GITHUB_PAGES_SETUP.md) 문서를 참고하세요.

### 배포 후 URL 구조

- 메인 대시보드: `https://nicefree19.github.io/add/`
- 회원 관리: `https://nicefree19.github.io/add/members.html`
- 지출 분석: `https://nicefree19.github.io/add/expenses.html`
- 세이프박스: `https://nicefree19.github.io/add/safebox.html`
- 데이터 업로드: `https://nicefree19.github.io/add/excel_loader.html`

## 라이선스

MIT License

## 문의

프로젝트 관련 문의사항은 이슈를 등록해주세요.
