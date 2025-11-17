'use client';

import { useAuth } from '@/lib/auth/auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function HomePage() {
  const { user, logout } = useAuth();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">환영합니다!</h1>
        <Button variant="outline" onClick={logout}>
          로그아웃
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>사용자 정보</CardTitle>
          <CardDescription>현재 로그인한 사용자의 정보입니다.</CardDescription>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-2 gap-4">
            <div>
              <dt className="text-sm font-medium text-gray-500">이름</dt>
              <dd className="mt-1 text-sm text-gray-900">{user?.name}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">이메일</dt>
              <dd className="mt-1 text-sm text-gray-900">{user?.email}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">사번</dt>
              <dd className="mt-1 text-sm text-gray-900">{user?.employeeNo}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">역할</dt>
              <dd className="mt-1 text-sm text-gray-900">{user?.role}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">부서</dt>
              <dd className="mt-1 text-sm text-gray-900">{user?.department || '-'}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">직급</dt>
              <dd className="mt-1 text-sm text-gray-900">{user?.position || '-'}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>선거 목록</CardTitle>
          <CardDescription>진행 중인 선거가 없습니다.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500">F2 단계에서 선거 목록 기능이 추가될 예정입니다.</p>
        </CardContent>
      </Card>
    </div>
  );
}
