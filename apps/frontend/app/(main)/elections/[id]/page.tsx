'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getElection, getVoteStatus } from '@/lib/api/elections';
import { Election } from '@/types/election';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  getElectionStatusText,
  getElectionStatusVariant,
  formatDateTime,
  getCurrentPhase,
  getRoleText,
} from '@/lib/utils/election';
import { getErrorMessage } from '@/lib/api/client';
import {
  Calendar,
  Users,
  Vote,
  CheckCircle2,
  ArrowLeft,
  Trophy,
} from 'lucide-react';

export default function ElectionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const electionId = params.id as string;

  const [election, setElection] = useState<Election | null>(null);
  const [voteStatus, setVoteStatus] = useState<{
    hasVoted: boolean;
    votedRoles: string[];
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadElectionData();
  }, [electionId]);

  const loadElectionData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const [electionData, voteStatusData] = await Promise.all([
        getElection(electionId),
        getVoteStatus(electionId).catch(() => ({
          hasVoted: false,
          votedRoles: [],
        })),
      ]);

      setElection(electionData);
      setVoteStatus(voteStatusData);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-32 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !election) {
    return (
      <div className="space-y-6">
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          돌아가기
        </Button>
        <Alert variant="destructive">
          <AlertDescription>{error || '선거를 찾을 수 없습니다.'}</AlertDescription>
        </Alert>
      </div>
    );
  }

  const phase = getCurrentPhase(election);

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
            <p className="text-gray-600 mt-1">{election.description}</p>
          </div>
          <Badge variant={getElectionStatusVariant(election.status)}>
            {getElectionStatusText(election.status)}
          </Badge>
        </div>
      </div>

      {/* 선거 정보 */}
      <Card>
        <CardHeader>
          <CardTitle>선거 일정</CardTitle>
          <CardDescription>각 단계별 일정을 확인하세요.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Calendar className="h-4 w-4" />
                추천 기간
              </div>
              <div className="text-sm text-gray-600 pl-6">
                <div>{formatDateTime(election.recommendationStartDate)}</div>
                <div>~ {formatDateTime(election.recommendationEndDate)}</div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Vote className="h-4 w-4" />
                투표 기간
              </div>
              <div className="text-sm text-gray-600 pl-6">
                <div>{formatDateTime(election.votingStartDate)}</div>
                <div>~ {formatDateTime(election.votingEndDate)}</div>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-gray-500" />
                <span>후보 수</span>
              </div>
              <span className="font-semibold">
                {election.candidateCount || 0}명
              </span>
            </div>
            <div className="flex items-center justify-between text-sm mt-2">
              <div className="flex items-center gap-2">
                <Trophy className="h-4 w-4 text-gray-500" />
                <span>투표 수</span>
              </div>
              <span className="font-semibold">{election.voteCount || 0}명</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 내 참여 현황 */}
      {voteStatus && (
        <Card>
          <CardHeader>
            <CardTitle>내 참여 현황</CardTitle>
            <CardDescription>선거 참여 상태를 확인하세요.</CardDescription>
          </CardHeader>
          <CardContent>
            {voteStatus.hasVoted ? (
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle2 className="h-5 w-5" />
                <span className="font-medium">투표 완료</span>
                <span className="text-sm text-gray-600">
                  (투표한 역할: {voteStatus.votedRoles.map((role) => getRoleText(role as any)).join(', ')})
                </span>
              </div>
            ) : (
              <p className="text-gray-600">아직 투표하지 않았습니다.</p>
            )}
          </CardContent>
        </Card>
      )}

      {/* 액션 버튼 */}
      <Card>
        <CardHeader>
          <CardTitle>선거 참여</CardTitle>
          <CardDescription>
            현재 단계에 맞는 활동에 참여하세요.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {phase === 'before' && (
            <Alert>
              <AlertDescription>
                추천 시작 전입니다. {formatDateTime(election.recommendationStartDate)}
                부터 후보 추천이 시작됩니다.
              </AlertDescription>
            </Alert>
          )}

          {phase === 'recommend' && (
            <Button
              onClick={() => router.push(`/elections/${electionId}/recommend`)}
              className="w-full"
            >
              후보 추천하기
            </Button>
          )}

          {(phase === 'wait' || phase === 'voting' || phase === 'closed') && (
            <Button
              onClick={() => router.push(`/elections/${electionId}/candidates`)}
              variant="outline"
              className="w-full"
            >
              후보 목록 보기
            </Button>
          )}

          {phase === 'voting' && (
            <Button
              onClick={() => router.push(`/elections/${electionId}/vote`)}
              className="w-full"
              disabled={voteStatus?.hasVoted}
            >
              {voteStatus?.hasVoted ? '투표 완료' : '투표하기'}
            </Button>
          )}

          {phase === 'closed' && (
            <Button
              onClick={() => router.push(`/elections/${electionId}/results`)}
              variant="secondary"
              className="w-full"
            >
              결과 보기
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
