'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  getElection,
  getCandidates,
  getVoteStatus,
  createVotes,
} from '@/lib/api/elections';
import { Election, Candidate, ElectionRole } from '@/types/election';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { getErrorMessage } from '@/lib/api/client';
import { getRoleText } from '@/lib/utils/election';
import { ArrowLeft, CheckCircle2, Loader2, AlertTriangle } from 'lucide-react';

export default function VotePage() {
  const params = useParams();
  const router = useRouter();
  const electionId = params.id as string;

  const [election, setElection] = useState<Election | null>(null);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [selectedVotes, setSelectedVotes] = useState<Record<ElectionRole, string>>({} as any);
  const [voteStatus, setVoteStatus] = useState<{ hasVoted: boolean } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    loadData();
  }, [electionId]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const [electionData, candidatesData, statusData] = await Promise.all([
        getElection(electionId),
        getCandidates(electionId),
        getVoteStatus(electionId),
      ]);

      setElection(electionData);
      setCandidates(candidatesData);
      setVoteStatus(statusData);

      // 이미 투표했으면 알림
      if (statusData.hasVoted) {
        setError('이미 투표를 완료했습니다.');
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleVoteSelect = (role: ElectionRole, candidateId: string) => {
    setSelectedVotes((prev) => ({
      ...prev,
      [role]: candidateId,
    }));
  };

  const handleSubmitVote = async () => {
    if (!election) return;

    try {
      setIsSubmitting(true);
      setError(null);

      await createVotes(electionId, {
        votes: selectedVotes,
      });

      setSuccess(true);
      setShowConfirmDialog(false);

      setTimeout(() => {
        router.push(`/elections/${electionId}`);
      }, 2000);
    } catch (err) {
      setError(getErrorMessage(err));
      setShowConfirmDialog(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenConfirmDialog = () => {
    // 선택 검증
    const requiredRoles = [ElectionRole.PRESIDENT, ElectionRole.TREASURER];
    const missingRoles = requiredRoles.filter((role) => !selectedVotes[role]);

    if (missingRoles.length > 0) {
      setError(
        `${missingRoles.map(getRoleText).join(', ')} 후보를 선택해주세요.`
      );
      return;
    }

    setError(null);
    setShowConfirmDialog(true);
  };

  // 역할별로 후보 그룹화
  const candidatesByRole = candidates.reduce((acc, candidate) => {
    if (!acc[candidate.forRole]) {
      acc[candidate.forRole] = [];
    }
    acc[candidate.forRole].push(candidate);
    return acc;
  }, {} as Record<ElectionRole, Candidate[]>);

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

  if (!election) {
    return (
      <Alert variant="destructive">
        <AlertDescription>선거를 찾을 수 없습니다.</AlertDescription>
      </Alert>
    );
  }

  if (voteStatus?.hasVoted && !success) {
    return (
      <div className="space-y-6">
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          돌아가기
        </Button>
        <Card>
          <CardContent className="py-12 text-center">
            <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">투표 완료</h2>
            <p className="text-gray-600">이미 투표를 완료했습니다.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (success) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="py-12 text-center">
            <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">투표 완료!</h2>
            <p className="text-gray-600">
              투표가 성공적으로 제출되었습니다.
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
        <h1 className="text-3xl font-bold">투표하기</h1>
        <p className="text-gray-600 mt-1">{election.name}</p>
      </div>

      {/* 안내 */}
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          <ul className="list-disc list-inside space-y-1">
            <li>각 역할별로 1명씩 선택할 수 있습니다.</li>
            <li>투표 후에는 수정할 수 없습니다.</li>
            <li>투표는 익명으로 진행됩니다.</li>
          </ul>
        </AlertDescription>
      </Alert>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* 투표 폼 */}
      <div className="space-y-6">
        {Object.values(ElectionRole).map((role) => {
          const roleCandidates = candidatesByRole[role] || [];
          if (roleCandidates.length === 0) return null;

          return (
            <Card key={role}>
              <CardHeader>
                <CardTitle>{getRoleText(role)} 투표</CardTitle>
                <CardDescription>
                  {roleCandidates.length}명의 후보 중 1명을 선택하세요.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {roleCandidates.map((candidate) => (
                  <label
                    key={candidate.id}
                    className={`flex items-start gap-3 p-4 border rounded-lg cursor-pointer transition-colors hover:bg-gray-50 ${
                      selectedVotes[role] === candidate.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200'
                    }`}
                  >
                    <input
                      type="radio"
                      name={role}
                      value={candidate.id}
                      checked={selectedVotes[role] === candidate.id}
                      onChange={() => handleVoteSelect(role, candidate.id)}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <div className="font-semibold">{candidate.user.name}</div>
                      <div className="text-sm text-gray-600">
                        {candidate.user.department} · {candidate.user.position}
                      </div>
                      {candidate.statement && (
                        <div className="text-sm text-gray-700 mt-2 line-clamp-2">
                          {candidate.statement}
                        </div>
                      )}
                    </div>
                  </label>
                ))}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* 제출 버튼 */}
      <div className="flex gap-4">
        <Button
          variant="outline"
          onClick={() => router.back()}
          className="flex-1"
          disabled={isSubmitting}
        >
          취소
        </Button>
        <Button
          onClick={handleOpenConfirmDialog}
          className="flex-1"
          disabled={isSubmitting}
        >
          투표 제출
        </Button>
      </div>

      {/* 확인 모달 */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>투표 확인</DialogTitle>
            <DialogDescription>
              투표를 제출하시겠습니까? 제출 후에는 수정할 수 없습니다.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            {Object.entries(selectedVotes).map(([role, candidateId]) => {
              const candidate = candidates.find((c) => c.id === candidateId);
              if (!candidate) return null;

              return (
                <div key={role} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                  <div className="font-medium">{getRoleText(role as ElectionRole)}</div>
                  <div className="text-sm">
                    {candidate.user.name} ({candidate.user.employeeNo})
                  </div>
                </div>
              );
            })}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowConfirmDialog(false)}
              disabled={isSubmitting}
            >
              취소
            </Button>
            <Button onClick={handleSubmitVote} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  제출 중...
                </>
              ) : (
                '투표 제출'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
