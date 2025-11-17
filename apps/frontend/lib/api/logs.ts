import { apiClient, ApiResponse } from './client';
import { AccessLog, AccessLogListResponse, AccessLogFilterParams } from '@/types/log';

/**
 * 액세스 로그 목록 조회 (관리자/감사 전용)
 */
export async function getAccessLogs(
  params?: AccessLogFilterParams
): Promise<AccessLogListResponse> {
  const response = await apiClient.get<ApiResponse<AccessLogListResponse>>(
    '/admin/logs',
    { params }
  );
  return response.data.data!;
}

/**
 * 특정 사용자의 로그 조회
 */
export async function getUserLogs(
  userId: string,
  params?: { page?: number; limit?: number }
): Promise<AccessLogListResponse> {
  const response = await apiClient.get<ApiResponse<AccessLogListResponse>>(
    `/admin/logs/user/${userId}`,
    { params }
  );
  return response.data.data!;
}

/**
 * 로그 통계 조회
 */
export interface LogStats {
  totalLogs: number;
  todayLogs: number;
  topActions: {
    action: string;
    count: number;
  }[];
  topUsers: {
    userId: string;
    userName: string;
    count: number;
  }[];
}

export async function getLogStats(): Promise<LogStats> {
  const response = await apiClient.get<ApiResponse<LogStats>>('/admin/logs/stats');
  return response.data.data!;
}

/**
 * 로그 내보내기 (CSV)
 */
export async function exportLogs(params?: AccessLogFilterParams): Promise<Blob> {
  const response = await apiClient.get('/admin/logs/export', {
    params,
    responseType: 'blob',
  });
  return response.data;
}
