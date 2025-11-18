'use client';

import { useEffect, useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { FileText, Download, CheckCircle, Clock } from 'lucide-react';
import { getElections, getTransitionDocs } from '@/lib/api/elections';
import { getErrorMessage } from '@/lib/api/client';
import type { Election } from '@/types/election';

interface TransitionDoc {
  id: string;
  title: string;
  content: string;
  fromUser: {
    name: string;
    email: string;
  };
  toUser: {
    name: string;
    email: string;
  };
  forRole: string;
  isCompleted: boolean;
  completedAt?: string;
  createdAt: string;
}

interface TransitionDocsResponse {
  election: {
    id: string;
    name: string;
    status: string;
  };
  docs: TransitionDoc[];
  summary: {
    total: number;
    completed: number;
    pending: number;
  };
}

export function TransitionTab() {
  const [elections, setElections] = useState<Election[]>([]);
  const [selectedElectionId, setSelectedElectionId] = useState<string>('');
  const [transitionData, setTransitionData] = useState<TransitionDocsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingDocs, setIsLoadingDocs] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadElections();
  }, []);

  useEffect(() => {
    if (selectedElectionId) {
      loadTransitionDocs(selectedElectionId);
    }
  }, [selectedElectionId]);

  const loadElections = async () => {
    try {
      setIsLoading(true);
      const data = await getElections({ limit: 100 });
      setElections(data.items);

      // 가장 최근 선거를 기본 선택
      if (data.items.length > 0) {
        setSelectedElectionId(data.items[0].id);
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  const loadTransitionDocs = async (electionId: string) => {
    try {
      setIsLoadingDocs(true);
      const data = await getTransitionDocs(electionId);
      setTransitionData(data);
    } catch (err) {
      // 문서가 없을 수도 있으므로 에러는 조용히 처리
      setTransitionData({
        election: { id: electionId, name: '', status: '' },
        docs: [],
        summary: { total: 0, completed: 0, pending: 0 },
      });
    } finally {
      setIsLoadingDocs(false);
    }
  };

  const getRoleText = (role: string) => {
    const roleMap: Record<string, string> = {
      PRESIDENT: '회장',
      VICE_PRESIDENT: '부회장',
      SECRETARY: '총무',
      TREASURER: '회계',
      AUDITOR: '감사',
    };
    return roleMap[role] || role;
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 선거 선택 */}
      <Card>
        <CardHeader>
          <CardTitle>선거 선택</CardTitle>
          <CardDescription>
            인수인계 문서를 확인할 선거를 선택하세요.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={selectedElectionId} onValueChange={setSelectedElectionId}>
            <SelectTrigger className="w-full max-w-md">
              <SelectValue placeholder="선거를 선택하세요" />
            </SelectTrigger>
            <SelectContent>
              {elections.map((election) => (
                <SelectItem key={election.id} value={election.id}>
                  {election.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* 인수인계 문서 목록 */}
      {isLoadingDocs ? (
        <Card>
          <CardContent className="pt-6">
            <Skeleton className="h-64" />
          </CardContent>
        </Card>
      ) : transitionData ? (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>인수인계 문서</CardTitle>
              <CardDescription>
                총 {transitionData.summary.total}건 (완료:{' '}
                {transitionData.summary.completed}건, 대기:{' '}
                {transitionData.summary.pending}건)
              </CardDescription>
            </div>
            <Button variant="outline">
              <FileText className="h-4 w-4 mr-2" />
              문서 추가
            </Button>
          </CardHeader>
          <CardContent>
            {transitionData.docs.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p>인수인계 문서가 없습니다.</p>
                <p className="text-sm mt-1">새로운 문서를 추가해주세요.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {transitionData.docs.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      {doc.isCompleted ? (
                        <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                      ) : (
                        <Clock className="h-5 w-5 text-yellow-500 flex-shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-semibold truncate">{doc.title}</h4>
                          <Badge variant="outline">{getRoleText(doc.forRole)}</Badge>
                          {doc.isCompleted && (
                            <Badge variant="default" className="bg-green-500">
                              완료
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          {doc.fromUser.name} → {doc.toUser.name}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {formatDate(doc.createdAt)}
                          {doc.completedAt && ` · 완료: ${formatDate(doc.completedAt)}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <Button variant="outline" size="sm">
                        <Download className="h-4 w-4 mr-1" />
                        다운로드
                      </Button>
                      <Button variant="ghost" size="sm">
                        상세보기
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
