'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { getElection } from '@/lib/api/elections';
import { apiClient } from '@/lib/api/client';
import { Election } from '@/types/election';
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
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { getErrorMessage } from '@/lib/api/client';
import { ArrowLeft, Send, Loader2, Mail } from 'lucide-react';

const notificationSchema = z.object({
  subject: z.string().min(1, '제목을 입력하세요.'),
  body: z.string().min(1, '내용을 입력하세요.'),
  recipientType: z.enum(['ALL', 'CANDIDATES', 'VOTERS', 'NON_VOTERS']),
});

type NotificationFormData = z.infer<typeof notificationSchema>;

const recipientTypeOptions = [
  { value: 'ALL', label: '전체 회원' },
  { value: 'CANDIDATES', label: '후보자만' },
  { value: 'VOTERS', label: '투표 참여자만' },
  { value: 'NON_VOTERS', label: '미투표자만' },
];

export default function AdminNotificationsPage() {
  const params = useParams();
  const router = useRouter();
  const electionId = params.id as string;

  const [election, setElection] = useState<Election | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const form = useForm<NotificationFormData>({
    resolver: zodResolver(notificationSchema),
    defaultValues: {
      recipientType: 'ALL',
    },
  });

  useEffect(() => {
    loadElection();
  }, [electionId]);

  const loadElection = async () => {
    try {
      setIsLoading(true);
      const data = await getElection(electionId);
      setElection(data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = async (data: NotificationFormData) => {
    if (
      !confirm(
        `"${recipientTypeOptions.find((o) => o.value === data.recipientType)?.label}" 대상으로 알림을 발송하시겠습니까?`
      )
    ) {
      return;
    }

    try {
      setIsSending(true);
      setError(null);

      await apiClient.post(`/elections/${electionId}/notifications`, {
        subject: data.subject,
        body: data.body,
        recipientType: data.recipientType,
      });

      setSuccess(true);
      form.reset({
        subject: '',
        body: '',
        recipientType: 'ALL',
      });
      setTimeout(() => setSuccess(false), 5000);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsSending(false);
    }
  };

  // 미리 정의된 템플릿 적용
  const applyTemplate = (templateType: string) => {
    switch (templateType) {
      case 'RECOMMEND_START':
        form.setValue('subject', `[${election?.name}] 추천 기간이 시작되었습니다`);
        form.setValue(
          'body',
          `안녕하세요,\n\n${election?.name}의 추천 기간이 시작되었습니다.\n\n추천 기간: ${new Date(election?.recommendationStartDate || '').toLocaleDateString()} ~ ${new Date(election?.recommendationEndDate || '').toLocaleDateString()}\n\n임원 후보를 추천해주세요!\n\n감사합니다.`
        );
        break;
      case 'VOTING_START':
        form.setValue('subject', `[${election?.name}] 투표가 시작되었습니다`);
        form.setValue(
          'body',
          `안녕하세요,\n\n${election?.name}의 투표가 시작되었습니다.\n\n투표 기간: ${new Date(election?.votingStartDate || '').toLocaleDateString()} ~ ${new Date(election?.votingEndDate || '').toLocaleDateString()}\n\n소중한 한 표를 행사해주세요!\n\n감사합니다.`
        );
        break;
      case 'VOTING_REMINDER':
        form.setValue('subject', `[${election?.name}] 투표 마감이 임박했습니다`);
        form.setValue(
          'body',
          `안녕하세요,\n\n${election?.name}의 투표 마감이 얼마 남지 않았습니다.\n\n아직 투표하지 않으신 분들은 서둘러 투표해주세요.\n\n투표 마감: ${new Date(election?.votingEndDate || '').toLocaleDateString()}\n\n감사합니다.`
        );
        form.setValue('recipientType', 'NON_VOTERS');
        break;
      case 'RESULTS_ANNOUNCED':
        form.setValue('subject', `[${election?.name}] 선거 결과가 발표되었습니다`);
        form.setValue(
          'body',
          `안녕하세요,\n\n${election?.name}의 선거 결과가 발표되었습니다.\n\n결과 확인: [결과 페이지 링크]\n\n많은 참여 감사드립니다.\n\n감사합니다.`
        );
        break;
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
        <Button
          variant="outline"
          onClick={() => router.push(`/admin/elections/${electionId}`)}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          선거 상세로 돌아가기
        </Button>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold">{election.name}</h1>
            <p className="text-gray-600 mt-1">알림 발송</p>
          </div>
          <Mail className="h-8 w-8 text-blue-500" />
        </div>
      </div>

      {success && (
        <Alert>
          <AlertDescription>알림이 성공적으로 발송되었습니다.</AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* 템플릿 선택 */}
      <Card>
        <CardHeader>
          <CardTitle>알림 템플릿</CardTitle>
          <CardDescription>
            미리 정의된 템플릿을 사용하여 빠르게 알림을 작성할 수 있습니다.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-3">
            <Button
              variant="outline"
              onClick={() => applyTemplate('RECOMMEND_START')}
              disabled={isSending}
            >
              추천 시작 알림
            </Button>
            <Button
              variant="outline"
              onClick={() => applyTemplate('VOTING_START')}
              disabled={isSending}
            >
              투표 시작 알림
            </Button>
            <Button
              variant="outline"
              onClick={() => applyTemplate('VOTING_REMINDER')}
              disabled={isSending}
            >
              투표 독려 알림
            </Button>
            <Button
              variant="outline"
              onClick={() => applyTemplate('RESULTS_ANNOUNCED')}
              disabled={isSending}
            >
              결과 발표 알림
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 알림 작성 폼 */}
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <Card>
          <CardHeader>
            <CardTitle>알림 작성</CardTitle>
            <CardDescription>
              선거 관련 알림을 회원들에게 발송합니다.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* 수신자 선택 */}
            <div className="space-y-2">
              <Label htmlFor="recipientType">수신 대상 *</Label>
              <select
                id="recipientType"
                {...form.register('recipientType')}
                className="w-full px-3 py-2 border rounded-md"
                disabled={isSending}
              >
                {recipientTypeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              {form.formState.errors.recipientType && (
                <p className="text-sm text-red-500">
                  {form.formState.errors.recipientType.message}
                </p>
              )}
            </div>

            {/* 제목 */}
            <div className="space-y-2">
              <Label htmlFor="subject">제목 *</Label>
              <Input
                id="subject"
                {...form.register('subject')}
                placeholder="알림 제목을 입력하세요"
                disabled={isSending}
              />
              {form.formState.errors.subject && (
                <p className="text-sm text-red-500">
                  {form.formState.errors.subject.message}
                </p>
              )}
            </div>

            {/* 내용 */}
            <div className="space-y-2">
              <Label htmlFor="body">내용 *</Label>
              <textarea
                id="body"
                {...form.register('body')}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                rows={10}
                placeholder="알림 내용을 입력하세요"
                disabled={isSending}
              />
              {form.formState.errors.body && (
                <p className="text-sm text-red-500">
                  {form.formState.errors.body.message}
                </p>
              )}
            </div>

            <Button type="submit" disabled={isSending}>
              {isSending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  발송 중...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  알림 발송
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </form>

      {/* 알림 발송 안내 */}
      <Alert>
        <AlertDescription>
          <strong>알림 발송 주의사항:</strong>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>발송된 알림은 취소할 수 없습니다.</li>
            <li>대량 발송 시 시간이 소요될 수 있습니다.</li>
            <li>수신자의 이메일 설정에 따라 수신되지 않을 수 있습니다.</li>
          </ul>
        </AlertDescription>
      </Alert>
    </div>
  );
}
