# F0: Next.js App 기본 구조 설계

## 1. 디렉토리 구조

```
apps/frontend/
├── app/
│   ├── (auth)/                          # 인증 관련 라우트 그룹
│   │   └── login/
│   │       └── page.tsx                 # 로그인 페이지
│   │
│   ├── (main)/                          # 메인 앱 라우트 그룹
│   │   ├── layout.tsx                   # 메인 레이아웃 (인증 필요)
│   │   │
│   │   ├── page.tsx                     # 홈 (선거 목록)
│   │   │
│   │   ├── elections/
│   │   │   └── [id]/
│   │   │       ├── page.tsx             # 선거 상세 페이지
│   │   │       ├── recommend/
│   │   │       │   └── page.tsx         # 후보 추천 페이지
│   │   │       ├── candidates/
│   │   │       │   └── page.tsx         # 후보 목록 및 소견서 작성
│   │   │       ├── vote/
│   │   │       │   └── page.tsx         # 투표 페이지
│   │   │       └── results/
│   │   │           └── page.tsx         # 결과 요약 페이지
│   │   │
│   │   ├── my/
│   │   │   ├── profile/
│   │   │   │   └── page.tsx             # 내 정보 페이지
│   │   │   ├── recommendations/
│   │   │   │   └── page.tsx             # 내 추천 내역
│   │   │   └── votes/
│   │   │       └── page.tsx             # 내 투표 내역
│   │   │
│   │   └── admin/                       # 관리자 전용 영역
│   │       ├── layout.tsx               # 관리자 레이아웃
│   │       ├── page.tsx                 # 관리자 대시보드
│   │       │
│   │       ├── elections/
│   │       │   ├── page.tsx             # 선거 관리 목록
│   │       │   ├── new/
│   │       │   │   └── page.tsx         # 선거 생성
│   │       │   └── [id]/
│   │       │       ├── edit/
│   │       │       │   └── page.tsx     # 선거 수정
│   │       │       ├── recommendations/
│   │       │       │   └── page.tsx     # 추천 현황 조회
│   │       │       ├── candidates/
│   │       │       │   └── page.tsx     # 후보 관리 (초대 발송)
│   │       │       └── results/
│   │       │           └── page.tsx     # 상세 결과 조회 (득표수)
│   │       │
│   │       └── users/
│   │           ├── page.tsx             # 사용자 관리 목록
│   │           └── [id]/
│   │               └── edit/
│   │                   └── page.tsx     # 사용자 정보 수정 (역할, 활성화)
│   │
│   ├── layout.tsx                       # 루트 레이아웃
│   ├── not-found.tsx                    # 404 페이지
│   └── error.tsx                        # 에러 페이지
│
├── components/                          # 공통 컴포넌트
│   ├── layout/
│   │   ├── Header.tsx
│   │   ├── Navigation.tsx
│   │   ├── Footer.tsx
│   │   └── Sidebar.tsx
│   ├── ui/                              # UI 컴포넌트
│   └── features/                        # 기능별 컴포넌트
│
├── lib/                                 # 유틸리티 및 설정
│   ├── api/                             # API 클라이언트
│   ├── auth/                            # 인증 관련
│   ├── hooks/                           # 커스텀 훅
│   └── utils/                           # 유틸 함수
│
├── types/                               # TypeScript 타입 정의
│
└── styles/                              # 글로벌 스타일
```

## 2. 페이지별 역할 및 필요 API 목록

