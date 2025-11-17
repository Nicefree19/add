/**
 * 인증 응답 DTO
 *
 * 로그인 성공 시 반환되는 토큰 정보와 사용자 정보
 */
export class AuthResponseDto {
  /**
   * Access Token (짧은 만료 시간)
   * API 요청 시 Authorization 헤더에 포함
   */
  accessToken: string;

  /**
   * Refresh Token (긴 만료 시간)
   * Access Token 갱신에 사용
   */
  refreshToken: string;

  /**
   * 사용자 정보
   */
  user: {
    id: string;
    employeeNo: string;
    email: string;
    name: string;
    role: string;
  };

  /**
   * Access Token 만료 시간 (초 단위)
   */
  expiresIn: number;
}

/**
 * 토큰 갱신 응답 DTO
 *
 * Refresh Token으로 새 Access Token 발급 시 반환
 */
export class RefreshTokenResponseDto {
  /**
   * 새로 발급된 Access Token
   */
  accessToken: string;

  /**
   * Access Token 만료 시간 (초 단위)
   */
  expiresIn: number;
}
