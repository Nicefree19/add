'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
  TooltipProps,
} from 'recharts';

interface CategoryData {
  category: string;
  income: number;
  expense: number;
  count: number;
}

interface CategoryChartProps {
  categoryData: Record<string, { income: number; expense: number; count: number }>;
}

const COLORS = [
  '#3b82f6', // blue
  '#10b981', // green
  '#f59e0b', // yellow
  '#ef4444', // red
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#f97316', // orange
  '#84cc16', // lime
  '#6366f1', // indigo
];

export function CategoryChart({ categoryData }: CategoryChartProps) {
  // 지출 데이터만 차트로 표시 (지출이 더 관리에 중요하므로)
  const expenseData = Object.entries(categoryData)
    .map(([category, data]) => ({
      name: category,
      value: data.expense,
      count: data.count,
    }))
    .filter((item) => item.value > 0)
    .sort((a, b) => b.value - a.value)
    .slice(0, 10); // 상위 10개만

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW',
      notation: 'compact',
      maximumFractionDigits: 0,
    }).format(value);
  };

  const CustomTooltip = ({ active, payload }: TooltipProps<number, string>) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white border border-gray-200 shadow-lg rounded-lg p-3">
          <p className="font-semibold text-sm mb-2">{data.name}</p>
          <div className="space-y-1 text-xs">
            <div className="flex items-center justify-between gap-4">
              <span>지출:</span>
              <span className="font-semibold">
                {new Intl.NumberFormat('ko-KR', {
                  style: 'currency',
                  currency: 'KRW',
                }).format(data.value)}
              </span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span>거래 건수:</span>
              <span className="font-semibold">{data.count}건</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  const renderCustomLabel = (entry: any) => {
    const percent = ((entry.value / expenseData.reduce((sum, item) => sum + item.value, 0)) * 100);
    if (percent < 5) return ''; // 5% 미만은 라벨 생략
    return `${entry.name} (${percent.toFixed(1)}%)`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>카테고리별 지출 분포</CardTitle>
        <CardDescription>주요 지출 카테고리를 시각화합니다 (상위 10개)</CardDescription>
      </CardHeader>
      <CardContent>
        {expenseData.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            카테고리별 지출 데이터가 없습니다.
          </div>
        ) : (
          <div className="flex items-center gap-8">
            {/* 파이 차트 */}
            <div className="flex-1">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={expenseData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={renderCustomLabel}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {expenseData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* 범례 및 상세 정보 */}
            <div className="flex-1 space-y-2">
              {expenseData.map((item, index) => (
                <div key={item.name} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-sm"
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <span className="font-medium">{item.name}</span>
                  </div>
                  <div className="flex items-center gap-3 text-gray-600">
                    <span>{formatCurrency(item.value)}</span>
                    <span className="text-xs">({item.count}건)</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