| 경로 | 페이지명 | 역할 | 접근 권한 | 필요한 API 호출 |
|------|---------|------|----------|----------------|
| `/login` | 로그인 | OTP 로그인 | 공개 | `POST /auth/request-otp`<br>`POST /auth/verify-otp` |
| `/` | 홈 (선거 목록) | 진행 중/예정된 선거 목록 표시 | 인증 필요 | `GET /elections` |
| `/elections/[id]` | 선거 상세 | 선거 정보, 일정, 상태 표시 | 인증 필요 | `GET /elections/:id` |
| `/elections/[id]/recommend` | 후보 추천 | 역할별 후보 추천 제출 | 인증 필요 | `POST /elections/:id/recommendations` |
| `/elections/[id]/candidates` | 후보 목록 | 확정된 후보 목록 조회<br>(후보 본인은 소견서 작성) | 인증 필요 | `GET /elections/:id/candidates`<br>`PATCH /candidates/:id/status` (후보 본인) |
| `/elections/[id]/vote` | 투표 | 역할별 투표 제출 | 인증 필요 | `GET /elections/:id/vote-status`<br>`POST /elections/:id/votes`<br>`GET /elections/:id/candidates` |
| `/elections/[id]/results` | 결과 요약 | 당선자 및 투표율 표시 | 인증 필요 | `GET /elections/:id/result-summary` |
| `/my/profile` | 내 정보 | 사용자 정보 조회 | 인증 필요 | `GET /users/me` |
| `/my/recommendations` | 내 추천 내역 | 내가 한 추천 목록 | 인증 필요 | (로컬 상태 또는 별도 API) |
| `/my/votes` | 내 투표 내역 | 내가 한 투표 목록 | 인증 필요 | `GET /elections/:id/vote-status` (여러 선거) |
| **관리자 영역** |
| `/admin` | 관리자 대시보드 | 전체 통계 및 요약 | ADMIN | `GET /elections`<br>`GET /users` |
| `/admin/elections` | 선거 관리 목록 | 모든 선거 목록 (모든 상태) | ADMIN | `GET /elections` |
| `/admin/elections/new` | 선거 생성 | 새 선거 생성 폼 | ADMIN | `POST /elections` |
| `/admin/elections/[id]/edit` | 선거 수정 | 선거 정보 및 상태 수정 | ADMIN | `GET /elections/:id`<br>`PATCH /elections/:id`<br>`PATCH /elections/:id/status` |
| `/admin/elections/[id]/recommendations` | 추천 현황 | 역할별/후보별 추천 통계 | ADMIN | `GET /elections/:id/recommendations` |
| `/admin/elections/[id]/candidates` | 후보 관리 | 추천 상위자를 후보로 초대 | ADMIN | `GET /elections/:id/candidates/admin`<br>`POST /elections/:id/candidates` |
| `/admin/elections/[id]/results` | 상세 결과 | 후보별 득표수 및 득표율 | ADMIN, AUDITOR | `GET /elections/:id/result` |
| `/admin/users` | 사용자 관리 목록 | 전체 사용자 목록 | ADMIN | `GET /users` |
| `/admin/users/[id]/edit` | 사용자 수정 | 역할 및 활성화 상태 변경 | ADMIN | `PATCH /users/:id/role`<br>`PATCH /users/:id/active` |

## 3. Layout 설계

### 3.1 루트 레이아웃 (`app/layout.tsx`)

**역할:**
- 전체 앱의 HTML 구조 정의
- 메타데이터, 폰트, 글로벌 스타일 적용
- 인증 상태 Provider 설정
- Toast/Modal 등 전역 UI 컨테이너

**구조:**
```tsx
// 기본 골격
export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <body>
        <Providers>  {/* AuthProvider, QueryClientProvider 등 */}
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  )
}
```

**특징:**
- 인증 상태는 하위 레이아웃에서 처리
- 전역 상태 관리 Provider 설정

---

### 3.2 메인 레이아웃 (`app/(main)/layout.tsx`)

**역할:**
- 인증이 필요한 모든 페이지의 공통 레이아웃
- 인증 상태 확인 및 리디렉션
- 헤더, 네비게이션, 푸터 표시

**구조:**
```tsx
// 기본 골격
export default function MainLayout({ children }) {
  // 인증 상태 확인
  const { user, isLoading } = useAuth()

  // 미인증 시 로그인 페이지로 리디렉션
  if (!isLoading && !user) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header user={user} />
      <div className="flex flex-1">
        <Navigation user={user} />
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
      <Footer />
    </div>
  )
}
```

**인증 상태에 따른 분기:**

1. **로딩 중** (`isLoading === true`)
   - 스켈레톤 UI 또는 로딩 스피너 표시

2. **비로그인** (`!user`)
   - `/login` 페이지로 리디렉션

3. **로그인 상태** (`user`)
   - 정상적으로 레이아웃 렌더링
   - Navigation에서 역할별로 메뉴 표시
     - MEMBER: 선거 목록, 내 정보
     - ADMIN: 위 항목 + 관리자 메뉴

**컴포넌트 구성:**

```
┌─────────────────────────────────────────┐
│ Header                                  │
│ - 로고                                  │
│ - 사용자 정보 (이름, 역할)              │
│ - 로그아웃 버튼                         │
└─────────────────────────────────────────┘
┌──────────┬──────────────────────────────┐
│          │                              │
│ Naviga   │  Main Content                │
│ tion     │                              │
│          │  {children}                  │
│ - 홈     │                              │
│ - 선거   │                              │
│ - 내정보 │                              │
│ [관리자] │                              │
│          │                              │
└──────────┴──────────────────────────────┘
┌─────────────────────────────────────────┐
│ Footer                                  │
│ - 저작권 정보                           │
└─────────────────────────────────────────┘
```

