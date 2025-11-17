import { IsEmail, IsNotEmpty, IsString, Length, Matches } from 'class-validator';

/**
 * OTP 검증 DTO
 *
 * 이메일과 OTP 코드를 통해 인증을 검증하고 JWT 토큰 발급
 *
 * @example
 * {
 *   "email": "user@example.com",
 *   "code": "123456"
 * }
 */
export class VerifyOtpDto {
  /**
   * 사용자 이메일 주소
   */
  @IsEmail({}, { message: '유효한 이메일 주소를 입력해주세요.' })
  @IsNotEmpty({ message: '이메일은 필수 입력 항목입니다.' })
  email: string;

  /**
   * 6자리 숫자 OTP 코드
   */
  @IsString({ message: 'OTP 코드는 문자열이어야 합니다.' })
  @IsNotEmpty({ message: 'OTP 코드는 필수 입력 항목입니다.' })
  @Length(6, 6, { message: 'OTP 코드는 6자리여야 합니다.' })
  @Matches(/^\d{6}$/, { message: 'OTP 코드는 6자리 숫자여야 합니다.' })
  code: string;
}
