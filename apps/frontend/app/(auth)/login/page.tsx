'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Mail, KeyRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/lib/auth/auth-context';
import { emailSchema, otpSchema, EmailFormData, OtpFormData } from '@/lib/validations/auth';
import { getErrorMessage } from '@/lib/api/client';

export default function LoginPage() {
  const { requestOtpCode, login } = useAuth();
  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // 이메일 폼
  const emailForm = useForm<EmailFormData>({
    resolver: zodResolver(emailSchema),
    defaultValues: {
      email: '',
    },
  });

  // OTP 폼
  const otpForm = useForm<OtpFormData>({
    resolver: zodResolver(otpSchema),
    defaultValues: {
      email: '',
      code: '',
    },
  });

  /**
   * OTP 요청
   */
  const handleRequestOtp = async (data: EmailFormData) => {
    setError(null);
    setIsLoading(true);

    try {
      await requestOtpCode({ email: data.email });
      setEmail(data.email);
      otpForm.setValue('email', data.email);
      setStep('otp');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * OTP 검증 및 로그인
   */
  const handleVerifyOtp = async (data: OtpFormData) => {
    setError(null);
    setIsLoading(true);

    try {
      await login(data);
      // login 함수 내부에서 리디렉션 처리됨
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * 이메일 변경 (다시 입력)
   */
  const handleChangeEmail = () => {
    setStep('email');
    setError(null);
    otpForm.reset();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">
            사우회 선거 시스템
          </CardTitle>
          <CardDescription className="text-center">
            이메일 OTP 인증으로 로그인하세요
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* 에러 메시지 */}
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* 이메일 입력 단계 */}
          {step === 'email' && (
            <form onSubmit={emailForm.handleSubmit(handleRequestOtp)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">이메일</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="your@email.com"
                    className="pl-10"
                    disabled={isLoading}
                    {...emailForm.register('email')}
                  />
                </div>
                {emailForm.formState.errors.email && (
                  <p className="text-sm text-red-500">
                    {emailForm.formState.errors.email.message}
                  </p>
                )}
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    전송 중...
                  </>
                ) : (
                  <>
                    <Mail className="mr-2 h-4 w-4" />
                    OTP 코드 전송
                  </>
                )}
              </Button>

              <p className="text-xs text-center text-gray-500 mt-4">
                등록된 이메일로 6자리 인증 코드가 전송됩니다.
              </p>
            </form>
          )}

          {/* OTP 입력 단계 */}
          {step === 'otp' && (
            <form onSubmit={otpForm.handleSubmit(handleVerifyOtp)} className="space-y-4">
              {/* 이메일 표시 */}
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <p className="text-sm text-gray-700">
                  <span className="font-semibold">{email}</span>
                  <br />
                  로 인증 코드를 전송했습니다.
                </p>
                <button
                  type="button"
                  onClick={handleChangeEmail}
                  className="text-sm text-blue-600 hover:underline mt-1"
                >
                  이메일 변경
                </button>
              </div>

              <div className="space-y-2">
                <Label htmlFor="code">인증 코드 (6자리)</Label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="code"
                    type="text"
                    placeholder="123456"
                    maxLength={6}
                    className="pl-10 text-center text-2xl tracking-widest"
                    disabled={isLoading}
                    autoFocus
                    {...otpForm.register('code')}
                  />
                </div>
                {otpForm.formState.errors.code && (
                  <p className="text-sm text-red-500">
                    {otpForm.formState.errors.code.message}
                  </p>
                )}
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    확인 중...
                  </>
                ) : (
                  <>
                    <KeyRound className="mr-2 h-4 w-4" />
                    로그인
                  </>
                )}
              </Button>

              {/* 재전송 버튼 */}
              <div className="text-center">
                <button
                  type="button"
                  onClick={() => emailForm.handleSubmit(handleRequestOtp)()}
                  disabled={isLoading}
                  className="text-sm text-gray-600 hover:text-gray-900 hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  코드를 받지 못하셨나요? 재전송
                </button>
              </div>

              <p className="text-xs text-center text-gray-500 mt-4">
                인증 코드는 5분간 유효합니다.
              </p>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
