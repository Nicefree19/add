import { apiClient, ApiResponse } from './client';
import {
  RequestOtpDto,
  VerifyOtpDto,
  RefreshTokenDto,
  AuthResponse,
  User,
} from '@/types/auth';

/**
 * OTP 요청
 */
export async function requestOtp(data: RequestOtpDto): Promise<{ message: string }> {
  const response = await apiClient.post<ApiResponse<{ message: string }>>(
    '/auth/request-otp',
    data
  );
  return response.data.data!;
}

/**
 * OTP 검증 및 로그인
 */
export async function verifyOtp(data: VerifyOtpDto): Promise<AuthResponse> {
  const response = await apiClient.post<ApiResponse<AuthResponse>>(
    '/auth/verify-otp',
    data
  );
  return response.data.data!;
}

/**
 * Access Token 갱신
 */
export async function refreshAccessToken(
  data: RefreshTokenDto
): Promise<{ accessToken: string; expiresIn: number }> {
  const response = await apiClient.post<
    ApiResponse<{ accessToken: string; expiresIn: number }>
  >('/auth/refresh', data);
  return response.data.data!;
}

/**
 * 내 정보 조회
 */
export async function getMe(): Promise<User> {
  const response = await apiClient.get<ApiResponse<User>>('/users/me');
  return response.data.data!;
}
