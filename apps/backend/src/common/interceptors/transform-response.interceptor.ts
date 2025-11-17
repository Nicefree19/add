import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { BaseResponseDto, SuccessResponse } from '../dto/base-response.dto';

/**
 * 응답 변환 인터셉터
 *
 * 모든 성공 응답을 { success: true, data: ... } 형식으로 통일
 *
 * @example
 * // Controller에서 반환
 * return { id: 1, name: 'John' };
 *
 * // 클라이언트가 받는 응답
 * {
 *   success: true,
 *   data: { id: 1, name: 'John' }
 * }
 */
@Injectable()
export class TransformResponseInterceptor<T>
  implements NestInterceptor<T, SuccessResponse<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<SuccessResponse<T>> {
    return next.handle().pipe(
      map((data) => {
        // 이미 BaseResponseDto 형식인 경우 그대로 반환
        if (data && typeof data === 'object' && 'success' in data) {
          return data as SuccessResponse<T>;
        }

        // 일반 데이터를 BaseResponseDto.success로 래핑
        return BaseResponseDto.success(data);
      }),
    );
  }
}
