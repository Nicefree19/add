'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { User, VerifyOtpDto, RequestOtpDto } from '@/types/auth';
import { requestOtp, verifyOtp, getMe } from '@/lib/api/auth';
import {
  setTokens,
  clearTokens,
  hasValidToken,
  getAccessToken,
} from '@/lib/auth/token';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (data: VerifyOtpDto) => Promise<void>;
  logout: () => void;
  requestOtpCode: (data: RequestOtpDto) => Promise<void>;
  refetch: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // 초기 로드 시 사용자 정보 가져오기
  useEffect(() => {
    async function loadUser() {
      try {
        if (hasValidToken()) {
          const userData = await getMe();
          setUser(userData);
        }
      } catch (error) {
        console.error('Failed to load user:', error);
        clearTokens();
      } finally {
        setIsLoading(false);
      }
    }

    loadUser();
  }, []);

  /**
   * OTP 요청
   */
  const requestOtpCode = async (data: RequestOtpDto) => {
    await requestOtp(data);
  };

  /**
   * 로그인 (OTP 검증)
   */
  const login = async (data: VerifyOtpDto) => {
    const response = await verifyOtp(data);

    // 토큰 저장
    setTokens({
      accessToken: response.accessToken,
      refreshToken: response.refreshToken,
      expiresIn: response.expiresIn,
    });

    // 사용자 정보 설정
    setUser(response.user);

    // 메인 페이지로 리디렉션
    router.push('/');
  };

  /**
   * 로그아웃
   */
  const logout = () => {
    clearTokens();
    setUser(null);
    router.push('/login');
  };

  /**
   * 사용자 정보 재조회
   */
  const refetch = async () => {
    if (hasValidToken()) {
      const userData = await getMe();
      setUser(userData);
    }
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user && hasValidToken(),
    login,
    logout,
    requestOtpCode,
    refetch,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * useAuth 훅
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
