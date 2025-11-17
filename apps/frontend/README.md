# 사우회 선거 시스템 - Frontend

Next.js 기반의 사우회 선거 관리 시스템 프론트엔드입니다.

## 기술 스택

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **Form Validation**: React Hook Form + Zod
- **State Management**: Zustand + React Query
- **HTTP Client**: Axios

## 시작하기

### 환경 변수 설정

`.env.example` 파일을 `.env.local`로 복사하고 환경 변수를 설정하세요.

```bash
cp .env.example .env.local
```

### 의존성 설치

```bash
npm install
```

### 개발 서버 실행

```bash
npm run dev
```

브라우저에서 [http://localhost:3001](http://localhost:3001)을 열어 확인하세요.

### 빌드

```bash
npm run build
```

### 프로덕션 실행

```bash
npm start
```

## 주요 기능 (F1 단계)

### ✅ 구현 완료

- **인증 시스템**
  - 이메일 OTP 로그인
  - JWT 토큰 관리 (Access Token + Refresh Token)
  - 자동 토큰 갱신
  - 인증 상태 관리 (AuthProvider)

- **UI 컴포넌트**
  - shadcn/ui 기반 컴포넌트
  - 반응형 디자인
  - 로딩 상태 및 에러 처리

### 📋 예정 (F2+)

- 선거 목록 및 상세
- 후보 추천
- 투표
- 결과 조회
- 관리자 기능

## 프로젝트 구조

```
apps/frontend/
├── app/
│   ├── (auth)/           # 인증 관련 라우트
│   │   └── login/
│   ├── (main)/           # 메인 앱 라우트
│   ├── layout.tsx        # 루트 레이아웃
│   └── globals.css       # 글로벌 스타일
├── components/
│   ├── ui/               # shadcn/ui 컴포넌트
│   └── providers.tsx     # Provider 래퍼
├── lib/
│   ├── api/              # API 클라이언트
│   │   ├── client.ts     # Axios 인스턴스
│   │   └── auth.ts       # 인증 API
│   ├── auth/             # 인증 관련
│   │   ├── auth-context.tsx
│   │   └── token.ts      # 토큰 관리
│   ├── validations/      # Zod 스키마
│   └── utils.ts          # 유틸리티
├── types/                # TypeScript 타입
└── package.json
```

## 인증 흐름

1. 사용자가 이메일 입력
2. `/auth/request-otp` API 호출로 OTP 코드 전송
3. 이메일로 받은 6자리 코드 입력
4. `/auth/verify-otp` API 호출로 검증
5. JWT 토큰 받아서 localStorage에 저장
6. 메인 페이지로 리디렉션

## 토큰 관리 전략

- **Access Token**: localStorage에 저장 (클라이언트 사이드 접근 용이)
- **Refresh Token**: localStorage에 저장 (간단한 구현)
  - 프로덕션에서는 HttpOnly 쿠키 권장

### 자동 토큰 갱신

- Axios Response Interceptor에서 401 에러 감지
- Refresh Token으로 새 Access Token 자동 발급
- 실패 시 로그아웃 처리

## API 엔드포인트

- `POST /auth/request-otp` - OTP 요청
- `POST /auth/verify-otp` - OTP 검증 및 로그인
- `POST /auth/refresh` - Access Token 갱신
- `GET /users/me` - 내 정보 조회

## 개발 가이드

### 새로운 페이지 추가

1. `app/(main)/` 디렉토리에 페이지 추가
2. 인증이 필요한 경우 자동으로 로그인 페이지로 리디렉션됨

### 새로운 API 함수 추가

1. `types/`에 타입 정의 추가
2. `lib/api/`에 API 함수 작성
3. React Query 훅으로 래핑 (선택)

### UI 컴포넌트 추가

shadcn/ui CLI를 사용하거나 수동으로 추가:

```bash
npx shadcn-ui@latest add <component-name>
```

## 라이선스

MIT
