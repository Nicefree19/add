import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';
import { BaseResponseDto } from '../dto/base-response.dto';
import { ErrorCode } from '../constants/error-codes';
import { BusinessException } from '../exceptions/business.exception';

/**
 * HTTP 예외 필터
 *
 * 모든 예외를 { success: false, error: { code, message } } 형식으로 통일
 *
 * @example
 * // 예외 발생
 * throw new BusinessException(ErrorCode.USER_NOT_FOUND);
 *
 * // 클라이언트가 받는 응답
 * {
 *   success: false,
 *   error: {
 *     code: "USER_NOT_FOUND",
 *     message: "사용자를 찾을 수 없습니다."
 *   }
 * }
 */
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest();

    // 기본값 설정
    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let errorCode: ErrorCode | string = ErrorCode.SYSTEM_INTERNAL_ERROR;
    let message = '서버 내부 오류가 발생했습니다.';
    let details: any = undefined;

    // BusinessException 처리
    if (exception instanceof BusinessException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse() as any;
      errorCode = exceptionResponse.code || exception.code;
      message = exceptionResponse.message || exception.message;
      details = exception.details;
    }
    // HttpException 처리
    else if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'object') {
        const response = exceptionResponse as any;

        // Validation 에러 처리 (class-validator)
        if (response.message && Array.isArray(response.message)) {
          errorCode = ErrorCode.SYSTEM_VALIDATION_ERROR;
          message = '입력값 검증에 실패했습니다.';
          details = response.message;
        } else {
          errorCode = this.getErrorCodeFromStatus(status);
          message = response.message || exception.message;
          details = response.error;
        }
      } else {
        errorCode = this.getErrorCodeFromStatus(status);
        message = exceptionResponse.toString();
      }
    }
    // 일반 Error 처리
    else if (exception instanceof Error) {
      message = exception.message;
      this.logger.error(
        `Unhandled error: ${exception.message}`,
        exception.stack,
      );
    }

    // 에러 로깅
    this.logger.error(
      `[${request.method}] ${request.url} - ${status} ${errorCode}: ${message}`,
      exception instanceof Error ? exception.stack : undefined,
    );

    // 통일된 에러 응답 반환
    const errorResponse = BaseResponseDto.failure(errorCode, message, details);

    response.status(status).json(errorResponse);
  }

  /**
   * HTTP 상태 코드에서 에러 코드 매핑
   */
  private getErrorCodeFromStatus(status: number): ErrorCode {
    switch (status) {
      case HttpStatus.UNAUTHORIZED:
        return ErrorCode.AUTH_UNAUTHORIZED;
      case HttpStatus.FORBIDDEN:
        return ErrorCode.AUTH_FORBIDDEN;
      case HttpStatus.NOT_FOUND:
        return ErrorCode.SYSTEM_NOT_FOUND;
      case HttpStatus.CONFLICT:
        return ErrorCode.SYSTEM_CONFLICT;
      case HttpStatus.BAD_REQUEST:
        return ErrorCode.SYSTEM_BAD_REQUEST;
      default:
        return ErrorCode.SYSTEM_INTERNAL_ERROR;
    }
  }
}