---

### 3.3 관리자 레이아웃 (`app/(main)/admin/layout.tsx`)

**역할:**
- 관리자 권한 확인
- 관리자 전용 사이드바 또는 네비게이션 추가

**구조:**
```tsx
// 기본 골격
export default function AdminLayout({ children }) {
  const { user } = useAuth()

  // 관리자 권한 확인
  if (user?.role !== 'ADMIN') {
    redirect('/')
  }

  return (
    <div className="flex gap-6">
      <AdminSidebar />
      <div className="flex-1">
        {children}
      </div>
    </div>
  )
}
```

**특징:**
- 관리자 권한이 없으면 홈으로 리디렉션
- 관리자 전용 사이드바 메뉴 표시
  - 선거 관리
  - 사용자 관리
  - 통계/리포트

---

## 4. 각 page.tsx 기본 골격 코드

### 4.1 로그인 페이지 (`app/(auth)/login/page.tsx`)

```tsx
'use client'

export default function LoginPage() {
  // TODO: OTP 요청/검증 로직 구현

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="text-center text-3xl font-bold">
            사우회 선거 시스템
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            이메일 OTP 로그인
          </p>
        </div>

        {/* TODO: OTP 요청 폼 */}
        <div className="space-y-4">
          <div>
            <label>이메일</label>
            <input type="email" placeholder="your@email.com" />
          </div>
          <button type="button">OTP 전송</button>
        </div>

        {/* TODO: OTP 검증 폼 (OTP 전송 후 표시) */}
        <div className="space-y-4">
          <div>
            <label>인증 코드</label>
            <input type="text" placeholder="6자리 코드 입력" />
          </div>
          <button type="button">로그인</button>
        </div>
      </div>
    </div>
  )
}
```

---

### 4.2 홈 - 선거 목록 (`app/(main)/page.tsx`)

```tsx
export default async function HomePage() {
  // TODO: GET /elections API 호출

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">선거 목록</h1>
      </div>

      {/* TODO: 진행 중 선거 */}
      <section>
        <h2 className="text-xl font-semibold mb-4">진행 중인 선거</h2>
        <div className="grid gap-4">
          {/* ElectionCard 컴포넌트 */}
        </div>
      </section>

      {/* TODO: 예정된 선거 */}
      <section>
        <h2 className="text-xl font-semibold mb-4">예정된 선거</h2>
        <div className="grid gap-4">
          {/* ElectionCard 컴포넌트 */}
        </div>
      </section>

      {/* TODO: 종료된 선거 */}
      <section>
        <h2 className="text-xl font-semibold mb-4">종료된 선거</h2>
        <div className="grid gap-4">
          {/* ElectionCard 컴포넌트 */}
        </div>
      </section>
    </div>
  )
}
```

---

### 4.3 선거 상세 (`app/(main)/elections/[id]/page.tsx`)

```tsx
export default async function ElectionDetailPage({ params }: { params: { id: string } }) {
  // TODO: GET /elections/:id API 호출

  return (
    <div className="space-y-6">
      {/* 선거 기본 정보 */}
      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold">선거명</h1>
        <p className="text-gray-600 mt-2">선거 설명</p>

        {/* 선거 상태 배지 */}
        <div className="mt-4">
          <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
            진행중
          </span>
        </div>
      </div>

      {/* 일정 정보 */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">선거 일정</h2>
        <div className="space-y-2">
          <div>추천 기간: YYYY-MM-DD ~ YYYY-MM-DD</div>
          <div>투표 기간: YYYY-MM-DD ~ YYYY-MM-DD</div>
        </div>
      </div>

      {/* 단계별 액션 버튼 */}
      <div className="flex gap-4">
        {/* TODO: 선거 상태에 따라 버튼 표시 */}
        <button>후보 추천하기</button>
        <button>투표하기</button>
        <button>결과 보기</button>
      </div>
    </div>
  )
}
```

---

### 4.4 후보 추천 (`app/(main)/elections/[id]/recommend/page.tsx`)

