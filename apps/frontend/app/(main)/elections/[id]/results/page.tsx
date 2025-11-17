'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getElection, getResultSummary } from '@/lib/api/elections';
import { Election, ResultSummaryResponse, ElectionStatus } from '@/types/election';
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
import { getErrorMessage } from '@/lib/api/client';
import { getRoleText } from '@/lib/utils/election';
import { ArrowLeft, Trophy, Users, TrendingUp, Award } from 'lucide-react';

export default function ResultsPage() {
  const params = useParams();
  const router = useRouter();
  const electionId = params.id as string;

  const [election, setElection] = useState<Election | null>(null);
  const [results, setResults] = useState<ResultSummaryResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [electionId]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const [electionData, resultsData] = await Promise.all([
        getElection(electionId),
        getResultSummary(electionId),
      ]);

      setElection(electionData);
      setResults(resultsData);
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
            <Skeleton className="h-6 w-32" />
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

  // 결과가 아직 없는 경우
  if (!results || election.status !== ElectionStatus.CLOSED) {
    return (
      <div className="space-y-6">
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          돌아가기
        </Button>
        <Card>
          <CardContent className="py-12 text-center">
            <TrendingUp className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">집계 중</h2>
            <p className="text-gray-600">
              선거가 종료된 후 결과를 확인할 수 있습니다.
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
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold">선거 결과</h1>
            <p className="text-gray-600 mt-1">{election.name}</p>
          </div>
          <Badge variant="default">종료</Badge>
        </div>
      </div>

      {/* 투표 참여 현황 */}
      <Card>
        <CardHeader>
          <CardTitle>투표 참여 현황</CardTitle>
          <CardDescription>전체 유권자 대비 투표 참여율입니다.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">
                {results.totalVoters}명
              </div>
              <div className="text-sm text-gray-600 mt-1">전체 유권자</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">
                {results.totalVotes}명
              </div>
              <div className="text-sm text-gray-600 mt-1">투표 참여</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600">
                {results.turnoutRate.toFixed(1)}%
              </div>
              <div className="text-sm text-gray-600 mt-1">투표율</div>
            </div>
          </div>

          {/* 투표율 바 */}
          <div className="mt-6">
            <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
              <div
                className="bg-gradient-to-r from-blue-500 to-purple-600 h-full transition-all duration-500"
                style={{ width: `${results.turnoutRate}%` }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 당선자 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            당선자
          </CardTitle>
          <CardDescription>각 역할별 당선자입니다.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {results.results.map((result) => (
            <div
              key={result.role}
              className="flex items-center justify-between p-4 bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-lg"
            >
              <div className="flex items-center gap-4">
                <div className="flex items-center justify-center w-12 h-12 bg-yellow-100 rounded-full">
                  <Award className="h-6 w-6 text-yellow-600" />
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-600">
                    {getRoleText(result.role)}
                  </div>
                  {result.winner ? (
                    <>
                      <div className="text-xl font-bold">{result.winner.name}</div>
                      <div className="text-sm text-gray-600">
                        {result.winner.department} · {result.winner.position}
                      </div>
                    </>
                  ) : (
                    <div className="text-lg text-gray-500 italic">당선자 없음</div>
                  )}
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-yellow-600">
                  {result.totalVotes}표
                </div>
                <div className="text-sm text-gray-600">득표</div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* 안내 */}
      <Alert>
        <Users className="h-4 w-4" />
        <AlertDescription>
          득표 수 등 상세한 결과는 관리자와 감사만 확인할 수 있습니다.
        </AlertDescription>
      </Alert>
    </div>
  );
}
