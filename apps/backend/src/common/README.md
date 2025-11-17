# Common Module - 공통 레이어

NestJS 백엔드의 공통 응답 포맷, 에러 처리, 인증/인가 Guards를 제공합니다.

## 📁 디렉토리 구조

```
common/
├── constants/           # 상수 정의 (에러 코드 등)
│   └── error-codes.ts
├── dto/                 # 공통 DTO
│   ├── base-response.dto.ts
│   └── pagination.dto.ts
├── decorators/          # 커스텀 데코레이터
│   ├── current-user.decorator.ts
│   ├── public.decorator.ts
│   └── roles.decorator.ts
├── exceptions/          # 커스텀 예외
│   └── business.exception.ts
├── filters/             # 예외 필터
│   └── http-exception.filter.ts
├── guards/              # 인증/인가 Guard
│   ├── jwt-auth.guard.ts
│   └── roles.guard.ts
└── interceptors/        # 인터셉터
    └── transform-response.interceptor.ts
```

## 🎯 통일된 응답 포맷

### 성공 응답

```typescript
{
  "success": true,
  "data": {
    // ... 실제 데이터
  }
}
```

### 실패 응답

```typescript
{
  "success": false,
  "error": {
    "code": "USER_NOT_FOUND",
    "message": "사용자를 찾을 수 없습니다.",
    "details": { /* 선택적 상세 정보 */ }
  }
}
```

## 🚀 사용 방법

### 1. main.ts에서 전역 설정

```typescript
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { TransformResponseInterceptor } from './common/interceptors/transform-response.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 전역 필터 적용
  app.useGlobalFilters(new HttpExceptionFilter());

  // 전역 인터셉터 적용
  app.useGlobalInterceptors(new TransformResponseInterceptor());

  await app.listen(3000);
}
bootstrap();
```

### 2. Controller에서 사용

```typescript
import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import {
  JwtAuthGuard,
  RolesGuard,
  Roles,
  CurrentUser,
  Public,
  BusinessException,
  ErrorCode,
} from './common';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UserController {
  // 공개 엔드포인트 (인증 불필요)
  @Public()
  @Post('/register')
  async register(@Body() dto: CreateUserDto) {
    // 일반 객체 반환 -> 자동으로 { success: true, data: ... }로 변환됨
    return this.userService.create(dto);
  }

  // 인증 필요 (기본)
  @Get('/me')
  async getMe(@CurrentUser() user: CurrentUserPayload) {
    return user;
  }

  // 역할 기반 접근 제어
  @Roles('ADMIN')
  @Delete('/:id')
  async deleteUser(@Param('id') id: string) {
    // 에러 발생
    if (!user) {
      throw new BusinessException(ErrorCode.USER_NOT_FOUND);
    }

    return this.userService.delete(id);
  }
}
```

### 3. Service에서 에러 처리

```typescript
import { Injectable } from '@nestjs/common';
import { BusinessException, ErrorCode } from '../common';

@Injectable()
export class UserService {
  async findById(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });

    if (!user) {
      throw new BusinessException(
        ErrorCode.USER_NOT_FOUND,
        '사용자를 찾을 수 없습니다.',
      );
    }

    return user;
  }

  async create(dto: CreateUserDto) {
    // 이메일 중복 체크
    const exists = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (exists) {
      throw new BusinessException(
        ErrorCode.USER_EMAIL_DUPLICATE,
        '이미 사용 중인 이메일입니다.',
        { email: dto.email }, // 선택적 상세 정보
      );
    }

    return this.prisma.user.create({ data: dto });
  }
}
```

## 📋 에러 코드 규칙

에러 코드는 prefix로 도메인을 구분합니다:

- `AUTH_*`: 인증/인가 관련
- `USER_*`: 사용자 관련
- `ELECTION_*`: 선거 관련
- `VOTE_*`: 투표 관련
- `RECOMMEND_*`: 추천 관련
- `CANDIDATE_*`: 후보 관련
- `SYSTEM_*`: 시스템/일반 에러

