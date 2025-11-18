import { apiClient, ApiResponse } from './client';

/**
 * Finance API 타입 정의
 */

export interface Account {
  id: string;
  name: string;
  accountNumber?: string;
  bankCode: 'KAKAO_BANK' | 'SAFE_BOX' | 'SHINHAN_BANK' | 'CASH_ON_HAND';
  balance: string;
  actualBalance: number;
  transactionCount: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Transaction {
  id: string;
  accountId: string;
  date: string;
  amount: string;
  type: 'INCOME' | 'EXPENSE';
  category: string;
  description: string;
  termId?: string;
  createdById?: string;
  createdAt: string;
  updatedAt: string;
  account: {
    id: string;
    name: string;
    bankCode: string;
    accountNumber?: string;
  };
  term?: {
    id: string;
    name: string;
  };
  createdBy?: {
    id: string;
    name: string;
    employeeNo: string;
  };
}

export interface TransactionListResponse {
  data: Transaction[];
  pagination: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
}

export interface SummaryResponse {
  summary: {
    totalIncome: number;
    totalExpense: number;
    netAmount: number;
    transactionCount: number;
  };
  byCategory: Record<
    string,
    {
      income: number;
      expense: number;
      count: number;
    }
  >;
  chartData: Array<{
    period?: string;
    category?: string;
    income: number;
    expense: number;
    net: number;
    count?: number;
  }>;
}

export interface GetTransactionsParams {
  from?: string;
  to?: string;
  type?: 'INCOME' | 'EXPENSE';
  accountId?: string;
  termId?: string;
  category?: string;
  search?: string;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface GetSummaryParams {
  from?: string;
  to?: string;
  termId?: string;
  groupBy?: 'month' | 'year' | 'category' | 'term';
  year?: string;
}

/**
 * 계좌 목록 조회
 */
export async function getAccounts(): Promise<Account[]> {
  const response = await apiClient.get<ApiResponse<Account[]>>('/finance/accounts');
  return response.data.data!;
}

/**
 * 거래내역 조회
 */
export async function getTransactions(
  params?: GetTransactionsParams
): Promise<TransactionListResponse> {
  const response = await apiClient.get<ApiResponse<TransactionListResponse>>(
    '/finance/transactions',
    { params }
  );
  return response.data.data!;
}

/**
 * 요약 통계 조회
 */
export async function getSummary(params?: GetSummaryParams): Promise<SummaryResponse> {
  const response = await apiClient.get<ApiResponse<SummaryResponse>>(
    '/finance/summary',
    { params }
  );
  return response.data.data!;
}
