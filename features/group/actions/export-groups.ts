'use server';

import { prisma } from '@/lib/prisma';
import { convertToCSV } from '@/lib/csv';
import type { ExportColumnFilter } from '@/features/table/types/export';

/**
 * グループデータをCSVエクスポートするServer Action
 */
export async function exportGroupsAction(filters: ExportColumnFilter[]) {
  // フィルタ条件を構築
  const where: {
    name?: { contains: string; mode: 'insensitive' };
    description?: { contains: string; mode: 'insensitive' };
    parentId?: string | null;
  } = {};

  filters.forEach((filter) => {
    const { id, value } = filter;
    if (typeof value === 'string' && value.trim() !== '') {
      if (id === 'name') {
        where.name = { contains: value, mode: 'insensitive' };
      } else if (id === 'description') {
        where.description = { contains: value, mode: 'insensitive' };
      } else if (id === 'parentId') {
        where.parentId = value;
      }
    }
  });

  // グループデータを取得
  // 注: ソートはクライアントサイド（TanStack Table）で処理済み
  const groups = await prisma.group.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      name: true,
      description: true,
      createdAt: true,
      parent: {
        select: {
          name: true,
        },
      },
      _count: {
        select: {
          members: true,
        },
      },
    },
  });

  // ヘッダー行を作成
  const headers = [
    'ID',
    'グループ名',
    '説明',
    '親グループ',
    'メンバー数',
    '作成日',
  ];

  // データ行を作成
  const rows = groups.map((group) => [
    group.id,
    group.name,
    group.description || '',
    group.parent?.name || '',
    group._count.members.toString(),
    group.createdAt.toISOString().split('T')[0], // YYYY-MM-DD
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
  const filename = `グループ管理_${timestamp}.csv`;

  return { csv, filename };
}
