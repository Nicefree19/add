'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api/client';
import { getElection } from '@/lib/api/elections';
import { Election, ElectionRole } from '@/types/election';
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
import { ArrowLeft, UserPlus, Loader2 } from 'lucide-react';

interface RecommendationCount {
  userId: string;
  userName: string;
  userEmail: string;
  role: ElectionRole;
  count: number;
}

interface RecommendationStats {
  totalCount: number;
  byRole: {
    role: ElectionRole;
    count: number;
    recommendations: RecommendationCount[];
  }[];
}

export default function AdminRecommendationsPage() {
  const params = useParams();
  const router = useRouter();
  const electionId = params.id as string;

  const [election, setElection] = useState<Election | null>(null);
  const [stats, setStats] = useState<RecommendationStats | null>(null);
  const [selectedUsers, setSelectedUsers] = useState<Map<string, ElectionRole>>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [isInviting, setIsInviting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    loadData();
  }, [electionId]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [electionData, statsData] = await Promise.all([
        getElection(electionId),
        apiClient.get<RecommendationStats>(`/elections/${electionId}/recommendations`),
      ]);
      setElection(electionData);
      setStats(statsData.data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  const toggleUserSelection = (userId: string, role: ElectionRole) => {
    const newSelected = new Map(selectedUsers);
    if (newSelected.has(userId)) {
      newSelected.delete(userId);
    } else {
      newSelected.set(userId, role);
    }
    setSelectedUsers(newSelected);
  };

  const handleInviteCandidates = async () => {
    if (selectedUsers.size === 0) {
      alert('후보를 선택하세요.');
      return;
    }

    if (!confirm(`선택한 ${selectedUsers.size}명의 후보를 초대하시겠습니까?`)) {
      return;
    }

    try {
      setIsInviting(true);
      setError(null);

      // 각 선택된 사용자를 후보로 초대
      const invitations = Array.from(selectedUsers.entries()).map(([userId, role]) =>
        apiClient.post(`/elections/${electionId}/candidates`, {
          userId,
          role,
        })
      );

      await Promise.all(invitations);

      setSuccess(true);
      setSelectedUsers(new Map());
      setTimeout(() => setSuccess(false), 3000);
      await loadData();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsInviting(false);
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
            <p className="text-gray-600 mt-1">추천 현황 관리</p>
          </div>
          <Button
            onClick={handleInviteCandidates}
            disabled={selectedUsers.size === 0 || isInviting}
          >
            {isInviting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                초대 중...
              </>
            ) : (
              <>
                <UserPlus className="mr-2 h-4 w-4" />
                선택한 후보 초대 ({selectedUsers.size})
              </>
            )}
          </Button>
        </div>
      </div>

      {success && (
        <Alert>
          <AlertDescription>후보 초대가 완료되었습니다.</AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* 전체 통계 */}
      <Card>
        <CardHeader>
          <CardTitle>전체 추천 현황</CardTitle>
          <CardDescription>모든 역할에 대한 추천 통계입니다.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-gray-600">총 추천 수</p>
              <p className="text-3xl font-bold text-blue-600 mt-1">
                {stats.totalCount}
              </p>
            </div>
            {stats.byRole.map((roleStats) => (
              <div key={roleStats.role} className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">{getRoleText(roleStats.role)}</p>
                <p className="text-3xl font-bold text-gray-700 mt-1">
                  {roleStats.count}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 역할별 추천 목록 */}
      {stats.byRole.map((roleStats) => (
        <Card key={roleStats.role}>
          <CardHeader>
            <CardTitle>{getRoleText(roleStats.role)} 추천 현황</CardTitle>
            <CardDescription>
              총 {roleStats.recommendations.length}명이 추천받았습니다.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {roleStats.recommendations.length === 0 ? (
              <p className="text-center text-gray-500 py-8">
                아직 추천된 사용자가 없습니다.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-medium text-gray-600">
                        선택
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">
                        순위
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">
                        이름
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">
                        이메일
                      </th>
                      <th className="text-right py-3 px-4 font-medium text-gray-600">
                        추천 수
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {roleStats.recommendations.map((rec, index) => {
                      const isSelected = selectedUsers.has(rec.userId);
                      return (
                        <tr
                          key={rec.userId}
                          className={`border-b hover:bg-gray-50 transition-colors ${
                            isSelected ? 'bg-blue-50' : ''
                          }`}
                        >
                          <td className="py-3 px-4">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleUserSelection(rec.userId, rec.role)}
                              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                          </td>
                          <td className="py-3 px-4">
                            <Badge variant={index < 3 ? 'default' : 'secondary'}>
                              {index + 1}위
                            </Badge>
                          </td>
                          <td className="py-3 px-4 font-medium">{rec.userName}</td>
                          <td className="py-3 px-4 text-gray-600">{rec.userEmail}</td>
                          <td className="py-3 px-4 text-right">
                            <span className="font-semibold text-blue-600">
                              {rec.count}표
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
