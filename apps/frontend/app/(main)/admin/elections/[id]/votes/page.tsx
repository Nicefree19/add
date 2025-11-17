'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getElection, getCandidates, getResultDetail } from '@/lib/api/elections';
import { apiClient } from '@/lib/api/client';
import { Election, Candidate, ElectionRole, CandidateResult } from '@/types/election';
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
import { getRoleText, getElectionStatusText } from '@/lib/utils/election';
import { ArrowLeft, Users, TrendingUp } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

interface VoteStats {
  totalVoters: number;
  totalVotes: number;
  turnoutRate: number;
  votesByRole: {
    role: ElectionRole;
    voteCount: number;
    candidateCount: number;
  }[];
}

interface CandidateVotes {
  candidateId: string;
  candidateName: string;
  role: ElectionRole;
  voteCount: number;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function AdminVotesPage() {
  const params = useParams();
  const router = useRouter();
  const electionId = params.id as string;

  const [election, setElection] = useState<Election | null>(null);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [stats, setStats] = useState<VoteStats | null>(null);
  const [candidateVotes, setCandidateVotes] = useState<CandidateVotes[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [electionId]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [electionData, candidatesData] = await Promise.all([
        getElection(electionId),
        getCandidates(electionId),
      ]);

      setElection(electionData);
      setCandidates(candidatesData);

      // 투표 통계 가져오기
      const statsResponse = await apiClient.get<VoteStats>(
        `/elections/${electionId}/votes/stats`
      );
      setStats(statsResponse.data);

      // 후보별 득표 수 계산
      const resultDetail = await getResultDetail(electionId);
      const votes: CandidateVotes[] = [];

      // resultsByRole에서 모든 후보 결과 추출
      Object.values(ElectionRole).forEach((role) => {
        const roleResults = resultDetail.resultsByRole[role] || [];
        roleResults.forEach((result: CandidateResult) => {
          votes.push({
            candidateId: result.candidateId,
            candidateName: result.name,
            role: result.forRole,
            voteCount: result.voteCount,
          });
        });
      });

      setCandidateVotes(votes);
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
          </CardHeader>
          <CardContent>
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!election || !stats) {
    return (
      <Alert variant="destructive">
        <AlertDescription>데이터를 불러올 수 없습니다.</AlertDescription>
      </Alert>
    );
  }

  // 역할별로 후보 득표 그룹화
  const votesByRole = Object.values(ElectionRole).map((role) => ({
    role,
    candidates: candidateVotes.filter((cv) => cv.role === role),
  }));

  // 전체 득표 차트 데이터 (상위 10명)
  const topCandidatesData = candidateVotes
    .sort((a, b) => b.voteCount - a.voteCount)
    .slice(0, 10)
    .map((cv) => ({
      name: cv.candidateName,
      votes: cv.voteCount,
      role: getRoleText(cv.role),
    }));

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
            <p className="text-gray-600 mt-1">투표 현황 및 통계</p>
          </div>
          <Badge variant="info">{getElectionStatusText(election.status)}</Badge>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* 전체 통계 */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">총 투표자 수</p>
                <p className="text-3xl font-bold mt-2">{stats.totalVoters}</p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">총 투표 수</p>
                <p className="text-3xl font-bold mt-2">{stats.totalVotes}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">투표율</p>
                <p className="text-3xl font-bold mt-2">{stats.turnoutRate.toFixed(1)}%</p>
              </div>
              <div className="h-8 w-8 flex items-center justify-center bg-purple-100 rounded-full">
                <span className="text-purple-600 font-bold">%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 역할별 투표 현황 */}
      <Card>
        <CardHeader>
          <CardTitle>역할별 투표 현황</CardTitle>
          <CardDescription>각 역할별 투표 참여 통계입니다.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            {stats.votesByRole.map((roleStats) => (
              <div key={roleStats.role} className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">
                  {getRoleText(roleStats.role)}
                </p>
                <p className="text-2xl font-bold text-gray-700">
                  {roleStats.voteCount}표
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  후보 수: {roleStats.candidateCount}명
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 전체 득표 Top 10 차트 */}
      {topCandidatesData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>후보별 득표 현황 (상위 10명)</CardTitle>
            <CardDescription>가장 많은 표를 받은 후보들입니다.</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={topCandidatesData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="votes" fill="#3b82f6" name="득표 수" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* 역할별 득표 상세 */}
      {votesByRole.map(({ role, candidates: roleCandidates }) => {
        if (roleCandidates.length === 0) return null;

        const chartData = roleCandidates.map((cv) => ({
          name: cv.candidateName,
          value: cv.voteCount,
        }));

        return (
          <Card key={role}>
            <CardHeader>
              <CardTitle>{getRoleText(role)} 득표 분포</CardTitle>
              <CardDescription>
                {getRoleText(role)} 역할 후보들의 득표 현황입니다.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-6">
                {/* 파이 차트 */}
                <div>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={chartData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) =>
                          `${name}: ${((percent || 0) * 100).toFixed(0)}%`
                        }
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {chartData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* 테이블 */}
                <div>
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 px-2 font-medium text-gray-600">
                          순위
                        </th>
                        <th className="text-left py-2 px-2 font-medium text-gray-600">
                          후보
                        </th>
                        <th className="text-right py-2 px-2 font-medium text-gray-600">
                          득표 수
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {roleCandidates
                        .sort((a, b) => b.voteCount - a.voteCount)
                        .map((cv, index) => (
                          <tr key={cv.candidateId} className="border-b">
                            <td className="py-2 px-2">
                              <Badge
                                variant={index === 0 ? 'default' : 'secondary'}
                              >
                                {index + 1}위
                              </Badge>
                            </td>
                            <td className="py-2 px-2 font-medium">
                              {cv.candidateName}
                            </td>
                            <td className="py-2 px-2 text-right font-semibold text-blue-600">
                              {cv.voteCount}표
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