```tsx
'use client'

export default function RecommendPage({ params }: { params: { id: string } }) {
  // TODO: POST /elections/:id/recommendations API 호출

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">후보 추천</h1>

      {/* 역할별 추천 폼 */}
      <div className="space-y-6">
        {/* 회장 추천 */}
        <section className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">회장 추천</h2>
          <div className="space-y-4">
            <div>
              <label>추천할 직원</label>
              <select>
                <option>직원 선택</option>
                {/* TODO: 직원 목록 */}
              </select>
            </div>
            <div>
              <label>추천 이유</label>
              <textarea placeholder="추천 이유를 입력하세요" />
            </div>
          </div>
        </section>

        {/* 총무 추천 */}
        <section className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">총무 추천</h2>
          {/* 동일한 폼 구조 */}
        </section>

        {/* 감사 추천 */}
        <section className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">감사 추천</h2>
          {/* 동일한 폼 구조 */}
        </section>
      </div>

      <button type="submit" className="w-full">
        추천 제출
      </button>
    </div>
  )
}
```

---

### 4.5 후보 목록 (`app/(main)/elections/[id]/candidates/page.tsx`)

```tsx
export default async function CandidatesPage({ params }: { params: { id: string } }) {
  // TODO: GET /elections/:id/candidates API 호출

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">후보 목록</h1>

      {/* 역할별 후보 목록 */}
      <section>
        <h2 className="text-xl font-semibold mb-4">회장 후보</h2>
        <div className="grid gap-4">
          {/* TODO: CandidateCard 컴포넌트 */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-start gap-4">
              <div className="flex-1">
                <h3 className="font-semibold">후보명</h3>
                <p className="text-sm text-gray-600">부서 / 직급</p>
                <p className="mt-2">소견서 내용...</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 총무 후보 */}
      <section>
        <h2 className="text-xl font-semibold mb-4">총무 후보</h2>
        {/* 동일한 구조 */}
      </section>

      {/* 감사 후보 */}
      <section>
        <h2 className="text-xl font-semibold mb-4">감사 후보</h2>
        {/* 동일한 구조 */}
      </section>

      {/* TODO: 본인이 후보인 경우 소견서 작성 폼 표시 */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="font-semibold mb-2">소견서 작성</h3>
        <textarea placeholder="소견서를 작성하세요" />
        <button className="mt-4">제출</button>
      </div>
    </div>
  )
}
```

---

### 4.6 투표 (`app/(main)/elections/[id]/vote/page.tsx`)

```tsx
'use client'

export default function VotePage({ params }: { params: { id: string } }) {
  // TODO: GET /elections/:id/vote-status - 투표 상태 확인
  // TODO: GET /elections/:id/candidates - 후보 목록
  // TODO: POST /elections/:id/votes - 투표 제출

  return (
    <div className="space-y-6">
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="font-semibold">투표 유의사항</p>
        <ul className="mt-2 space-y-1 text-sm">
          <li>• 각 역할별로 1명씩 선택할 수 있습니다</li>
          <li>• 투표 후에는 수정할 수 없습니다</li>
          <li>• 투표는 익명으로 진행됩니다</li>
        </ul>
      </div>

      {/* 역할별 투표 */}
      <section className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">회장 투표</h2>
        <div className="space-y-2">
          {/* TODO: 후보 라디오 버튼 목록 */}
          <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
            <input type="radio" name="president" />
            <div>
              <div className="font-semibold">후보 이름</div>
              <div className="text-sm text-gray-600">부서 / 직급</div>
            </div>
          </label>
        </div>
      </section>

      <section className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">총무 투표</h2>
        {/* 동일한 구조 */}
      </section>

      <section className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">감사 투표</h2>
        {/* 동일한 구조 */}
      </section>

      <button type="submit" className="w-full bg-blue-600 text-white">
        투표 제출
      </button>
    </div>
  )
}
```

---

### 4.7 결과 요약 (`app/(main)/elections/[id]/results/page.tsx`)

```tsx
export default async function ResultsPage({ params }: { params: { id: string } }) {
  // TODO: GET /elections/:id/result-summary API 호출

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">선거 결과</h1>

      {/* 투표율 */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">투표 참여 현황</h2>
        <div className="flex items-center gap-4">
          <div className="text-4xl font-bold">75%</div>
          <div className="text-gray-600">
            총 100명 중 75명 투표
          </div>
        </div>
      </div>

      {/* 역할별 당선자 */}
      <section>
        <h2 className="text-xl font-semibold mb-4">당선자</h2>

        <div className="space-y-4">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-4">
              <div className="text-2xl">🏆</div>
              <div>
                <div className="text-lg font-semibold">회장: 홍길동</div>
                <div className="text-sm text-gray-600">개발팀 / 대리</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-4">
              <div className="text-2xl">🏆</div>
              <div>
                <div className="text-lg font-semibold">총무: 김철수</div>
                <div className="text-sm text-gray-600">총무팀 / 대리</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-4">
              <div className="text-2xl">🏆</div>
              <div>
                <div className="text-lg font-semibold">감사: 이영희</div>
                <div className="text-sm text-gray-600">기획팀 / 과장</div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
```

