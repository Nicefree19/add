import { IsEmail, IsNotEmpty } from 'class-validator';

/**
 * OTP 요청 DTO
 *
 * 이메일 주소를 통해 OTP 코드 발급을 요청
 *
 * @example
 * {
 *   "email": "user@example.com"
 * }
 */
export class RequestOtpDto {
  /**
   * 사용자 이메일 주소
   * 등록된 사용자의 이메일이어야 함
   */
  @IsEmail({}, { message: '유효한 이메일 주소를 입력해주세요.' })
  @IsNotEmpty({ message: '이메일은 필수 입력 항목입니다.' })
  email: string;
}
