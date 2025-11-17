'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getElections } from '@/lib/api/elections';
import { Election, ElectionStatus } from '@/types/election';
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
import {
  getElectionStatusText,
  getElectionStatusVariant,
  formatDate
} from '@/lib/utils/election';
import { Vote, Users, TrendingUp, Calendar } from 'lucide-react';

export default function AdminDashboardPage() {
  const router = useRouter();
  const [elections, setElections] = useState<Election[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const data = await getElections({ limit: 10 });
      setElections(data.items);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  // 통계 계산
  const stats = {
    total: elections.length,
    active: elections.filter((e) => e.status !== ElectionStatus.CLOSED).length,
    voting: elections.filter((e) => e.status === ElectionStatus.VOTING).length,
    closed: elections.filter((e) => e.status === ElectionStatus.CLOSED).length,
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">관리자 대시보드</h1>
          <p className="text-gray-600 mt-1">선거 관리 시스템 개요</p>
        </div>
        <Button onClick={() => router.push('/admin/elections/new')}>
          새 선거 만들기
        </Button>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">총 선거 수</p>
                <p className="text-3xl font-bold mt-2">{stats.total}</p>
              </div>
              <Vote className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">진행 중</p>
                <p className="text-3xl font-bold mt-2">{stats.active}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">투표 중</p>
                <p className="text-3xl font-bold mt-2">{stats.voting}</p>
              </div>
              <Users className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">종료</p>
                <p className="text-3xl font-bold mt-2">{stats.closed}</p>
              </div>
              <Calendar className="h-8 w-8 text-gray-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* 최근 선거 목록 */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>최근 선거</CardTitle>
              <CardDescription>최근 생성된 선거 목록입니다.</CardDescription>
            </div>
            <Button variant="outline" onClick={() => router.push('/admin/elections')}>
              전체 보기
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : elections.length === 0 ? (
            <p className="text-center text-gray-500 py-8">선거가 없습니다.</p>
          ) : (
            <div className="space-y-2">
              {elections.map((election) => (
                <div
                  key={election.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => router.push(`/admin/elections/${election.id}`)}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold">{election.name}</h3>
                      <Badge variant={getElectionStatusVariant(election.status)}>
                        {getElectionStatusText(election.status)}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      투표: {formatDate(election.votingStartDate)} ~ {formatDate(election.votingEndDate)}
                    </p>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <div className="text-center">
                      <div className="text-gray-600">후보</div>
                      <div className="font-semibold">{election.candidateCount || 0}명</div>
                    </div>
                    <div className="text-center">
                      <div className="text-gray-600">투표</div>
                      <div className="font-semibold">{election.voteCount || 0}명</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
