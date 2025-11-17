'use client';

import { useAuth } from '@/lib/auth/auth-context';
import { UserRole } from '@/types/auth';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { ShieldAlert } from 'lucide-react';

interface AdminGuardProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

/**
 * 관리자 권한 체크 컴포넌트
 *
 * @param allowedRoles - 허용할 역할 목록 (기본값: [ADMIN])
 */
export function AdminGuard({
  children,
  allowedRoles = [UserRole.ADMIN]
}: AdminGuardProps) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-gray-500">권한 확인 중...</p>
      </div>
    );
  }

  if (!user || !allowedRoles.includes(user.role)) {
    return (
      <div className="max-w-2xl mx-auto mt-12">
        <Card>
          <CardContent className="py-12 text-center">
            <ShieldAlert className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">접근 권한 없음</h2>
            <p className="text-gray-600 mb-6">
              이 페이지는 관리자만 접근할 수 있습니다.
              <br />
              현재 권한: {user?.role || '없음'}
            </p>
            <Button onClick={() => router.push('/')} variant="outline">
              홈으로 돌아가기
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}
