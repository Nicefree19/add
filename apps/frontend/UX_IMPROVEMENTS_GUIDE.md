# UX 개선 가이드 (F4 Phase)

이 문서는 F4 단계에서 추가된 UX 개선 사항과 적용 방법을 설명합니다.

## 1. Toast 알림 시스템 (Sonner)

### 설치 완료
- `sonner` 라이브러리가 설치되어 전역에서 사용 가능합니다.
- `components/ui/toaster.tsx` 컴포넌트가 생성되었습니다.
- `Providers` 컴포넌트에 `<Toaster />` 추가 완료

### 사용 방법

기존 코드에서 `setSuccess(true)`, `setError()` 상태를 사용하던 부분을 Toast로 교체할 수 있습니다.

#### Before (기존 Alert 방식):
```tsx
const [success, setSuccess] = useState(false);
const [error, setError] = useState<string | null>(null);

// ... 성공 시
setSuccess(true);
setTimeout(() => setSuccess(false), 3000);

// JSX
{success && (
  <Alert>
    <AlertDescription>저장되었습니다.</AlertDescription>
  </Alert>
)}
```

#### After (Toast 방식):
```tsx
import { toast } from 'sonner';

// ... 성공 시
toast.success('저장되었습니다');

// 에러 시
toast.error('오류가 발생했습니다');

// 정보
toast.info('처리 중입니다...');

// 경고
toast.warning('확인이 필요합니다');

// 커스텀 메시지
toast('커스텀 메시지', {
  description: '상세 설명',
  action: {
    label: '취소',
    onClick: () => console.log('취소됨'),
  },
});
```

### 적용 권장 페이지

다음 파일들의 성공/에러 메시지를 Toast로 변경하는 것을 권장합니다:

1. **Admin 페이지들**
   - `/admin/elections/[id]/page.tsx` - 선거 정보 저장, 상태 변경
   - `/admin/elections/[id]/recommendations/page.tsx` - 후보 초대
   - `/admin/elections/[id]/candidates/page.tsx` - 후보 삭제
   - `/admin/elections/[id]/notifications/page.tsx` - 알림 발송
   - `/admin/elections/[id]/transition/page.tsx` - 문서 업로드

2. **Member 페이지들**
   - `/elections/[id]/recommend/page.tsx` - 추천 제출
   - `/elections/[id]/vote/page.tsx` - 투표 제출

### 예시: 선거 정보 수정 페이지에 Toast 적용

```tsx
// apps/frontend/app/(main)/admin/elections/[id]/page.tsx
import { toast } from 'sonner';

const onSubmit = async (data: ElectionFormData) => {
  try {
    setIsSaving(true);
    setError(null);

    await apiClient.patch(`/elections/${electionId}`, {
      ...data,
      recommendationStartDate: new Date(data.recommendationStartDate).toISOString(),
      recommendationEndDate: new Date(data.recommendationEndDate).toISOString(),
      votingStartDate: new Date(data.votingStartDate).toISOString(),
      votingEndDate: new Date(data.votingEndDate).toISOString(),
    });

    // Before: setSuccess(true); setTimeout(() => setSuccess(false), 3000);
    // After:
    toast.success('저장되었습니다', {
      description: '선거 정보가 성공적으로 업데이트되었습니다.',
    });

    await loadElection();
  } catch (err) {
    // Before: setError(getErrorMessage(err));
    // After:
    toast.error('저장 실패', {
      description: getErrorMessage(err),
    });
  } finally {
    setIsSaving(false);
  }
};
```

---

## 2. Error Boundary 컴포넌트

### 생성 완료
- `components/error-boundary.tsx` 클래스 컴포넌트 생성
- 개발 모드에서 상세 에러 정보 표시
- 프로덕션 모드에서 사용자 친화적 에러 화면

### 사용 방법

