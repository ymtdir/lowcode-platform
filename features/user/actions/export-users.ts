'use server';

import { prisma } from '@/lib/prisma';
import { convertToCSV } from '@/lib/csv';
import type { UserRole } from '@prisma/client';
import type {
  ExportColumnFilter,
  ExportSorting,
} from '@/features/table/types/export';

/**
 * ユーザーデータをCSVエクスポートするServer Action
 */
export async function exportUsersAction(
  filters: ExportColumnFilter[],
  sorting: ExportSorting[]
) {
  // フィルタ条件を構築
  const where: {
    email?: { contains: string; mode: 'insensitive' };
    name?: { contains: string; mode: 'insensitive' };
    role?: UserRole;
  } = {};

  filters.forEach((filter) => {
    const { id, value } = filter;
    if (typeof value === 'string' && value.trim() !== '') {
      if (id === 'email') {
        where.email = { contains: value, mode: 'insensitive' };
      } else if (id === 'name') {
        where.name = { contains: value, mode: 'insensitive' };
      } else if (id === 'role') {
        where.role = value as UserRole;
      }
    }
  });

  // ソート条件を構築
  const orderBy: Record<string, 'asc' | 'desc'>[] = [];
  sorting.forEach((sort) => {
    const { id, desc } = sort;
    if (
      id === 'email' ||
      id === 'name' ||
      id === 'role' ||
      id === 'createdAt'
    ) {
      orderBy.push({ [id]: desc ? 'desc' : 'asc' });
    }
  });

  // ユーザーデータを取得
  const users = await prisma.user.findMany({
    where,
    orderBy: orderBy.length > 0 ? orderBy : { createdAt: 'desc' },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      createdAt: true,
    },
  });

  // ヘッダー行を作成
  const headers = ['ID', 'メールアドレス', '名前', 'ロール', '作成日'];

  // データ行を作成
  const rows = users.map((user) => [
    user.id,
    user.email,
    user.name || '',
    user.role,
    user.createdAt.toISOString().split('T')[0], // YYYY-MM-DD
  ]);

  // CSV変換
  const csv = convertToCSV(headers, rows);

  // タイムスタンプ付きファイル名を生成
  const timestamp = new Date()
    .toLocaleString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
    .replace(/[/:\s]/g, '-');
  const filename = `ユーザー管理_${timestamp}.csv`;

  return { csv, filename };
}
