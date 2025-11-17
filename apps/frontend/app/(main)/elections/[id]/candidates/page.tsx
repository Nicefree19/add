'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getElection, getCandidates } from '@/lib/api/elections';
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
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { getErrorMessage } from '@/lib/api/client';
import { getRoleText } from '@/lib/utils/election';
import { ArrowLeft, Users, Award } from 'lucide-react';

export default function CandidatesPage() {
  const params = useParams();
  const router = useRouter();
  const electionId = params.id as string;

  const [election, setElection] = useState<Election | null>(null);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [electionId]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError(null);

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
        {[1, 2].map((i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-32 w-full" />
            </CardContent>
          </Card>
        ))}
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

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div>
        <Button variant="outline" onClick={() => router.back()} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          돌아가기
        </Button>
        <h1 className="text-3xl font-bold">후보 목록</h1>
        <p className="text-gray-600 mt-1">{election.name}</p>
      </div>

      {/* 안내 */}
      <Alert>
        <AlertDescription>
          확정된 후보 목록입니다. 후보를 클릭하면 소견서를 볼 수 있습니다.
        </AlertDescription>
      </Alert>

      {candidates.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">아직 확정된 후보가 없습니다.</p>
          </CardContent>
        </Card>
      )}

      {/* 역할별 후보 목록 */}
      {Object.values(ElectionRole).map((role) => {
        const roleCandidates = candidatesByRole[role] || [];
        if (roleCandidates.length === 0) return null;

        return (
          <Card key={role}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>{getRoleText(role)} 후보</CardTitle>
                  <CardDescription>
                    총 {roleCandidates.length}명의 후보
                  </CardDescription>
                </div>
                <Badge>{roleCandidates.length}명</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                {roleCandidates.map((candidate) => (
                  <CandidateCard
                    key={candidate.id}
                    candidate={candidate}
                    onClick={() => setSelectedCandidate(candidate)}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        );
      })}

      {/* 후보 상세 모달 */}
      <Dialog
        open={!!selectedCandidate}
        onOpenChange={(open) => !open && setSelectedCandidate(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedCandidate?.user.name}</DialogTitle>
            <DialogDescription>
              {selectedCandidate?.user.department} · {selectedCandidate?.user.position}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <div className="text-sm font-medium mb-1">지원 역할</div>
              <Badge>{getRoleText(selectedCandidate?.forRole!)}</Badge>
            </div>
            <div>
              <div className="text-sm font-medium mb-1">사번</div>
              <div className="text-sm text-gray-600">
                {selectedCandidate?.user.employeeNo}
              </div>
            </div>
            <div>
              <div className="text-sm font-medium mb-1">이메일</div>
              <div className="text-sm text-gray-600">
                {selectedCandidate?.user.email}
              </div>
            </div>
            {selectedCandidate?.recommendationCount !== undefined && (
              <div>
                <div className="text-sm font-medium mb-1">추천 수</div>
                <div className="flex items-center gap-1">
                  <Award className="h-4 w-4 text-yellow-500" />
                  <span className="text-sm font-semibold">
                    {selectedCandidate.recommendationCount}명
                  </span>
                </div>
              </div>
            )}
            <div>
              <div className="text-sm font-medium mb-2">소견서</div>
              <div className="bg-gray-50 rounded-lg p-4 text-sm">
                {selectedCandidate?.statement || (
                  <span className="text-gray-400">소견서가 작성되지 않았습니다.</span>
                )}
              </div>
            </div>
          </div>
          <div className="flex justify-end">
            <Button onClick={() => setSelectedCandidate(null)}>닫기</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/**
 * 후보 카드 컴포넌트
 */
function CandidateCard({
  candidate,
  onClick,
}: {
  candidate: Candidate;
  onClick: () => void;
}) {
  return (
    <Card
      className="hover:shadow-md transition-shadow cursor-pointer"
      onClick={onClick}
    >
      <CardContent className="pt-6">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="font-semibold text-lg">{candidate.user.name}</h3>
            <p className="text-sm text-gray-600">
              {candidate.user.department} · {candidate.user.position}
            </p>
          </div>
          {candidate.recommendationCount !== undefined && (
            <div className="flex items-center gap-1 text-sm">
              <Award className="h-4 w-4 text-yellow-500" />
              <span className="font-semibold">{candidate.recommendationCount}</span>
            </div>
          )}
        </div>
        <div className="text-sm text-gray-600 mb-2">
          사번: {candidate.user.employeeNo}
        </div>
        {candidate.statement ? (
          <div className="text-sm text-gray-700 line-clamp-2">
            {candidate.statement}
          </div>
        ) : (
          <div className="text-sm text-gray-400 italic">소견서 미작성</div>
        )}
        <Button variant="outline" size="sm" className="w-full mt-3">
          상세 보기
        </Button>
      </CardContent>
    </Card>
  );
}
