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
      appIcon: input.appIcon,
      appFavicon: input.appFavicon,
    },
    update: {
      appTitle: input.appTitle,
      appIcon: input.appIcon,
      appFavicon: input.appFavicon,
    },
  });

  return {
    appTitle: setting.appTitle ?? 'Lowcode Platform',
    appIcon: setting.appIcon ?? '/system/app-icon.png',
    appFavicon: setting.appFavicon ?? '/system/favicon.ico',
  };
}
