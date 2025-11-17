'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api/client';
import { getElection, getCandidates } from '@/lib/api/elections';
import { Election, Candidate, CandidateStatus, ElectionRole } from '@/types/election';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { getErrorMessage } from '@/lib/api/client';
import { getRoleText, formatDateTime } from '@/lib/utils/election';
import { ArrowLeft, Trash2, Eye, UserPlus } from 'lucide-react';

export default function AdminCandidatesPage() {
  const params = useParams();
  const router = useRouter();
  const electionId = params.id as string;

  const [election, setElection] = useState<Election | null>(null);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

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
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteCandidate = async (candidateId: string) => {
    if (!confirm('정말 이 후보를 삭제하시겠습니까?')) {
      return;
    }

    try {
      setError(null);
      await apiClient.delete(`/elections/${electionId}/candidates/${candidateId}`);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
      await loadData();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const handleViewCandidate = (candidate: Candidate) => {
    setSelectedCandidate(candidate);
    setIsDialogOpen(true);
  };

  const getCandidateStatusBadge = (status: CandidateStatus) => {
    switch (status) {
      case CandidateStatus.INVITED:
        return <Badge variant="warning">초대됨</Badge>;
      case CandidateStatus.ACCEPTED:
        return <Badge variant="success">수락</Badge>;
      case CandidateStatus.DECLINED:
        return <Badge variant="destructive">거절</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  // 역할별로 후보 그룹화
  const candidatesByRole = Object.values(ElectionRole).map((role) => ({
    role,
    candidates: candidates.filter((c) => c.forRole === role),
  }));

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
            <p className="text-gray-600 mt-1">후보 관리</p>
          </div>
          <Button onClick={() => router.push(`/admin/elections/${electionId}/recommendations`)}>
            <UserPlus className="h-4 w-4 mr-2" />
            추천 현황에서 초대하기
          </Button>
        </div>
      </div>

      {success && (
        <Alert>
          <AlertDescription>변경사항이 저장되었습니다.</AlertDescription>
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
          <CardTitle>후보 통계</CardTitle>
          <CardDescription>역할별 후보 현황입니다.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-gray-600">전체 후보</p>
              <p className="text-3xl font-bold text-blue-600 mt-1">
                {candidates.length}
              </p>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <p className="text-sm text-gray-600">초대 중</p>
              <p className="text-3xl font-bold text-yellow-600 mt-1">
                {candidates.filter((c) => c.status === CandidateStatus.INVITED).length}
              </p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-sm text-gray-600">수락</p>
              <p className="text-3xl font-bold text-green-600 mt-1">
                {candidates.filter((c) => c.status === CandidateStatus.ACCEPTED).length}
              </p>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <p className="text-sm text-gray-600">거절</p>
              <p className="text-3xl font-bold text-red-600 mt-1">
                {candidates.filter((c) => c.status === CandidateStatus.DECLINED).length}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 역할별 후보 목록 */}
      {candidatesByRole.map(({ role, candidates: roleCandidates }) => (
        <Card key={role}>
          <CardHeader>
            <CardTitle>{getRoleText(role)} 후보 ({roleCandidates.length}명)</CardTitle>
            <CardDescription>
              {getRoleText(role)} 역할에 지원한 후보 목록입니다.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {roleCandidates.length === 0 ? (
              <p className="text-center text-gray-500 py-8">
                아직 등록된 후보가 없습니다.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-medium text-gray-600">
                        이름
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">
                        이메일
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">
                        상태
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">
                        추천 수
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">
                        초대일
                      </th>
                      <th className="text-right py-3 px-4 font-medium text-gray-600">
                        작업
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {roleCandidates.map((candidate) => (
                      <tr key={candidate.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4 font-medium">{candidate.user.name}</td>
                        <td className="py-3 px-4 text-gray-600">
                          {candidate.user.email}
                        </td>
                        <td className="py-3 px-4">
                          {getCandidateStatusBadge(candidate.status)}
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-blue-600 font-semibold">
                            {candidate.recommendationCount || 0}표
                          </span>
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-600">
                          {formatDateTime(candidate.createdAt)}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewCandidate(candidate)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteCandidate(candidate.id)}
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      ))}

      {/* 후보 상세 정보 다이얼로그 */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>후보 상세 정보</DialogTitle>
            <DialogDescription>
              후보자의 상세 정보와 입후보 선언문입니다.
            </DialogDescription>
          </DialogHeader>
          {selectedCandidate && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">이름</p>
                  <p className="font-medium">{selectedCandidate.user.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">이메일</p>
                  <p className="font-medium">{selectedCandidate.user.email}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">역할</p>
                  <p className="font-medium">{getRoleText(selectedCandidate.forRole)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">상태</p>
                  <div>{getCandidateStatusBadge(selectedCandidate.status)}</div>
                </div>
                <div>
                  <p className="text-sm text-gray-600">추천 수</p>
                  <p className="font-medium text-blue-600">
                    {selectedCandidate.recommendationCount || 0}표
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">초대일</p>
                  <p className="font-medium">
                    {formatDateTime(selectedCandidate.createdAt)}
                  </p>
                </div>
              </div>

              {selectedCandidate.statement ? (
                <div>
                  <p className="text-sm text-gray-600 mb-2">입후보 선언문</p>
                  <div className="bg-gray-50 p-4 rounded-lg whitespace-pre-wrap">
                    {selectedCandidate.statement}
                  </div>
                </div>
              ) : (
                <Alert>
                  <AlertDescription>
                    {selectedCandidate.status === CandidateStatus.INVITED
                      ? '아직 후보가 수락하지 않았습니다.'
                      : '입후보 선언문이 작성되지 않았습니다.'}
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
