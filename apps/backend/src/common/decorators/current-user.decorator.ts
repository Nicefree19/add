import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * 현재 인증된 사용자 정보 타입
 */
export interface CurrentUserPayload {
  userId: string;
  employeeNo: string;
  email: string;
  name: string;
  role: string;
}

/**
 * 현재 인증된 사용자 정보를 가져오는 데코레이터
 *
 * @example
 * @Get('/me')
 * async getMe(@CurrentUser() user: CurrentUserPayload) {
 *   return user;
 * }
 */
export const CurrentUser = createParamDecorator(
  (data: keyof CurrentUserPayload | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user as CurrentUserPayload;

    return data ? user?.[data] : user;
  },
);
