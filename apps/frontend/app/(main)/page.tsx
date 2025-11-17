'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth/auth-context';
import { getElections } from '@/lib/api/elections';
import { Election, ElectionStatus } from '@/types/election';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  getElectionStatusText,
  getElectionStatusVariant,
  formatDate,
  getCurrentPhase,
} from '@/lib/utils/election';
import { getErrorMessage } from '@/lib/api/client';
import { useRouter } from 'next/navigation';
import { Calendar, Users, Vote, Trophy } from 'lucide-react';

export default function HomePage() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [elections, setElections] = useState<Election[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadElections();
  }, []);

  const loadElections = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await getElections({ limit: 20 });
      setElections(data.items);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  // 진행 중인 선거와 종료된 선거 분류
  const activeElections = elections.filter(
    (e) => e.status !== ElectionStatus.CLOSED
  );
  const closedElections = elections.filter(
    (e) => e.status === ElectionStatus.CLOSED
  );

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">선거 관리 시스템</h1>
          <p className="text-gray-600 mt-1">사우회 임원 선거</p>
        </div>
        <Button variant="outline" onClick={logout}>
          로그아웃
        </Button>
      </div>

      {/* 사용자 정보 카드 */}
      <Card>
        <CardHeader>
          <CardTitle>환영합니다, {user?.name}님!</CardTitle>
          <CardDescription>
            {user?.department && user?.position
              ? `${user.department} · ${user.position}`
              : user?.email}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">{user?.role}</Badge>
            <span className="text-sm text-gray-500">
              사번: {user?.employeeNo}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* 에러 메시지 */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* 진행 중인 선거 */}
      <section>
        <h2 className="text-2xl font-bold mb-4">진행 중인 선거</h2>

        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2">
            {[1, 2].map((i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-20 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : activeElections.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-gray-500">현재 진행 중인 선거가 없습니다.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {activeElections.map((election) => (
              <ElectionCard
                key={election.id}
                election={election}
                onViewDetails={() => router.push(`/elections/${election.id}`)}
              />
            ))}
          </div>
        )}
      </section>

      {/* 종료된 선거 */}
      {closedElections.length > 0 && (
        <section>
          <h2 className="text-2xl font-bold mb-4">종료된 선거</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {closedElections.map((election) => (
              <ElectionCard
                key={election.id}
                election={election}
                onViewDetails={() => router.push(`/elections/${election.id}`)}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

/**
 * 선거 카드 컴포넌트
 */
function ElectionCard({
  election,
  onViewDetails,
}: {
  election: Election;
  onViewDetails: () => void;
}) {
  const phase = getCurrentPhase(election);

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg">{election.name}</CardTitle>
            <CardDescription className="mt-1">
              {election.description || '선거 설명 없음'}
            </CardDescription>
          </div>
          <Badge variant={getElectionStatusVariant(election.status)}>
            {getElectionStatusText(election.status)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 일정 정보 */}
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2 text-gray-600">
            <Calendar className="h-4 w-4" />
            <span>추천: {formatDate(election.recommendationStartDate)}</span>
            <span>~</span>
            <span>{formatDate(election.recommendationEndDate)}</span>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <Vote className="h-4 w-4" />
            <span>투표: {formatDate(election.votingStartDate)}</span>
            <span>~</span>
            <span>{formatDate(election.votingEndDate)}</span>
          </div>
        </div>

        {/* 통계 */}
        <div className="flex gap-4 text-sm">
          {election.candidateCount !== undefined && (
            <div className="flex items-center gap-1">
              <Users className="h-4 w-4 text-gray-500" />
              <span className="text-gray-600">
                후보 {election.candidateCount}명
              </span>
            </div>
          )}
          {election.voteCount !== undefined && (
            <div className="flex items-center gap-1">
              <Trophy className="h-4 w-4 text-gray-500" />
              <span className="text-gray-600">
                투표 {election.voteCount}명
              </span>
            </div>
          )}
        </div>

        {/* 현재 단계 안내 */}
        {phase === 'before' && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-800">
              추천 시작 전입니다. {formatDate(election.recommendationStartDate)}
              부터 후보 추천이 시작됩니다.
            </p>
          </div>
        )}
        {phase === 'recommend' && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <p className="text-sm text-green-800">
              후보 추천 기간입니다. 임원 후보를 추천해주세요!
            </p>
          </div>
        )}
        {phase === 'wait' && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <p className="text-sm text-yellow-800">
              후보 확정 중입니다. 투표는 {formatDate(election.votingStartDate)}
              부터 시작됩니다.
            </p>
          </div>
        )}
        {phase === 'voting' && (
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
            <p className="text-sm text-purple-800">
              투표 진행 중입니다. 지금 바로 투표하세요!
            </p>
          </div>
        )}

        {/* 액션 버튼 */}
        <Button onClick={onViewDetails} className="w-full">
          상세 보기
        </Button>
      </CardContent>
    </Card>
  );
}
