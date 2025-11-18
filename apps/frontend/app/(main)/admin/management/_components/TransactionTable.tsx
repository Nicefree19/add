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
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import {
  getTransactions,
  Account,
  Transaction,
  GetTransactionsParams,
} from '@/lib/api/finance';
import { getErrorMessage } from '@/lib/api/client';

interface TransactionTableProps {
  accounts: Account[];
}

export function TransactionTable({ accounts }: TransactionTableProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    pageSize: 20,
    totalPages: 0,
  });

  // 필터 상태
  const [filters, setFilters] = useState<GetTransactionsParams>({
    page: 1,
    pageSize: 20,
    sortBy: 'date',
    sortOrder: 'desc',
  });

  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadTransactions();
  }, [filters]);

  const loadTransactions = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await getTransactions(filters);

      setTransactions(response.data);
      setPagination(response.pagination);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = () => {
    setFilters((prev) => ({
      ...prev,
      search: searchTerm || undefined,
      page: 1,
    }));
  };

  const handleFilterChange = (key: keyof GetTransactionsParams, value: any) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value || undefined,
      page: 1,
    }));
  };

  const handlePageChange = (newPage: number) => {
    setFilters((prev) => ({
      ...prev,
      page: newPage,
    }));
  };

  const formatCurrency = (amount: string) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW',
    }).format(Number(amount));
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>거래내역</CardTitle>
        <CardDescription>
          전체 거래 내역을 조회하고 필터링할 수 있습니다.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 필터 영역 */}
        <div className="grid grid-cols-5 gap-3">
          {/* 검색 */}
          <div className="col-span-2 flex gap-2">
            <Input
              placeholder="거래 설명 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleSearch();
                }
              }}
            />
            <Button onClick={handleSearch} size="icon">
              <Search className="h-4 w-4" />
            </Button>
          </div>

          {/* 거래 유형 */}
          <Select
            value={filters.type || 'all'}
            onValueChange={(value) =>
              handleFilterChange('type', value === 'all' ? undefined : value)
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="거래 유형" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체</SelectItem>
              <SelectItem value="INCOME">입금</SelectItem>
              <SelectItem value="EXPENSE">출금</SelectItem>
            </SelectContent>
          </Select>

          {/* 계좌 선택 */}
          <Select
            value={filters.accountId || 'all'}
            onValueChange={(value) =>
              handleFilterChange('accountId', value === 'all' ? undefined : value)
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="계좌" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체 계좌</SelectItem>
              {accounts.map((account) => (
                <SelectItem key={account.id} value={account.id}>
                  {account.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* 정렬 */}
          <Select
            value={`${filters.sortBy}-${filters.sortOrder}`}
            onValueChange={(value) => {
              const [sortBy, sortOrder] = value.split('-');
              setFilters((prev) => ({
                ...prev,
                sortBy,
                sortOrder: sortOrder as 'asc' | 'desc',
              }));
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="정렬" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date-desc">날짜 (최신순)</SelectItem>
              <SelectItem value="date-asc">날짜 (과거순)</SelectItem>
              <SelectItem value="amount-desc">금액 (높은순)</SelectItem>
              <SelectItem value="amount-asc">금액 (낮은순)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* 테이블 */}
        {error ? (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-16" />
            ))}
          </div>
        ) : transactions.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            거래내역이 없습니다.
          </div>
        ) : (
          <>
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      날짜
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      유형
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      계좌
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      카테고리
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      설명
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      금액
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {transactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {formatDate(tx.date)}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {tx.type === 'INCOME' ? (
                          <Badge className="bg-green-100 text-green-800 flex items-center gap-1 w-fit">
                            <TrendingUp className="h-3 w-3" />
                            입금
                          </Badge>
                        ) : (
                          <Badge className="bg-red-100 text-red-800 flex items-center gap-1 w-fit">
                            <TrendingDown className="h-3 w-3" />
                            출금
                          </Badge>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {tx.account.name}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <Badge variant="outline">{tx.category}</Badge>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {tx.description}
                      </td>
                      <td
                        className={`px-4 py-3 text-sm text-right font-semibold ${
                          tx.type === 'INCOME' ? 'text-green-600' : 'text-red-600'
                        }`}
                      >
                        {tx.type === 'INCOME' ? '+' : '-'}
                        {formatCurrency(tx.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* 페이지네이션 */}
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                전체 {pagination.total.toLocaleString()}건 중{' '}
                {((pagination.page - 1) * pagination.pageSize + 1).toLocaleString()}-
                {Math.min(
                  pagination.page * pagination.pageSize,
                  pagination.total
                ).toLocaleString()}
                건
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  이전
                </Button>
                <div className="text-sm text-gray-600">
                  {pagination.page} / {pagination.totalPages}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page === pagination.totalPages}
                >
                  다음
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
