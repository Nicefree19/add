/**
 * 페이지네이션 요청 DTO
 */
export class PaginationDto {
  page?: number = 1;
  limit?: number = 10;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc' = 'desc';
}

/**
 * 페이지네이션 메타데이터
 */
export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

/**
 * 페이지네이션 응답 데이터
 */
export interface PaginatedResponse<T> {
  items: T[];
  meta: PaginationMeta;
}

/**
 * 페이지네이션 응답 생성 헬퍼
 */
export class PaginationHelper {
  /**
   * 페이지네이션 응답 생성
   */
  static createResponse<T>(
    items: T[],
    total: number,
    page: number,
    limit: number,
  ): PaginatedResponse<T> {
    const totalPages = Math.ceil(total / limit);

    return {
      items,
      meta: {
        total,
        page,
        limit,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
  }

  /**
   * Prisma skip/take 계산
   */
  static getPrismaParams(page: number, limit: number) {
    return {
      skip: (page - 1) * limit,
      take: limit,
    };
  }
}