#### 전체 앱에 적용 (권장)
```tsx
// app/layout.tsx
import { ErrorBoundary } from '@/components/error-boundary';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>
        <ErrorBoundary>
          <Providers>{children}</Providers>
        </ErrorBoundary>
      </body>
    </html>
  );
}
```

#### 특정 페이지/컴포넌트에만 적용
```tsx
// app/(main)/elections/[id]/page.tsx
import { ErrorBoundary } from '@/components/error-boundary';

export default function ElectionDetailPage() {
  return (
    <ErrorBoundary>
      <ElectionContent />
    </ErrorBoundary>
  );
}
```

#### 커스텀 Fallback UI
```tsx
<ErrorBoundary
  fallback={
    <div className="p-8 text-center">
      <h2>선거 정보를 불러올 수 없습니다</h2>
      <Button onClick={() => window.location.reload()}>
        다시 시도
      </Button>
    </div>
  }
>
  <YourComponent />
</ErrorBoundary>
```

---

## 3. 공통 로딩 컴포넌트 정리

### 권장 사항: Skeleton 일관성

현재 각 페이지마다 로딩 UI가 다릅니다. 다음과 같이 통일하는 것을 권장합니다:

#### 공통 로딩 컴포넌트 생성
```tsx
// components/common/loading-skeleton.tsx
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

export function PageLoadingSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-64" />
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-3/4" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    </div>
  );
}

export function ListLoadingSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className="h-24 w-full" />
      ))}
    </div>
  );
}

export function TableLoadingSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-16 w-full" />
      ))}
    </div>
  );
}
```

#### 사용 예시
```tsx
if (isLoading) {
  return <PageLoadingSkeleton />;
}
```

---

## 4. 반응형 디자인 개선

### 현재 문제점
- 일부 페이지에서 모바일/태블릿 뷰가 최적화되지 않음
- 테이블이 작은 화면에서 가로 스크롤 발생
- 버튼 그룹이 화면 밖으로 나감

### 해결 방법

#### A. 테이블 반응형 처리

**Before:**
```tsx
<div className="overflow-x-auto">
  <table className="w-full">
    {/* ... */}
  </table>
</div>
```

**After (모바일에서 카드 형태로 변경):**
```tsx
{/* 데스크톱: 테이블 */}
<div className="hidden md:block overflow-x-auto">
  <table className="w-full">
    {/* ... */}
  </table>
</div>

{/* 모바일: 카드 */}
<div className="md:hidden space-y-3">
  {items.map((item) => (
    <Card key={item.id}>
      <CardContent className="pt-6">
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">이름</span>
            <span className="font-medium">{item.name}</span>
          </div>
          {/* ... 다른 필드들 */}
        </div>
      </CardContent>
    </Card>
  ))}
</div>
```

#### B. Grid 반응형

**Before:**
```tsx
<div className="grid grid-cols-4 gap-4">
  {/* ... */}
</div>
```

**After:**
```tsx
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
  {/* ... */}
</div>
```

#### C. 버튼 그룹 반응형

**Before:**
```tsx
<div className="flex gap-2">
  <Button>버튼 1</Button>
  <Button>버튼 2</Button>
  <Button>버튼 3</Button>
  <Button>버튼 4</Button>
  <Button>버튼 5</Button>
</div>
```

**After:**
```tsx
<div className="flex flex-wrap gap-2">
  <Button className="flex-1 min-w-[120px]">버튼 1</Button>
  <Button className="flex-1 min-w-[120px]">버튼 2</Button>
  <Button className="flex-1 min-w-[120px]">버튼 3</Button>
  <Button className="flex-1 min-w-[120px]">버튼 4</Button>
  <Button className="flex-1 min-w-[120px]">버튼 5</Button>
</div>
```

#### D. 사이드바 반응형

현재 Admin Layout의 사이드바는 모바일에서 문제가 있을 수 있습니다.

