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
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { getErrorMessage } from '@/lib/api/client';
import {
  getElectionStatusText,
  getElectionStatusVariant,
  formatDate,
} from '@/lib/utils/election';
import { Search, Plus } from 'lucide-react';

export default function AdminElectionsPage() {
  const router = useRouter();
  const [elections, setElections] = useState<Election[]>([]);
  const [filteredElections, setFilteredElections] = useState<Election[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<ElectionStatus | 'ALL'>('ALL');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadElections();
  }, []);

  useEffect(() => {
    filterElections();
  }, [elections, searchTerm, statusFilter]);

  const loadElections = async () => {
    try {
      setIsLoading(true);
      const data = await getElections({ limit: 100 });
      setElections(data.items);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  const filterElections = () => {
    let filtered = elections;

    // 상태 필터
    if (statusFilter !== 'ALL') {
      filtered = filtered.filter((e) => e.status === statusFilter);
    }

    // 검색어 필터
    if (searchTerm) {
      filtered = filtered.filter(
        (e) =>
          e.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          e.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredElections(filtered);
  };

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">선거 관리</h1>
          <p className="text-gray-600 mt-1">모든 선거를 관리합니다.</p>
        </div>
        <Button onClick={() => router.push('/admin/elections/new')}>
          <Plus className="h-4 w-4 mr-2" />
          새 선거 만들기
        </Button>
      </div>

      {/* 필터 */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            {/* 검색 */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="선거명 또는 설명으로 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* 상태 필터 */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-4 py-2 border rounded-md"
            >
              <option value="ALL">전체 상태</option>
              {Object.values(ElectionStatus).map((status) => (
                <option key={status} value={status}>
                  {getElectionStatusText(status)}
                </option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* 선거 목록 */}
      <Card>
        <CardHeader>
          <CardTitle>선거 목록 ({filteredElections.length})</CardTitle>
          <CardDescription>
            등록된 모든 선거를 확인하고 관리할 수 있습니다.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </div>
          ) : filteredElections.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">
                {searchTerm || statusFilter !== 'ALL'
                  ? '검색 결과가 없습니다.'
                  : '등록된 선거가 없습니다.'}
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {filteredElections.map((election) => (
                <div
                  key={election.id}
                  className="py-4 hover:bg-gray-50 px-4 -mx-4 rounded-lg cursor-pointer transition-colors"
                  onClick={() => router.push(`/admin/elections/${election.id}`)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold">{election.name}</h3>
                        <Badge variant={getElectionStatusVariant(election.status)}>
                          {getElectionStatusText(election.status)}
                        </Badge>
                        {election.isActive && (
                          <Badge variant="success">활성</Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mb-3">
                        {election.description || '설명 없음'}
                      </p>
                      <div className="flex items-center gap-6 text-sm text-gray-600">
                        <div>
                          <span className="font-medium">추천:</span>{' '}
                          {formatDate(election.recommendationStartDate)} ~{' '}
                          {formatDate(election.recommendationEndDate)}
                        </div>
                        <div>
                          <span className="font-medium">투표:</span>{' '}
                          {formatDate(election.votingStartDate)} ~{' '}
                          {formatDate(election.votingEndDate)}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-6 text-sm ml-6">
                      <div className="text-center">
                        <div className="text-gray-600">추천</div>
                        <div className="text-lg font-semibold">
                          {election.recommendationCount || 0}
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-gray-600">후보</div>
                        <div className="text-lg font-semibold">
                          {election.candidateCount || 0}
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-gray-600">투표</div>
                        <div className="text-lg font-semibold">
                          {election.voteCount || 0}
                        </div>
                      </div>
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
