'use client';

import { useEffect, useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Building2,
  Wallet,
  TrendingUp,
  TrendingDown,
  Receipt,
  DollarSign,
} from 'lucide-react';
import { getAccounts, getSummary, Account, SummaryResponse } from '@/lib/api/finance';
import { getErrorMessage } from '@/lib/api/client';
import { TransactionTable } from './TransactionTable';
import { FinanceChart } from './FinanceChart';

export function FinanceTab() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [summary, setSummary] = useState<SummaryResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const [accountsData, summaryData] = await Promise.all([
        getAccounts(),
        getSummary({ groupBy: 'month' }),
      ]);

      setAccounts(accountsData);
      setSummary(summaryData);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW',
    }).format(amount);
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
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <Skeleton className="h-24" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <Skeleton className="h-24" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const totalBalance = accounts.reduce((sum, acc) => sum + acc.actualBalance, 0);

  return (
    <div className="space-y-6">
      {/* 계좌 현황 카드 */}
      <div className="grid grid-cols-3 gap-4">
        {accounts
          .filter((acc) => acc.isActive)
          .map((account) => (
            <Card key={account.id}>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  {account.name}
                </CardTitle>
                {account.accountNumber && (
                  <CardDescription className="text-xs">
                    {account.accountNumber}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(account.actualBalance)}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  거래 {account.transactionCount}건
                </p>
              </CardContent>
            </Card>
          ))}

        {/* 총 잔액 카드 */}
        <Card className="border-2 border-primary">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <Wallet className="h-4 w-4" />
              총 잔액
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${
                totalBalance < 0 ? 'text-red-600' : 'text-green-600'
              }`}
            >
              {formatCurrency(totalBalance)}
            </div>
            <p className="text-xs text-gray-500 mt-1">전체 계좌 합계</p>
          </CardContent>
        </Card>
      </div>

      {/* 요약 통계 */}
      {summary && (
        <div className="grid grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">총 입금액</p>
                  <p className="text-xl font-bold mt-2 text-green-600">
                    {formatCurrency(summary.summary.totalIncome)}
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">총 출금액</p>
                  <p className="text-xl font-bold mt-2 text-red-600">
                    {formatCurrency(summary.summary.totalExpense)}
                  </p>
                </div>
                <TrendingDown className="h-8 w-8 text-red-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">순 금액</p>
                  <p
                    className={`text-xl font-bold mt-2 ${
                      summary.summary.netAmount < 0 ? 'text-red-600' : 'text-green-600'
                    }`}
                  >
                    {formatCurrency(summary.summary.netAmount)}
                  </p>
                </div>
                <DollarSign className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">총 거래 건수</p>
                  <p className="text-xl font-bold mt-2">
                    {summary.summary.transactionCount.toLocaleString()}
                  </p>
                </div>
                <Receipt className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 차트 */}
      {summary && summary.chartData.length > 0 && (
        <FinanceChart chartData={summary.chartData} />
      )}

      {/* 거래내역 테이블 */}
      <TransactionTable accounts={accounts} />
    </div>
  );
}
