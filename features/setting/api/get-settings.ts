'use server';

import { prisma } from '@/lib/prisma';
import type { AppSettings } from '../types';

/**
 * デフォルト設定値
 */
const DEFAULT_SETTINGS: AppSettings = {
  appTitle: 'Lowcode Platform',
  logoUrl: '/system/app-icon.png',
  faviconUrl: '/system/favicon.ico',
};

/**
 * アプリケーション設定を取得するServer Action
 *
 * データベースに設定がない場合はデフォルト値を返す
 */
export async function getSettings(): Promise<AppSettings> {
  const setting = await prisma.setting.findUnique({
    where: { id: 'singleton' },
  });

  return {
    appTitle: setting?.appTitle ?? DEFAULT_SETTINGS.appTitle,
    logoUrl: setting?.logoUrl ?? DEFAULT_SETTINGS.logoUrl,
    faviconUrl: setting?.faviconUrl ?? DEFAULT_SETTINGS.faviconUrl,
  };
}
