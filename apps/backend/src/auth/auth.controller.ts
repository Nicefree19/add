import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import {
  RequestOtpDto,
  VerifyOtpDto,
  RefreshTokenDto,
  AuthResponseDto,
  RefreshTokenResponseDto,
} from './dto';
import { Public } from '../common/decorators/public.decorator';
import { BaseResponseDto } from '../common/dto/base-response.dto';

/**
 * 인증 컨트롤러
 *
 * 이메일 OTP 로그인 및 JWT 토큰 관리 엔드포인트 제공
 *
 * 제공하는 API:
 * - POST /auth/request-otp: OTP 코드 발급 요청
 * - POST /auth/verify-otp: OTP 검증 및 로그인
 * - POST /auth/refresh: Access Token 갱신
 */
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * OTP 코드 요청
   *
   * 사용자의 이메일로 6자리 OTP 코드를 생성하고 발송합니다.
   * (현재는 이메일 발송 대신 로그에 출력됩니다)
   *
   * @route POST /auth/request-otp
   * @access Public
   *
   * @param dto - 이메일 정보
   * @returns 성공 메시지
   *
   * @example
   * Request:
   * POST /auth/request-otp
   * {
   *   "email": "user@example.com"
   * }
   *
   * Response (200):
   * {
   *   "success": true,
   *   "data": {
   *     "message": "OTP 코드가 이메일로 발송되었습니다."
   *   }
   * }
   *
   * Error Response (404):
   * {
   *   "success": false,
   *   "error": {
   *     "code": "USER_NOT_FOUND",
   *     "message": "등록되지 않은 이메일입니다."
   *   }
   * }
   */
  @Public()
  @Throttle({ default: { limit: 5, ttl: 60000 } }) // 보안: 1분당 5회로 제한 (OTP 스팸 방지)
  @Post('request-otp')
  @HttpCode(HttpStatus.OK)
  async requestOtp(@Body() dto: RequestOtpDto) {
    const result = await this.authService.requestOtp(dto);
    return BaseResponseDto.success(result);
  }

  /**
   * OTP 검증 및 로그인
   *
   * 이메일과 OTP 코드를 검증하고, 성공 시 JWT 토큰을 발급합니다.
   *
   * @route POST /auth/verify-otp
   * @access Public
   *
   * @param dto - 이메일 및 OTP 코드
   * @returns JWT 토큰 및 사용자 정보
   *
   * @example
   * Request:
   * POST /auth/verify-otp
   * {
   *   "email": "user@example.com",
   *   "code": "123456"
   * }
   *
   * Response (200):
   * {
   *   "success": true,
   *   "data": {
   *     "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
   *     "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
   *     "user": {
   *       "id": "uuid",
   *       "employeeNo": "EMP001",
   *       "email": "user@example.com",
   *       "name": "홍길동",
   *       "role": "MEMBER"
   *     },
   *     "expiresIn": 1800
   *   }
   * }
   *
   * Error Response (401):
   * {
   *   "success": false,
   *   "error": {
   *     "code": "AUTH_OTP_INVALID",
   *     "message": "유효하지 않은 OTP 코드입니다."
   *   }
   * }
   */
  @Public()
  @Throttle({ default: { limit: 10, ttl: 60000 } }) // 보안: 1분당 10회로 제한 (브루트포스 공격 방지)
  @Post('verify-otp')
  @HttpCode(HttpStatus.OK)
  async verifyOtp(@Body() dto: VerifyOtpDto) {
    const result = await this.authService.verifyOtp(dto);
    return BaseResponseDto.success(result);
  }

  /**
   * Access Token 갱신
   *
   * Refresh Token을 사용하여 새로운 Access Token을 발급합니다.
   *
   * @route POST /auth/refresh
   * @access Public
   *
   * @param dto - Refresh Token
   * @returns 새로운 Access Token
   *
   * @example
   * Request:
   * POST /auth/refresh
   * {
   *   "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
   * }
   *
   * Response (200):
   * {
   *   "success": true,
   *   "data": {
   *     "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
   *     "expiresIn": 1800
   *   }
   * }
   *
   * Error Response (401):
   * {
   *   "success": false,
   *   "error": {
   *     "code": "AUTH_TOKEN_EXPIRED",
   *     "message": "Refresh Token이 만료되었습니다. 다시 로그인해주세요."
   *   }
   * }
   */
  @Public()
  @Throttle({ default: { limit: 10, ttl: 60000 } }) // 보안: 1분당 10회로 제한 (토큰 남용 방지)
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Body() dto: RefreshTokenDto) {
    const result = await this.authService.refreshToken(dto);
    return BaseResponseDto.success(result);
  }
}