**개선안:**
```tsx
// app/(main)/admin/layout.tsx
<div className="flex flex-col lg:flex-row gap-6">
  {/* 모바일: 상단 네비게이션 */}
  <nav className="lg:hidden bg-white rounded-lg shadow p-4">
    <select
      value={pathname}
      onChange={(e) => router.push(e.target.value)}
      className="w-full px-3 py-2 border rounded-md"
    >
      {navItems.map((item) => (
        <option key={item.href} value={item.href}>
          {item.title}
        </option>
      ))}
    </select>
  </nav>

  {/* 데스크톱: 사이드바 */}
  <aside className="hidden lg:block w-64 bg-white rounded-lg shadow p-4 space-y-2 sticky top-6 h-fit">
    {/* 기존 사이드바 코드 */}
  </aside>

  <main className="flex-1">
    {children}
  </main>
</div>
```

---

## 5. 적용 우선순위

### 즉시 적용 권장 (높음)
1. ✅ Toast 알림 시스템 - Admin 페이지들부터 적용
2. ✅ Error Boundary - Root Layout에 적용
3. ⚠️ 테이블 반응형 - Admin Logs, Candidates 페이지

### 점진적 적용 권장 (중간)
4. Grid 반응형 - Dashboard, Statistics 카드들
5. 버튼 그룹 반응형 - Election Detail 페이지 Quick Links
6. 공통 로딩 컴포넌트 통일

### 선택적 적용 (낮음)
7. 사이드바 반응형 (모바일 사용이 적을 경우)
8. 폰트 크기 조정 (접근성 개선)

---

## 6. 테스트 체크리스트

### 반응형 테스트
- [ ] Chrome DevTools - 375px (Mobile S)
- [ ] Chrome DevTools - 768px (Tablet)
- [ ] Chrome DevTools - 1024px (Desktop)
- [ ] 실제 모바일 기기 테스트

### 기능 테스트
- [ ] Toast 알림이 정상 표시되는가?
- [ ] Error Boundary가 에러를 캐치하는가?
- [ ] 모든 버튼이 클릭 가능한가?
- [ ] 텍스트가 잘리지 않는가?
- [ ] 스크롤이 부드럽게 작동하는가?

---

## 7. 예시: 투표 페이지 완전 개선 코드

```tsx
// app/(main)/elections/[id]/vote/page.tsx
import { toast } from 'sonner';
import { ErrorBoundary } from '@/components/error-boundary';

function VotePageContent() {
  const onSubmit = async (data: VoteFormData) => {
    try {
      setIsSubmitting(true);

      await createVotes(electionId, { votes: data.votes });

      toast.success('투표가 완료되었습니다', {
        description: '소중한 한 표 감사합니다!',
      });

      router.push(`/elections/${electionId}/results`);
    } catch (err) {
      toast.error('투표 실패', {
        description: getErrorMessage(err),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // 반응형 렌더링
  return (
    <div className="space-y-6">
      {/* 모바일: 카드 형태 */}
      <div className="md:hidden space-y-4">
        {candidatesByRole.map(({ role, candidates }) => (
          <Card key={role}>
            <CardHeader>
              <CardTitle>{getRoleText(role)}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {candidates.map((candidate) => (
                <label
                  key={candidate.id}
                  className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50"
                >
                  <input
                    type="radio"
                    {...register(`votes.${role}`)}
                    value={candidate.id}
                  />
                  <span className="font-medium">{candidate.user.name}</span>
                </label>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 데스크톱: 기존 레이아웃 */}
      <div className="hidden md:block">
        {/* 기존 코드 */}
      </div>
    </div>
  );
}

export default function VotePage() {
  return (
    <ErrorBoundary>
      <VotePageContent />
    </ErrorBoundary>
  );
}
```

---

## 마무리

위 가이드를 참고하여 점진적으로 UX를 개선하시기 바랍니다.
특히 Toast 알림과 Error Boundary는 즉시 적용하는 것을 강력히 권장합니다.
