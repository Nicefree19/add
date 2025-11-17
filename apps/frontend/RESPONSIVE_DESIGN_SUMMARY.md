# 반응형 디자인 개선 사항 요약

## F4 단계에서 적용된 반응형 개선

### 1. Admin Layout (✅ 적용 완료)
**파일:** `apps/frontend/app/(main)/admin/layout.tsx`

#### 개선 내용:
- **모바일 (< 1024px):** 상단에 드롭다운 네비게이션 표시
- **데스크톱 (≥ 1024px):** 왼쪽 사이드바 표시
- 메인 컨텐츠 영역에 `min-w-0` 추가로 overflow 방지

#### Before:
```tsx
<div className="flex gap-6">
  <aside className="w-64 ...">
    {/* 사이드바 */}
  </aside>
  <main className="flex-1">
    {children}
  </main>
</div>
```

#### After:
```tsx
<div className="flex flex-col lg:flex-row gap-6">
  {/* 모바일: 드롭다운 */}
  <nav className="lg:hidden ...">
    <select ...>
      {navItems.map(...)}
    </select>
  </nav>

  {/* 데스크톱: 사이드바 */}
  <aside className="hidden lg:block w-64 ...">
    {/* 사이드바 */}
  </aside>

  <main className="flex-1 min-w-0">
    {children}
  </main>
</div>
```

---

## 추가 개선 권장 사항

### 2. Dashboard 통계 카드
**적용 대상:**
- `app/(main)/admin/page.tsx`
- `app/(main)/admin/logs/page.tsx`

#### 현재:
```tsx
<div className="grid grid-cols-4 gap-4">
```

#### 권장:
```tsx
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
```

---

### 3. Election Detail - Quick Links
**적용 대상:** `app/(main)/admin/elections/[id]/page.tsx`

#### 현재:
```tsx
<div className="grid grid-cols-5 gap-4">
  <Link href={...}>
    <Button variant="outline" className="w-full">추천 현황</Button>
  </Link>
  {/* 5개 버튼 */}
</div>
```

#### 권장:
```tsx
<div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
  <Link href={...}>
    <Button variant="outline" className="w-full text-sm">
      추천 현황
    </Button>
  </Link>
  {/* 5개 버튼 */}
</div>
```

---

### 4. 테이블 → 모바일 카드 변환
**적용 대상:**
- `app/(main)/admin/elections/[id]/candidates/page.tsx`
- `app/(main)/admin/elections/[id]/recommendations/page.tsx`
- `app/(main)/admin/logs/page.tsx`

#### 패턴:
```tsx
{/* 데스크톱: 테이블 */}
<div className="hidden md:block overflow-x-auto">
  <table className="w-full">
    {/* 기존 테이블 */}
  </table>
</div>

{/* 모바일: 카드 */}
<div className="md:hidden space-y-3">
  {items.map((item) => (
    <Card key={item.id}>
      <CardContent className="pt-6 space-y-2">
        <div className="flex justify-between">
          <span className="text-sm text-gray-600">이름</span>
          <span className="font-medium">{item.name}</span>
        </div>
        {/* 다른 필드들 */}
      </CardContent>
    </Card>
  ))}
</div>
```

---

### 5. Votes Visualization - 차트 반응형
**적용 대상:** `app/(main)/admin/elections/[id]/votes/page.tsx`

#### 현재:
```tsx
<div className="grid grid-cols-2 gap-6">
  <div>{/* 파이 차트 */}</div>
  <div>{/* 테이블 */}</div>
</div>
```

#### 권장:
```tsx
<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
  <div>{/* 파이 차트 */}</div>
  <div>{/* 테이블 */}</div>
</div>
```

---

### 6. 필터 섹션
**적용 대상:** `app/(main)/admin/logs/page.tsx`

#### 현재:
```tsx
<div className="grid grid-cols-5 gap-4">
```

#### 권장:
```tsx
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
```

---

### 7. Member 페이지 - 후보 리스트
**적용 대상:** `app/(main)/elections/[id]/candidates/page.tsx`

#### 개선 예시:
```tsx
{/* 현재: 그리드 고정 */}
<div className="grid grid-cols-2 gap-4">

{/* 개선: 반응형 그리드 */}
<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
```

---

### 8. 투표 페이지
**적용 대상:** `app/(main)/elections/[id]/vote/page.tsx`

#### 개선 전략:
- 작은 화면에서는 각 역할별로 아코디언 형태
- 또는 세로로 스택된 카드 형태

```tsx
{candidatesByRole.map(({ role, candidates }) => (
  <div key={role} className="space-y-3">
    <h3 className="text-lg font-semibold">{getRoleText(role)}</h3>
    <div className="space-y-2">
      {candidates.map((candidate) => (
        <label
          key={candidate.id}
          className="flex items-start gap-3 p-4 border rounded-lg cursor-pointer hover:bg-gray-50"
        >
          <input type="radio" {...} />
          <div className="flex-1 min-w-0">
            <p className="font-medium">{candidate.user.name}</p>
            <p className="text-sm text-gray-600 truncate">
              {candidate.user.department}
            </p>
          </div>
        </label>
      ))}
    </div>
  </div>
))}
```

---

## Breakpoint 참조

Tailwind CSS 기본 breakpoints:
- `sm`: 640px
- `md`: 768px
- `lg`: 1024px
- `xl`: 1280px
- `2xl`: 1536px

### 권장 사용 패턴:
- **모바일 우선:** 기본 스타일을 모바일용으로 작성
- **태블릿:** `md:` prefix 사용
- **데스크톱:** `lg:` prefix 사용

---

## 테스트 가이드

### Chrome DevTools로 테스트:
1. F12 → 디바이스 툴바 활성화 (Ctrl+Shift+M)
2. 다음 해상도로 테스트:
   - **Mobile S:** 320px
   - **Mobile M:** 375px
   - **Mobile L:** 425px
   - **Tablet:** 768px
   - **Laptop:** 1024px
   - **Desktop:** 1440px

### 확인 사항:
- [ ] 텍스트가 잘리지 않는가?
- [ ] 버튼이 화면 밖으로 나가지 않는가?
- [ ] 테이블이 가독성 있게 표시되는가?
- [ ] 이미지/차트가 적절한 크기인가?
- [ ] 터치 타겟이 충분히 큰가? (최소 44x44px)

---

## 우선순위

### P0 (즉시 적용)
1. ✅ Admin Layout - 모바일 네비게이션
2. Dashboard 통계 카드 (admin, logs)
3. Election Detail - Quick Links

### P1 (1주일 내)
4. 테이블 → 카드 변환 (logs, candidates, recommendations)
5. 필터 섹션 반응형
6. Votes 차트 반응형

### P2 (점진적)
7. Member 페이지들
8. 세부 페이지들

---

## 참고자료

- [Tailwind Responsive Design](https://tailwindcss.com/docs/responsive-design)
- [MDN: Responsive Web Design](https://developer.mozilla.org/ko/docs/Learn/CSS/CSS_layout/Responsive_Design)
- [Web.dev: Responsive Web Design Basics](https://web.dev/responsive-web-design-basics/)
