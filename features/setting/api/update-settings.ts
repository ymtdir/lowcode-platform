'use server';

import { prisma } from '@/lib/prisma';
import type { UpdateSettingInput, AppSettings } from '../types';

/**
 * アプリケーション設定を更新するServer Action
 *
 * データベースにレコードがない場合は作成し、ある場合は更新する（upsert）
 */
export async function updateSettings(
  input: UpdateSettingInput
): Promise<AppSettings> {
  const setting = await prisma.setting.upsert({
    where: { id: 'singleton' },
    create: {
      id: 'singleton',
      appTitle: input.appTitle,
      logoUrl: input.logoUrl,
      faviconUrl: input.faviconUrl,
    },
    update: {
      appTitle: input.appTitle,
      logoUrl: input.logoUrl,
      faviconUrl: input.faviconUrl,
    },
  });

  return {
    appTitle: setting.appTitle ?? 'Lowcode Platform',
    logoUrl: setting.logoUrl ?? '/system/app-icon.png',
    faviconUrl: setting.faviconUrl ?? '/system/favicon.ico',
  };
}
