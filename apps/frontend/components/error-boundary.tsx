'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle } from 'lucide-react';

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error Boundary Component
 *
 * 하위 컴포넌트에서 발생하는 에러를 캐치하여 앱 전체가 중단되는 것을 방지합니다.
 *
 * 사용 예:
 * ```tsx
 * <ErrorBoundary>
 *   <YourComponent />
 * </ErrorBoundary>
 * ```
 */
export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // 에러 로깅 서비스에 전송 (예: Sentry, LogRocket 등)
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      // 커스텀 fallback이 제공된 경우
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // 기본 에러 UI
      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
          <Card className="max-w-lg w-full">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 rounded-full">
                  <AlertTriangle className="h-6 w-6 text-red-600" />
                </div>
                <CardTitle className="text-red-600">오류가 발생했습니다</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-600">
                예상치 못한 오류가 발생했습니다. 페이지를 새로고침하거나 잠시 후 다시
                시도해주세요.
              </p>

              {process.env.NODE_ENV === 'development' && this.state.error && (
                <div className="p-4 bg-gray-100 rounded-lg">
                  <p className="text-sm font-medium text-gray-700 mb-2">
                    개발 모드 에러 정보:
                  </p>
                  <pre className="text-xs text-red-600 whitespace-pre-wrap overflow-auto">
                    {this.state.error.message}
                    {'\n\n'}
                    {this.state.error.stack}
                  </pre>
                </div>
              )}

              <div className="flex gap-3">
                <Button
                  onClick={() => window.location.reload()}
                  className="flex-1"
                >
                  페이지 새로고침
                </Button>
                <Button
                  variant="outline"
                  onClick={() => window.location.href = '/'}
                  className="flex-1"
                >
                  홈으로 이동
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * 함수형 컴포넌트용 Error Boundary Hook
 * (아직 React는 함수형 컴포넌트에서 에러 바운더리를 지원하지 않으므로 클래스 컴포넌트 사용)
 *
 * 사용 예:
 * ```tsx
 * export default function MyPage() {
 *   return (
 *     <ErrorBoundary>
 *       <PageContent />
 *     </ErrorBoundary>
 *   );
 * }
 * ```
 */
