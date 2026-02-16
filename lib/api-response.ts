import { NextResponse } from 'next/server';

/**
 * エラーコード
 */
type ErrorCode =
  | 'BAD_REQUEST'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'VALIDATION_ERROR'
  | 'INTERNAL_ERROR';

/**
 * ページネーション情報
 */
type Pagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

/**
 * 成功レスポンス（単一リソース）
 */
export function apiSuccess<T>(data: T, status = 200): NextResponse {
  return NextResponse.json({ data }, { status });
}

/**
 * 成功レスポンス（一覧 + ページネーション）
 */
export function apiSuccessList<T>(
  data: T[],
  pagination: Pagination
): NextResponse {
  return NextResponse.json({ data, pagination });
}

/**
 * エラーレスポンス
 */
export function apiError(
  message: string,
  code: ErrorCode,
  status: number
): NextResponse {
  return NextResponse.json({ error: { message, code } }, { status });
}
