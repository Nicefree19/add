import { apiClient, ApiResponse } from './client';
import { User } from '@/types/auth';

/**
 * 사용자 목록 조회 (추천할 때 사용)
 */
export interface UserListResponse {
  items: User[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export async function getUsers(params?: {
  page?: number;
  limit?: number;
  search?: string;
}): Promise<UserListResponse> {
  const response = await apiClient.get<ApiResponse<UserListResponse>>(
    '/users',
    { params }
  );
  return response.data.data!;
}