---

### 4.8 내 정보 (`app/(main)/my/profile/page.tsx`)

```tsx
export default async function ProfilePage() {
  // TODO: GET /users/me API 호출

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">내 정보</h1>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="space-y-4">
          <div>
            <label className="text-sm text-gray-600">이름</label>
            <div className="font-semibold">홍길동</div>
          </div>

          <div>
            <label className="text-sm text-gray-600">이메일</label>
            <div className="font-semibold">hong@example.com</div>
          </div>

          <div>
            <label className="text-sm text-gray-600">사번</label>
            <div className="font-semibold">EMP001</div>
          </div>

          <div>
            <label className="text-sm text-gray-600">부서</label>
            <div className="font-semibold">개발팀</div>
          </div>

          <div>
            <label className="text-sm text-gray-600">직급</label>
            <div className="font-semibold">대리</div>
          </div>

          <div>
            <label className="text-sm text-gray-600">역할</label>
            <div>
              <span className="px-3 py-1 bg-gray-100 rounded-full text-sm">
                회원
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
```

---

### 4.9 관리자 대시보드 (`app/(main)/admin/page.tsx`)

```tsx
export default async function AdminDashboardPage() {
  // TODO: GET /elections, GET /users API 호출

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">관리자 대시보드</h1>

      {/* 통계 카드 */}
      <div className="grid grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-600">총 선거 수</div>
          <div className="text-3xl font-bold mt-2">12</div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-600">진행 중 선거</div>
          <div className="text-3xl font-bold mt-2">3</div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-600">전체 회원 수</div>
          <div className="text-3xl font-bold mt-2">150</div>
        </div>
      </div>

      {/* 최근 선거 */}
      <section>
        <h2 className="text-xl font-semibold mb-4">최근 선거</h2>
        <div className="bg-white rounded-lg shadow">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="p-4 text-left">선거명</th>
                <th className="p-4 text-left">상태</th>
                <th className="p-4 text-left">투표 기간</th>
                <th className="p-4 text-left">관리</th>
              </tr>
            </thead>
            <tbody>
              {/* TODO: 선거 목록 */}
              <tr className="border-b">
                <td className="p-4">2024년 제1차 임원 선거</td>
                <td className="p-4">
                  <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-sm">
                    투표중
                  </span>
                </td>
                <td className="p-4">2024-02-05 ~ 2024-02-10</td>
                <td className="p-4">
                  <button className="text-blue-600">관리</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
```

---

### 4.10 선거 관리 목록 (`app/(main)/admin/elections/page.tsx`)

```tsx
export default async function AdminElectionsPage() {
  // TODO: GET /elections API 호출 (모든 상태)

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">선거 관리</h1>
        <a href="/admin/elections/new">
          <button className="bg-blue-600 text-white px-4 py-2 rounded">
            새 선거 만들기
          </button>
        </a>
      </div>

      {/* 필터 */}
      <div className="flex gap-4">
        <select>
          <option>전체 상태</option>
          <option>기획중</option>
          <option>추천중</option>
          <option>후보확정</option>
          <option>투표중</option>
          <option>종료</option>
        </select>
      </div>

      {/* 선거 목록 테이블 */}
      <div className="bg-white rounded-lg shadow">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="p-4 text-left">선거명</th>
              <th className="p-4 text-left">상태</th>
              <th className="p-4 text-left">추천 기간</th>
              <th className="p-4 text-left">투표 기간</th>
              <th className="p-4 text-left">관리</th>
            </tr>
          </thead>
          <tbody>
            {/* TODO: 선거 목록 매핑 */}
          </tbody>
        </table>
      </div>
    </div>
  )
}
```

---

### 4.11 선거 생성 (`app/(main)/admin/elections/new/page.tsx`)

