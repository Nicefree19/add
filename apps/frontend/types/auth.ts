/**
 * 사용자 역할
 */
export enum UserRole {
  MEMBER = 'MEMBER',
  ADMIN = 'ADMIN',
  AUDITOR = 'AUDITOR',
}

/**
 * 사용자 정보
 */
export interface User {
  id: string;
  employeeNo: string;
  email: string;
  name: string;
  department: string | null;
  position: string | null;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * 인증 응답
 */
export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
  expiresIn: number;
}

/**
 * OTP 요청 DTO
 */
export interface RequestOtpDto {
  email: string;
}

/**
 * OTP 검증 DTO
 */
export interface VerifyOtpDto {
  email: string;
  code: string;
}

/**
 * 토큰 갱신 DTO
 */
export interface RefreshTokenDto {
  refreshToken: string;
}
