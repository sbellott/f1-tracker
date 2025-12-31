import { NextResponse } from "next/server";

export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  meta?: ResponseMeta;
}

export interface ResponseMeta {
  pagination?: PaginationMeta;
  cached?: boolean;
  cachedAt?: string;
}

export interface PaginationMeta {
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

/**
 * Create a successful API response
 */
export function apiSuccess<T>(
  data: T,
  meta?: ResponseMeta,
  status: number = 200
): NextResponse<ApiSuccessResponse<T>> {
  return NextResponse.json(
    {
      success: true,
      data,
      ...(meta && { meta }),
    } as ApiSuccessResponse<T>,
    { status }
  );
}

/**
 * Create a paginated API response
 */
export function apiPaginated<T>(
  data: T[],
  pagination: {
    page: number;
    pageSize: number;
    totalCount: number;
  },
  additionalMeta?: Omit<ResponseMeta, "pagination">
): NextResponse<ApiSuccessResponse<T[]>> {
  const totalPages = Math.ceil(pagination.totalCount / pagination.pageSize);

  return NextResponse.json(
    {
      success: true,
      data,
      meta: {
        pagination: {
          page: pagination.page,
          pageSize: pagination.pageSize,
          totalCount: pagination.totalCount,
          totalPages,
          hasNextPage: pagination.page < totalPages,
          hasPrevPage: pagination.page > 1,
        },
        ...additionalMeta,
      },
    } as ApiSuccessResponse<T[]>,
    { status: 200 }
  );
}

/**
 * Create a created (201) response
 */
export function apiCreated<T>(data: T): NextResponse<ApiSuccessResponse<T>> {
  return apiSuccess(data, undefined, 201);
}

/**
 * Create a no content (204) response
 */
export function apiNoContent(): NextResponse {
  return new NextResponse(null, { status: 204 });
}

/**
 * Create a cached response with cache headers
 */
export function apiCached<T>(
  data: T,
  maxAge: number = 3600 // 1 hour default in seconds
): NextResponse<ApiSuccessResponse<T>> {
  const response = NextResponse.json(
    {
      success: true,
      data,
      meta: {
        cached: true,
        cachedAt: new Date().toISOString(),
      },
    } as ApiSuccessResponse<T>,
    { status: 200 }
  );

  response.headers.set(
    "Cache-Control",
    `public, s-maxage=${maxAge}, stale-while-revalidate=${maxAge * 2}`
  );

  return response;
}
