import { z } from 'zod';

/**
 * 이메일 입력 스키마
 */
export const emailSchema = z.object({
  email: z
    .string()
    .min(1, '이메일을 입력해주세요.')
    .email('올바른 이메일 형식이 아닙니다.'),
});

export type EmailFormData = z.infer<typeof emailSchema>;

/**
 * OTP 검증 스키마
 */
export const otpSchema = z.object({
  email: z.string().email(),
  code: z
    .string()
    .min(6, 'OTP 코드는 6자리입니다.')
    .max(6, 'OTP 코드는 6자리입니다.')
    .regex(/^\d+$/, 'OTP 코드는 숫자만 입력 가능합니다.'),
});

export type OtpFormData = z.infer<typeof otpSchema>;
