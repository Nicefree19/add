'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getAccessLogs, getLogStats, exportLogs, LogStats } from '@/lib/api/logs';
import { AccessLog, AccessLogAction } from '@/types/log';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { getErrorMessage } from '@/lib/api/client';
import { getActionText, getActionVariant } from '@/lib/utils/log';
import { formatDateTime } from '@/lib/utils/election';
import {
  FileText,
  Download,
  Search,
  Calendar,
  TrendingUp,
  Activity,
  Users,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

export default function AdminLogsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [logs, setLogs] = useState<AccessLog[]>([]);
  const [stats, setStats] = useState<LogStats | null>(null);
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 필터 상태
  const [actionFilter, setActionFilter] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    loadData();
  }, [currentPage, actionFilter, startDate, endDate]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [logsData, statsData] = await Promise.all([
        getAccessLogs({
          page: currentPage,
          limit: 20,
          action: actionFilter !== 'ALL' ? (actionFilter as AccessLogAction) : undefined,
          startDate: startDate || undefined,
          endDate: endDate || undefined,
          search: searchTerm || undefined,
        }),
        getLogStats(),
      ]);

      setLogs(logsData.items);
      setTotalPages(logsData.meta.totalPages);
      setStats(statsData);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = () => {
    setCurrentPage(1);
    loadData();
  };

  const handleExport = async () => {
    try {
      setIsExporting(true);
      const blob = await exportLogs({
        action: actionFilter !== 'ALL' ? (actionFilter as AccessLogAction) : undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        search: searchTerm || undefined,
      });

      // Blob을 다운로드
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `access-logs-${new Date().toISOString()}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsExporting(false);
    }
  };

  if (isLoading && !stats) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">액세스 로그</h1>
          <p className="text-gray-600 mt-1">시스템 액세스 및 활동 로그를 조회합니다.</p>
        </div>
        <Button onClick={handleExport} disabled={isExporting} variant="outline">
          {isExporting ? (
            <>내보내는 중...</>
          ) : (
            <>
              <Download className="h-4 w-4 mr-2" />
              CSV 내보내기
            </>
          )}
        </Button>
      </div>

      {/* 통계 카드 */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">총 로그</p>
                  <p className="text-3xl font-bold mt-2">{stats.totalLogs}</p>
                </div>
                <FileText className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">오늘</p>
                  <p className="text-3xl font-bold mt-2">{stats.todayLogs}</p>
                </div>
                <Calendar className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">가장 많은 액션</p>
                  <p className="text-lg font-bold mt-2">
                    {stats.topActions[0]
                      ? getActionText(stats.topActions[0].action as AccessLogAction)
                      : '-'}
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">활성 사용자</p>
                  <p className="text-3xl font-bold mt-2">{stats.topUsers.length}</p>
                </div>
                <Users className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* 필터 */}
      <Card>
        <CardHeader>
          <CardTitle>필터</CardTitle>
          <CardDescription>로그를 필터링하여 조회합니다.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* 검색 */}
            <div className="space-y-2">
              <Label htmlFor="search">검색</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder="사용자, 이메일..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* 액션 필터 */}
            <div className="space-y-2">
              <Label htmlFor="action">액션</Label>
              <select
                id="action"
                value={actionFilter}
                onChange={(e) => setActionFilter(e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
              >
                <option value="ALL">전체</option>
                {Object.values(AccessLogAction).map((action) => (
                  <option key={action} value={action}>
                    {getActionText(action)}
                  </option>
                ))}
              </select>
            </div>

            {/* 시작일 */}
            <div className="space-y-2">
              <Label htmlFor="startDate">시작일</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>

            {/* 종료일 */}
            <div className="space-y-2">
              <Label htmlFor="endDate">종료일</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>

            {/* 검색 버튼 */}
            <div className="space-y-2">
              <Label className="invisible">검색</Label>
              <Button onClick={handleSearch} className="w-full">
                <Search className="h-4 w-4 mr-2" />
                검색
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 로그 테이블 */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>로그 목록</CardTitle>
              <CardDescription>총 {logs.length}개의 로그</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-12">
              <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">조회된 로그가 없습니다.</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-medium text-gray-600">
                        일시
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">
                        액션
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">
                        사용자
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">
                        역할
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">
                        리소스
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">
                        IP 주소
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((log) => (
                      <tr key={log.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4 text-sm text-gray-600">
                          {formatDateTime(log.createdAt)}
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant={getActionVariant(log.action)}>
                            {getActionText(log.action)}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          <div>
                            <p className="font-medium">{log.user.name}</p>
                            <p className="text-xs text-gray-500">{log.user.email}</p>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant="secondary">{log.user.role}</Badge>
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-600">
                          {log.resource && (
                            <div>
                              <p>{log.resource}</p>
                              {log.resourceId && (
                                <p className="text-xs text-gray-400">
                                  ID: {log.resourceId.slice(0, 8)}...
                                </p>
                              )}
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-600 font-mono">
                          {log.ipAddress}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* 페이지네이션 */}
              <div className="flex items-center justify-between mt-6 pt-4 border-t">
                <p className="text-sm text-gray-600">
                  페이지 {currentPage} / {totalPages}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* 활동 통계 */}
      {stats && stats.topActions.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>주요 액션</CardTitle>
              <CardDescription>가장 많이 수행된 액션 Top 5</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {stats.topActions.slice(0, 5).map((item, index) => (
                  <div key={item.action} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Badge variant="secondary">{index + 1}</Badge>
                      <span className="font-medium">
                        {getActionText(item.action as AccessLogAction)}
                      </span>
                    </div>
                    <span className="text-blue-600 font-semibold">{item.count}회</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>활성 사용자</CardTitle>
              <CardDescription>가장 많이 활동한 사용자 Top 5</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {stats.topUsers.slice(0, 5).map((item, index) => (
                  <div key={item.userId} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Badge variant="secondary">{index + 1}</Badge>
                      <span className="font-medium">{item.userName}</span>
                    </div>
                    <span className="text-blue-600 font-semibold">{item.count}회</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
