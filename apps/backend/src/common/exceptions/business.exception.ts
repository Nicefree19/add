import { HttpException } from '@nestjs/common';
import {
  ErrorCode,
  ErrorMessages,
  ErrorCodeToHttpStatus,
} from '../constants/error-codes';

/**
 * 비즈니스 로직 예외 클래스
 *
 * 도메인별 에러를 명확하게 표현하기 위한 커스텀 예외
 *
 * @example
 * throw new BusinessException(
 *   ErrorCode.USER_NOT_FOUND,
 *   '사용자를 찾을 수 없습니다.'
 * );
 */
export class BusinessException extends HttpException {
  constructor(
    public readonly code: ErrorCode,
    message?: string,
    public readonly details?: any,
  ) {
    const statusCode = ErrorCodeToHttpStatus[code] || 500;
    const errorMessage = message || ErrorMessages[code];

    super(
      {
        code,
        message: errorMessage,
        ...(details && { details }),
      },
      statusCode,
    );
  }
}
