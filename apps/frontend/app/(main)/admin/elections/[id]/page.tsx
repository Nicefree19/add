'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { getElection } from '@/lib/api/elections';
import { apiClient } from '@/lib/api/client';
import { Election, ElectionStatus } from '@/types/election';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { getErrorMessage } from '@/lib/api/client';
import {
  getElectionStatusText,
  getElectionStatusVariant,
} from '@/lib/utils/election';
import { ArrowLeft, Loader2, Save } from 'lucide-react';
import Link from 'next/link';

const electionSchema = z.object({
  name: z.string().min(1, '선거명을 입력하세요.'),
  description: z.string().optional(),
  recommendationStartDate: z.string(),
  recommendationEndDate: z.string(),
  votingStartDate: z.string(),
  votingEndDate: z.string(),
  maxRecommendations: z.number().min(1),
});

type ElectionFormData = z.infer<typeof electionSchema>;

export default function AdminElectionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const electionId = params.id as string;

  const [election, setElection] = useState<Election | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isChangingStatus, setIsChangingStatus] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const form = useForm<ElectionFormData>({
    resolver: zodResolver(electionSchema),
  });

  useEffect(() => {
    loadElection();
  }, [electionId]);

  const loadElection = async () => {
    try {
      setIsLoading(true);
      const data = await getElection(electionId);
      setElection(data);

      // 폼 초기화
      form.reset({
        name: data.name,
        description: data.description || '',
        recommendationStartDate: data.recommendationStartDate.slice(0, 16),
        recommendationEndDate: data.recommendationEndDate.slice(0, 16),
        votingStartDate: data.votingStartDate.slice(0, 16),
        votingEndDate: data.votingEndDate.slice(0, 16),
        maxRecommendations: data.maxRecommendations,
      });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

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

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
      await loadElection();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsSaving(false);
    }
  };

  const handleStatusChange = async (newStatus: ElectionStatus) => {
    if (!confirm(`선거 상태를 "${getElectionStatusText(newStatus)}"(으)로 변경하시겠습니까?`)) {
      return;
    }

    try {
      setIsChangingStatus(true);
      setError(null);

      await apiClient.patch(`/elections/${electionId}/status`, {
        status: newStatus,
      });

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
      await loadElection();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsChangingStatus(false);
    }
  };

  if (isLoading) {
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

  if (!election) {
    return (
      <Alert variant="destructive">
        <AlertDescription>선거를 찾을 수 없습니다.</AlertDescription>
      </Alert>
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
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold">{election.name}</h1>
            <p className="text-gray-600 mt-1">선거 상세 정보 및 수정</p>
          </div>
          <Badge variant={getElectionStatusVariant(election.status)}>
            {getElectionStatusText(election.status)}
          </Badge>
        </div>
      </div>

      {/* 빠른 링크 */}
      <div className="grid grid-cols-5 gap-4">
        <Link href={`/admin/elections/${electionId}/recommendations`}>
          <Button variant="outline" className="w-full">추천 현황</Button>
        </Link>
        <Link href={`/admin/elections/${electionId}/candidates`}>
          <Button variant="outline" className="w-full">후보 관리</Button>
        </Link>
        <Link href={`/admin/elections/${electionId}/votes`}>
          <Button variant="outline" className="w-full">투표 현황</Button>
        </Link>
        <Link href={`/admin/elections/${electionId}/notifications`}>
          <Button variant="outline" className="w-full">알림 발송</Button>
        </Link>
        <Link href={`/admin/elections/${electionId}/transition`}>
          <Button variant="outline" className="w-full">이양 문서</Button>
        </Link>
      </div>

      {success && (
        <Alert>
          <AlertDescription>저장되었습니다.</AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* 상태 변경 */}
      <Card>
        <CardHeader>
          <CardTitle>선거 상태 변경</CardTitle>
          <CardDescription>
            선거 단계를 변경합니다. (PLANNING → RECOMMEND → CANDIDATE_CONFIRM → VOTING → CLOSED)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {Object.values(ElectionStatus).map((status) => (
              <Button
                key={status}
                onClick={() => handleStatusChange(status)}
                variant={election.status === status ? 'default' : 'outline'}
                disabled={isChangingStatus || election.status === status}
              >
                {getElectionStatusText(status)}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 선거 정보 수정 */}
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <Card>
          <CardHeader>
            <CardTitle>선거 정보 수정</CardTitle>
            <CardDescription>선거의 기본 정보를 수정합니다.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">선거명 *</Label>
              <Input
                id="name"
                {...form.register('name')}
                disabled={isSaving}
              />
              {form.formState.errors.name && (
                <p className="text-sm text-red-500">
                  {form.formState.errors.name.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">설명</Label>
              <textarea
                id="description"
                {...form.register('description')}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                rows={3}
                disabled={isSaving}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="recommendationStartDate">추천 시작일 *</Label>
                <Input
                  id="recommendationStartDate"
                  type="datetime-local"
                  {...form.register('recommendationStartDate')}
                  disabled={isSaving}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="recommendationEndDate">추천 종료일 *</Label>
                <Input
                  id="recommendationEndDate"
                  type="datetime-local"
                  {...form.register('recommendationEndDate')}
                  disabled={isSaving}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="votingStartDate">투표 시작일 *</Label>
                <Input
                  id="votingStartDate"
                  type="datetime-local"
                  {...form.register('votingStartDate')}
                  disabled={isSaving}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="votingEndDate">투표 종료일 *</Label>
                <Input
                  id="votingEndDate"
                  type="datetime-local"
                  {...form.register('votingEndDate')}
                  disabled={isSaving}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="maxRecommendations">최대 추천 수 *</Label>
              <Input
                id="maxRecommendations"
                type="number"
                {...form.register('maxRecommendations', { valueAsNumber: true })}
                disabled={isSaving}
              />
            </div>

            <Button type="submit" disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  저장 중...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  저장
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