```tsx
'use client'

export default function NewElectionPage() {
  // TODO: POST /elections API 호출

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">새 선거 만들기</h1>

      <form className="bg-white rounded-lg shadow p-6 space-y-6">
        <div>
          <label className="block mb-2 font-semibold">선거명</label>
          <input
            type="text"
            placeholder="예: 2024년 제1차 사우회 임원 선거"
            className="w-full border rounded px-3 py-2"
          />
        </div>

        <div>
          <label className="block mb-2 font-semibold">선거 설명</label>
          <textarea
            placeholder="선거에 대한 설명을 입력하세요"
            className="w-full border rounded px-3 py-2"
            rows={4}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block mb-2 font-semibold">추천 시작일</label>
            <input type="datetime-local" className="w-full border rounded px-3 py-2" />
          </div>
          <div>
            <label className="block mb-2 font-semibold">추천 종료일</label>
            <input type="datetime-local" className="w-full border rounded px-3 py-2" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block mb-2 font-semibold">투표 시작일</label>
            <input type="datetime-local" className="w-full border rounded px-3 py-2" />
          </div>
          <div>
            <label className="block mb-2 font-semibold">투표 종료일</label>
            <input type="datetime-local" className="w-full border rounded px-3 py-2" />
          </div>
        </div>

        <div>
          <label className="block mb-2 font-semibold">최대 추천 가능 수</label>
          <input
            type="number"
            defaultValue={3}
            className="w-full border rounded px-3 py-2"
          />
        </div>

        <div className="flex gap-4">
          <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded">
            선거 생성
          </button>
          <button type="button" className="border px-6 py-2 rounded">
            취소
          </button>
        </div>
      </form>
    </div>
  )
}
```

---

### 4.12 추천 현황 조회 (`app/(main)/admin/elections/[id]/recommendations/page.tsx`)

```tsx
export default async function AdminRecommendationsPage({ params }: { params: { id: string } }) {
  // TODO: GET /elections/:id/recommendations API 호출

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">추천 현황</h1>

      {/* 총 추천 수 */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-sm text-gray-600">총 추천 수</div>
        <div className="text-3xl font-bold mt-2">127</div>
      </div>

      {/* 역할별 추천 현황 */}
      <section>
        <h2 className="text-xl font-semibold mb-4">회장 추천 현황</h2>
        <div className="bg-white rounded-lg shadow">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="p-4 text-left">순위</th>
                <th className="p-4 text-left">이름</th>
                <th className="p-4 text-left">부서/직급</th>
                <th className="p-4 text-left">추천 수</th>
                <th className="p-4 text-left">추천 이유 샘플</th>
              </tr>
            </thead>
            <tbody>
              {/* TODO: 추천 순위별 목록 */}
              <tr className="border-b">
                <td className="p-4">1</td>
                <td className="p-4 font-semibold">홍길동</td>
                <td className="p-4">개발팀 / 대리</td>
                <td className="p-4">
                  <span className="text-xl font-bold text-blue-600">25</span>
                </td>
                <td className="p-4 text-sm text-gray-600">
                  리더십이 뛰어남, 책임감이 강함...
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* 총무, 감사도 동일한 구조로 */}
    </div>
  )
}
```

---

### 4.13 후보 관리 (`app/(main)/admin/elections/[id]/candidates/page.tsx`)

```tsx
'use client'

export default function AdminCandidatesPage({ params }: { params: { id: string } }) {
  // TODO: GET /elections/:id/candidates/admin - 전체 후보 목록
  // TODO: POST /elections/:id/candidates - 후보 초대

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">후보 관리</h1>

      {/* 후보 초대 */}
      <section className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">후보 초대</h2>
        <p className="text-sm text-gray-600 mb-4">
          추천 상위 N명을 후보로 초대합니다.
        </p>

        <div className="flex gap-4">
          <div>
            <label className="block mb-2">역할</label>
            <select className="border rounded px-3 py-2">
              <option>회장</option>
              <option>총무</option>
              <option>감사</option>
            </select>
          </div>

          <div>
            <label className="block mb-2">상위 몇 명</label>
            <input
              type="number"
              defaultValue={3}
              className="border rounded px-3 py-2"
            />
          </div>

          <div className="flex items-end">
            <button className="bg-blue-600 text-white px-4 py-2 rounded">
              초대 발송
            </button>
          </div>
        </div>
      </section>

      {/* 후보 현황 */}
      <section>
        <h2 className="text-xl font-semibold mb-4">후보 현황</h2>

        <div className="bg-white rounded-lg shadow">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="p-4 text-left">이름</th>
                <th className="p-4 text-left">역할</th>
                <th className="p-4 text-left">상태</th>
                <th className="p-4 text-left">추천 수</th>
                <th className="p-4 text-left">소견서</th>
              </tr>
            </thead>
            <tbody>
              {/* TODO: 후보 목록 매핑 */}
              <tr className="border-b">
                <td className="p-4">홍길동</td>
                <td className="p-4">회장</td>
                <td className="p-4">
                  <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-sm">
                    수락
                  </span>
                </td>
                <td className="p-4">25</td>
                <td className="p-4 text-sm text-gray-600">
                  열심히 하겠습니다...
                </td>
              </tr>

              <tr className="border-b">
                <td className="p-4">김철수</td>
                <td className="p-4">회장</td>
                <td className="p-4">
                  <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-sm">
                    초대됨
                  </span>
                </td>
                <td className="p-4">20</td>
                <td className="p-4 text-sm text-gray-400">
                  미작성
                </td>
              </tr>

              <tr className="border-b">
                <td className="p-4">이영희</td>
                <td className="p-4">회장</td>
                <td className="p-4">
                  <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-sm">
                    거절
                  </span>
                </td>
                <td className="p-4">18</td>
                <td className="p-4 text-sm text-gray-400">
                  -
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
```

