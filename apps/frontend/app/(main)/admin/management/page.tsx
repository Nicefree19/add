'use client';

import { useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DollarSign, Users } from 'lucide-react';

// 탭 컴포넌트들 (나중에 구현)
import { FinanceTab } from './_components/FinanceTab';
import { TransitionTab } from './_components/TransitionTab';

/**
 * 사우회 운영 통합 페이지
 *
 * - 재무 정산 탭: 계좌 현황, 거래내역, 통계
 * - 임원진 이양 탭: 인수인계 문서 관리
 */
export default function ManagementPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const defaultTab = searchParams.get('tab') || 'finance';
  const [activeTab, setActiveTab] = useState(defaultTab);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    router.push(`/admin/management?tab=${value}`, { scroll: false });
  };

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div>
        <h1 className="text-3xl font-bold">사우회 운영 관리</h1>
        <p className="text-gray-600 mt-1">재무 정산 및 임원진 이양 통합 관리</p>
      </div>

      {/* 탭 UI */}
      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-4">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="finance" className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            재무 정산
          </TabsTrigger>
          <TabsTrigger value="transition" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            임원진 이양
          </TabsTrigger>
        </TabsList>

        {/* 재무 정산 탭 */}
        <TabsContent value="finance" className="space-y-4">
          <FinanceTab />
        </TabsContent>

        {/* 임원진 이양 탭 */}
        <TabsContent value="transition" className="space-y-4">
          <TransitionTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
