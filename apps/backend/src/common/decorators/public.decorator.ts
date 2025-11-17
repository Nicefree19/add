import { SetMetadata } from '@nestjs/common';

/**
 * 공개 엔드포인트 표시 데코레이터
 * 인증 없이 접근 가능한 엔드포인트에 사용
 *
 * @example
 * @Public()
 * @Post('/login')
 * async login(@Body() loginDto: LoginDto) {
 *   return this.authService.login(loginDto);
 * }
 */
export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
