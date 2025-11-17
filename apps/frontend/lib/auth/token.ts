/**
 * 토큰 저장 전략:
 * - Access Token: localStorage (클라이언트 사이드에서 쉽게 접근 가능)
 * - Refresh Token: localStorage (간단한 구현, 프로덕션에서는 HttpOnly 쿠키 권장)
 *
 * 프로덕션 환경에서는 보안을 위해:
 * - Refresh Token을 HttpOnly 쿠키로 저장하거나
 * - 서버 사이드에서 세션 관리 고려
 */

const ACCESS_TOKEN_KEY = 'accessToken';
const REFRESH_TOKEN_KEY = 'refreshToken';
const TOKEN_EXPIRY_KEY = 'tokenExpiry';

export interface TokenData {
  accessToken: string;
  refreshToken: string;
  expiresIn: number; // seconds
}

/**
 * Access Token 가져오기
 */
export function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

/**
 * Refresh Token 가져오기
 */
export function getRefreshToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

/**
 * 토큰 저장
 */
export function setTokens(tokens: TokenData): void {
  if (typeof window === 'undefined') return;

  localStorage.setItem(ACCESS_TOKEN_KEY, tokens.accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken);

  // 만료 시간 저장 (현재 시간 + expiresIn)
  const expiryTime = Date.now() + tokens.expiresIn * 1000;
  localStorage.setItem(TOKEN_EXPIRY_KEY, expiryTime.toString());
}

/**
 * 토큰 삭제
 */
export function clearTokens(): void {
  if (typeof window === 'undefined') return;

  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(TOKEN_EXPIRY_KEY);
}

/**
 * 토큰이 만료되었는지 확인
 */
export function isTokenExpired(): boolean {
  if (typeof window === 'undefined') return true;

  const expiryTime = localStorage.getItem(TOKEN_EXPIRY_KEY);
  if (!expiryTime) return true;

  return Date.now() >= parseInt(expiryTime);
}

/**
 * 유효한 토큰이 있는지 확인
 */
export function hasValidToken(): boolean {
  const accessToken = getAccessToken();
  return accessToken !== null && !isTokenExpired();
}
