'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { getElection, createRecommendation } from '@/lib/api/elections';
import { getUsers } from '@/lib/api/users';
import { Election, ElectionRole } from '@/types/election';
import { User } from '@/types/auth';
import { useAuth } from '@/lib/auth/auth-context';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { getErrorMessage } from '@/lib/api/client';
import { getRoleText } from '@/lib/utils/election';
import { ArrowLeft, CheckCircle2, Loader2, Search } from 'lucide-react';

const recommendSchema = z.object({
  presidentId: z.string().min(1, '회장 후보를 선택해주세요.'),
  presidentReason: z.string().optional(),
  treasurerId: z.string().min(1, '총무 후보를 선택해주세요.'),
  treasurerReason: z.string().optional(),
});

type RecommendFormData = z.infer<typeof recommendSchema>;

export default function RecommendPage() {
  const params = useParams();
  const router = useRouter();
  const { user: currentUser } = useAuth();
  const electionId = params.id as string;

  const [election, setElection] = useState<Election | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const form = useForm<RecommendFormData>({
    resolver: zodResolver(recommendSchema),
    defaultValues: {
      presidentId: '',
      presidentReason: '',
      treasurerId: '',
      treasurerReason: '',
    },
  });

  useEffect(() => {
    loadData();
  }, [electionId]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [electionData, usersData] = await Promise.all([
        getElection(electionId),
        getUsers({ limit: 100 }),
      ]);
      setElection(electionData);
      setUsers(usersData.items.filter((u) => u.isActive && u.id !== currentUser?.id));
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = async (data: RecommendFormData) => {
    if (!election) return;

    try {
      setIsSubmitting(true);
      setError(null);

      // 회장 추천
      await createRecommendation(electionId, {
        forRole: ElectionRole.PRESIDENT,
        candidateUserId: data.presidentId,
        reason: data.presidentReason,
      });

      // 총무 추천
      await createRecommendation(electionId, {
        forRole: ElectionRole.TREASURER,
        candidateUserId: data.treasurerId,
        reason: data.treasurerReason,
      });

      setSuccess(true);
      setTimeout(() => {
        router.push(`/elections/${electionId}`);
      }, 2000);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.employeeNo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-3/4" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-32 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!election) {
    return (
      <Alert variant="destructive">
        <AlertDescription>선거를 찾을 수 없습니다.</AlertDescription>
      </Alert>
    );
  }

  if (success) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="py-12 text-center">
            <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">추천 완료!</h2>
            <p className="text-gray-600">
              후보 추천이 성공적으로 제출되었습니다.
              <br />
              잠시 후 선거 상세 페이지로 이동합니다.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div>
        <Button variant="outline" onClick={() => router.back()} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          돌아가기
        </Button>
        <h1 className="text-3xl font-bold">후보 추천</h1>
        <p className="text-gray-600 mt-1">{election.name}</p>
      </div>

      {/* 안내 메시지 */}
      <Alert>
        <AlertDescription>
          회장과 총무 각 1명씩 추천할 수 있습니다. 본인을 제외한 활성화된 회원 중에서
          선택해주세요.
        </AlertDescription>
      </Alert>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* 검색 */}
      <Card>
        <CardHeader>
          <CardTitle>후보자 검색</CardTitle>
          <CardDescription>이름, 이메일, 사번으로 검색할 수 있습니다.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* 추천 폼 */}
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* 회장 추천 */}
        <Card>
          <CardHeader>
            <CardTitle>{getRoleText(ElectionRole.PRESIDENT)} 추천</CardTitle>
            <CardDescription>회장 후보를 선택하고 추천 이유를 작성하세요.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="presidentId">후보자 *</Label>
              <select
                id="presidentId"
                {...form.register('presidentId')}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                disabled={isSubmitting}
              >
                <option value="">선택해주세요</option>
                {filteredUsers.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.employeeNo}) - {u.department || '부서 없음'} / {u.position || '직급 없음'}
                  </option>
                ))}
              </select>
              {form.formState.errors.presidentId && (
                <p className="text-sm text-red-500">
                  {form.formState.errors.presidentId.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="presidentReason">추천 이유 (선택)</Label>
              <textarea
                id="presidentReason"
                {...form.register('presidentReason')}
                placeholder="추천 이유를 입력하세요..."
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[100px]"
                disabled={isSubmitting}
              />
            </div>
          </CardContent>
        </Card>

        {/* 총무 추천 */}
        <Card>
          <CardHeader>
            <CardTitle>{getRoleText(ElectionRole.TREASURER)} 추천</CardTitle>
            <CardDescription>총무 후보를 선택하고 추천 이유를 작성하세요.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="treasurerId">후보자 *</Label>
              <select
                id="treasurerId"
                {...form.register('treasurerId')}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                disabled={isSubmitting}
              >
                <option value="">선택해주세요</option>
                {filteredUsers.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.employeeNo}) - {u.department || '부서 없음'} / {u.position || '직급 없음'}
                  </option>
                ))}
              </select>
              {form.formState.errors.treasurerId && (
                <p className="text-sm text-red-500">
                  {form.formState.errors.treasurerId.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="treasurerReason">추천 이유 (선택)</Label>
              <textarea
                id="treasurerReason"
                {...form.register('treasurerReason')}
                placeholder="추천 이유를 입력하세요..."
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[100px]"
                disabled={isSubmitting}
              />
            </div>
          </CardContent>
        </Card>

        {/* 제출 버튼 */}
        <div className="flex gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            className="flex-1"
            disabled={isSubmitting}
          >
            취소
          </Button>
          <Button type="submit" className="flex-1" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                제출 중...
              </>
            ) : (
              '추천 제출'
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
