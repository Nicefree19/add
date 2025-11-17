import { ErrorCode } from '../constants/error-codes';

/**
 * 에러 응답 구조
 */
export interface ErrorResponse {
  code: ErrorCode | string;
  message: string;
  details?: any;
}

/**
 * 성공 응답 구조
 */
export interface SuccessResponse<T = any> {
  success: true;
  data: T;
}

/**
 * 실패 응답 구조
 */
export interface FailureResponse {
  success: false;
  error: ErrorResponse;
}

/**
 * 통합 API 응답 타입
 */
export type ApiResponse<T = any> = SuccessResponse<T> | FailureResponse;

/**
 * 성공 응답 생성 헬퍼
 */
export class BaseResponseDto {
  /**
   * 성공 응답 생성
   * @param data 응답 데이터
   * @returns SuccessResponse
   */
  static success<T>(data: T): SuccessResponse<T> {
    return {
      success: true,
      data,
    };
  }

  /**
   * 실패 응답 생성
   * @param code 에러 코드
   * @param message 에러 메시지
   * @param details 추가 상세 정보 (선택)
   * @returns FailureResponse
   */
  static failure(
    code: ErrorCode | string,
    message: string,
    details?: any,
  ): FailureResponse {
    return {
      success: false,
      error: {
        code,
        message,
        ...(details && { details }),
      },
    };
  }
}