---

### 4.14 상세 결과 조회 (`app/(main)/admin/elections/[id]/results/page.tsx`)

```tsx
export default async function AdminResultsPage({ params }: { params: { id: string } }) {
  // TODO: GET /elections/:id/result API 호출 (관리자/감사 전용)

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">상세 결과 (관리자/감사 전용)</h1>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="text-sm">
          ⚠️ 이 페이지는 관리자와 감사만 볼 수 있습니다. 후보별 득표수가 표시됩니다.
        </p>
      </div>

      {/* 역할별 득표 현황 */}
      <section>
        <h2 className="text-xl font-semibold mb-4">회장 득표 현황</h2>
        <div className="bg-white rounded-lg shadow">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="p-4 text-left">순위</th>
                <th className="p-4 text-left">후보</th>
                <th className="p-4 text-left">득표수</th>
                <th className="p-4 text-left">득표율</th>
                <th className="p-4 text-left">당선</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b bg-yellow-50">
                <td className="p-4">1</td>
                <td className="p-4 font-semibold">홍길동</td>
                <td className="p-4">
                  <span className="text-xl font-bold">58표</span>
                </td>
                <td className="p-4">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div className="bg-blue-600 h-2 rounded-full" style={{ width: '77%' }} />
                    </div>
                    <span className="text-sm font-semibold">77%</span>
                  </div>
                </td>
                <td className="p-4">
                  <span className="text-2xl">🏆</span>
                </td>
              </tr>

              <tr className="border-b">
                <td className="p-4">2</td>
                <td className="p-4">김철수</td>
                <td className="p-4">17표</td>
                <td className="p-4">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div className="bg-gray-400 h-2 rounded-full" style={{ width: '23%' }} />
                    </div>
                    <span className="text-sm">23%</span>
                  </div>
                </td>
                <td className="p-4">-</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* 총무, 감사도 동일한 구조 */}
    </div>
  )
}
```

---

### 4.15 사용자 관리 (`app/(main)/admin/users/page.tsx`)

```tsx
export default async function AdminUsersPage() {
  // TODO: GET /users API 호출

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">사용자 관리</h1>

      {/* 필터 및 검색 */}
      <div className="flex gap-4">
        <select className="border rounded px-3 py-2">
          <option>전체 역할</option>
          <option>회원</option>
          <option>관리자</option>
          <option>감사</option>
        </select>

        <select className="border rounded px-3 py-2">
          <option>전체 상태</option>
          <option>활성</option>
          <option>비활성</option>
        </select>

        <input
          type="text"
          placeholder="이름 또는 이메일 검색"
          className="flex-1 border rounded px-3 py-2"
        />
      </div>

      {/* 사용자 목록 */}
      <div className="bg-white rounded-lg shadow">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="p-4 text-left">사번</th>
              <th className="p-4 text-left">이름</th>
              <th className="p-4 text-left">이메일</th>
              <th className="p-4 text-left">부서/직급</th>
              <th className="p-4 text-left">역할</th>
              <th className="p-4 text-left">상태</th>
              <th className="p-4 text-left">관리</th>
            </tr>
          </thead>
          <tbody>
            {/* TODO: 사용자 목록 매핑 */}
            <tr className="border-b">
              <td className="p-4">EMP001</td>
              <td className="p-4 font-semibold">홍길동</td>
              <td className="p-4">hong@example.com</td>
              <td className="p-4">개발팀 / 대리</td>
              <td className="p-4">
                <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">
                  관리자
                </span>
              </td>
              <td className="p-4">
                <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-sm">
                  활성
                </span>
              </td>
              <td className="p-4">
                <a href="/admin/users/uuid/edit" className="text-blue-600">
                  수정
                </a>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* 페이지네이션 */}
      <div className="flex justify-center gap-2">
        <button className="px-3 py-1 border rounded">이전</button>
        <button className="px-3 py-1 bg-blue-600 text-white rounded">1</button>
        <button className="px-3 py-1 border rounded">2</button>
        <button className="px-3 py-1 border rounded">3</button>
        <button className="px-3 py-1 border rounded">다음</button>
      </div>
    </div>
  )
}
```

