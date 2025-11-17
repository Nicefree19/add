import { IsNotEmpty, IsString } from 'class-validator';

/**
 * 토큰 갱신 DTO
 *
 * Refresh Token을 사용하여 새로운 Access Token 발급
 *
 * @example
 * {
 *   "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 * }
 */
export class RefreshTokenDto {
  /**
   * Refresh Token
   * 로그인 시 발급받은 refreshToken 값
   */
  @IsString({ message: 'Refresh Token은 문자열이어야 합니다.' })
  @IsNotEmpty({ message: 'Refresh Token은 필수 입력 항목입니다.' })
  refreshToken: string;
}