### 주요 에러 코드 예시

```typescript
// 인증
AUTH_UNAUTHORIZED          // 401: 인증되지 않음
AUTH_FORBIDDEN             // 403: 권한 없음
AUTH_TOKEN_EXPIRED         // 401: 토큰 만료

// 사용자
USER_NOT_FOUND             // 404: 사용자 없음
USER_EMAIL_DUPLICATE       // 409: 이메일 중복
USER_EMPLOYEE_NO_DUPLICATE // 409: 사번 중복

// 투표
VOTE_ALREADY_EXISTS        // 409: 이미 투표함
VOTE_PERIOD_ENDED          // 400: 투표 기간 종료
VOTE_DUPLICATE_FOR_ROLE    // 409: 같은 역할에 중복 투표
```

## 🔒 Guards

### JwtAuthGuard

JWT 토큰을 검증하고 `request.user`에 사용자 정보를 설정합니다.

**TODO**: AuthModule 구현 시 실제 JWT 검증 로직 추가 필요

```typescript
@UseGuards(JwtAuthGuard)
@Get('/protected')
async getProtectedData() {
  return { message: 'Protected' };
}
```

### RolesGuard

역할 기반 접근 제어를 수행합니다.

```typescript
@Roles('ADMIN', 'MEMBER')
@UseGuards(JwtAuthGuard, RolesGuard)
@Get('/admin')
async getAdminData() {
  return { message: 'Admin only' };
}
```

## 🎨 Decorators

### @Public()

인증 없이 접근 가능한 공개 엔드포인트를 표시합니다.

```typescript
@Public()
@Post('/login')
async login(@Body() dto: LoginDto) {
  return this.authService.login(dto);
}
```

### @CurrentUser()

현재 인증된 사용자 정보를 가져옵니다.

```typescript
@Get('/me')
async getMe(@CurrentUser() user: CurrentUserPayload) {
  return user;
}

// 특정 필드만 가져오기
@Get('/email')
async getEmail(@CurrentUser('email') email: string) {
  return { email };
}
```

### @Roles()

접근 가능한 역할을 지정합니다.

```typescript
@Roles('ADMIN')
@Delete('/:id')
async deleteUser(@Param('id') id: string) {
  return this.userService.delete(id);
}
```

## 📝 페이지네이션

```typescript
import { PaginationDto, PaginationHelper } from './common';

@Get()
async findAll(@Query() pagination: PaginationDto) {
  const { page = 1, limit = 10 } = pagination;

  // Prisma 파라미터 계산
  const { skip, take } = PaginationHelper.getPrismaParams(page, limit);

  const [items, total] = await Promise.all([
    this.prisma.user.findMany({ skip, take }),
    this.prisma.user.count(),
  ]);

  // 페이지네이션 응답 생성
  return PaginationHelper.createResponse(items, total, page, limit);
}
```

응답:

```json
{
  "success": true,
  "data": {
    "items": [...],
    "meta": {
      "total": 100,
      "page": 1,
      "limit": 10,
      "totalPages": 10,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```

## 🔧 추가 구현 필요 사항

### JwtAuthGuard

현재는 Mock 데이터를 반환합니다. AuthModule 구현 시:

1. JwtService 주입
2. 실제 토큰 검증 로직 구현
3. 토큰에서 사용자 정보 추출

```typescript
// TODO: 실제 구현
const payload = await this.jwtService.verifyAsync(token);
request.user = {
  userId: payload.sub,
  employeeNo: payload.employeeNo,
  email: payload.email,
  name: payload.name,
  role: payload.role,
};
```

## 📚 참고

- [NestJS Exception Filters](https://docs.nestjs.com/exception-filters)
- [NestJS Guards](https://docs.nestjs.com/guards)
- [NestJS Interceptors](https://docs.nestjs.com/interceptors)
- [NestJS Custom Decorators](https://docs.nestjs.com/custom-decorators)