---

### 4.16 사용자 수정 (`app/(main)/admin/users/[id]/edit/page.tsx`)

```tsx
'use client'

export default function EditUserPage({ params }: { params: { id: string } }) {
  // TODO: PATCH /users/:id/role
  // TODO: PATCH /users/:id/active

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">사용자 정보 수정</h1>

      <div className="bg-white rounded-lg shadow p-6">
        {/* 사용자 기본 정보 (읽기 전용) */}
        <section className="mb-6 pb-6 border-b">
          <h2 className="text-lg font-semibold mb-4">기본 정보</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-gray-600">사번</label>
              <div className="font-semibold">EMP001</div>
            </div>
            <div>
              <label className="text-sm text-gray-600">이름</label>
              <div className="font-semibold">홍길동</div>
            </div>
            <div>
              <label className="text-sm text-gray-600">이메일</label>
              <div className="font-semibold">hong@example.com</div>
            </div>
            <div>
              <label className="text-sm text-gray-600">부서/직급</label>
              <div className="font-semibold">개발팀 / 대리</div>
            </div>
          </div>
        </section>

        {/* 역할 변경 */}
        <section className="mb-6 pb-6 border-b">
          <h2 className="text-lg font-semibold mb-4">역할 변경</h2>
          <div>
            <label className="block mb-2">역할</label>
            <select className="border rounded px-3 py-2">
              <option>회원</option>
              <option>관리자</option>
              <option>감사</option>
            </select>
          </div>
          <button className="mt-4 bg-blue-600 text-white px-4 py-2 rounded">
            역할 변경
          </button>
        </section>

        {/* 활성화 상태 변경 */}
        <section>
          <h2 className="text-lg font-semibold mb-4">활성화 상태</h2>
          <div>
            <label className="flex items-center gap-2">
              <input type="checkbox" defaultChecked />
              <span>활성화</span>
            </label>
            <p className="text-sm text-gray-600 mt-2">
              비활성화된 사용자는 로그인할 수 없습니다.
            </p>
          </div>
          <button className="mt-4 bg-blue-600 text-white px-4 py-2 rounded">
            상태 변경
          </button>
        </section>
      </div>

      <div className="flex gap-4">
        <button className="border px-6 py-2 rounded">
          돌아가기
        </button>
      </div>
    </div>
  )
}
```

---

## 5. 다음 단계 (F1 이후)

F1 단계부터는 다음 작업을 진행합니다:

1. **컴포넌트 구현**
   - 공통 UI 컴포넌트 (Button, Card, Table, Form 등)
   - 레이아웃 컴포넌트 (Header, Navigation, Footer)
   - 기능별 컴포넌트 (ElectionCard, CandidateCard, VoteForm 등)

2. **API 클라이언트 설정**
   - Axios 또는 fetch 기반 API 클라이언트
   - 인증 토큰 자동 주입
   - 에러 처리 및 응답 변환

3. **인증 시스템 구현**
   - AuthProvider 및 useAuth 훅
   - 토큰 관리 (localStorage/sessionStorage)
   - 자동 토큰 갱신 (Refresh Token)

4. **상태 관리**
   - React Query 또는 SWR로 서버 상태 관리
   - Zustand 또는 Context API로 클라이언트 상태 관리

5. **스타일링**
   - Tailwind CSS 설정
   - 컴포넌트 스타일링
   - 반응형 디자인

6. **폼 유효성 검사**
   - React Hook Form + Zod
   - 에러 메시지 표시

7. **테스트**
   - 단위 테스트
   - 통합 테스트
   - E2E 테스트

---

## 요약

이 문서는 Next.js App Router 기반의 사우회 선거 시스템 프론트엔드의 **기본 구조**를 설계했습니다:

- ✅ **디렉토리 구조**: 라우트 그룹을 활용한 체계적인 폴더 구조
- ✅ **API 매핑**: 각 페이지별 필요한 API 호출 목록 정리
- ✅ **레이아웃 설계**: 인증 상태에 따른 레이아웃 분기 전략
- ✅ **페이지 골격**: 각 페이지의 기본 구조 및 placeholder 코드

다음 단계에서는 실제 UI 컴포넌트를 구현하고, API 연동을 완료하여 동작하는 애플리케이션을 만들 예정입니다.
