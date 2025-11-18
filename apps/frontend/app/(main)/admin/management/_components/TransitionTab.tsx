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

interface Election {
  id: string;
  name: string;
  status: string;
}

interface TransitionDoc {
  id: string;
  title: string;
  category: string;
  fromUser: {
    name: string;
  };
  toUser: {
    name: string;
  };
  forRole: string;
  isCompleted: boolean;
  createdAt: string;
}

export function TransitionTab() {
  const [elections, setElections] = useState<Election[]>([]);
  const [selectedElectionId, setSelectedElectionId] = useState<string>('');
  const [docs, setDocs] = useState<TransitionDoc[]>([]);
  const [isLoading, setIsLoading] = useState(true);
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
      // TODO: API 호출로 대체
      // const data = await fetch('/api/elections').then(r => r.json());

      // 임시 데이터
      setElections([
        {
          id: '1',
          name: '2025년 1기 정기 선거',
          status: 'CLOSED',
        },
        {
          id: '2',
          name: '2024년 2기 정기 선거',
          status: 'CLOSED',
        },
      ]);

      setSelectedElectionId('1');
      setIsLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : '선거 목록을 불러오는데 실패했습니다.');
      setIsLoading(false);
    }
  };

  const loadTransitionDocs = async (electionId: string) => {
    try {
      // TODO: API 호출로 대체
      // const data = await fetch(`/api/elections/${electionId}/transition-docs`).then(r => r.json());

      // 임시 데이터
      setDocs([
        {
          id: '1',
          title: '회계장부 인수인계',
          category: 'FINANCIAL',
          fromUser: { name: '김철수' },
          toUser: { name: '이영희' },
          forRole: 'TREASURER',
          isCompleted: true,
          createdAt: '2025-01-15T10:00:00Z',
        },
        {
          id: '2',
          title: '회원 명부 인수인계',
          category: 'MEMBER',
          fromUser: { name: '박민수' },
          toUser: { name: '정수진' },
          forRole: 'SECRETARY',
          isCompleted: false,
          createdAt: '2025-01-16T14:00:00Z',
        },
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : '인수인계 문서를 불러오는데 실패했습니다.');
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
        <Skeleton className="h-12" />
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
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>인수인계 문서</CardTitle>
            <CardDescription>
              총 {docs.length}건 (완료: {docs.filter(d => d.isCompleted).length}건,
              대기: {docs.filter(d => !d.isCompleted).length}건)
            </CardDescription>
          </div>
          <Button>
            <FileText className="h-4 w-4 mr-2" />
            문서 추가
          </Button>
        </CardHeader>
        <CardContent>
          {docs.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              인수인계 문서가 없습니다.
            </div>
          ) : (
            <div className="space-y-3">
              {docs.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex items-center gap-4 flex-1">
                    {doc.isCompleted ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <Clock className="h-5 w-5 text-yellow-500" />
                    )}
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold">{doc.title}</h4>
                        <Badge variant="outline">{getRoleText(doc.forRole)}</Badge>
                        {doc.isCompleted && (
                          <Badge variant="default" className="bg-green-500">완료</Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        {doc.fromUser.name} → {doc.toUser.name}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(doc.createdAt).toLocaleDateString('ko-KR')}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
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
    </div>
  );
}
