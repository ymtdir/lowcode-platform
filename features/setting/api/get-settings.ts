'use server';

import { cache } from 'react';
import { prisma } from '@/lib/prisma';
import type { AppSettings } from '../types';

/**
 * デフォルト設定値
 */
const DEFAULT_SETTINGS: AppSettings = {
  appName: 'muku',
  appIcon: '/system/icon.png',
  appFavicon: '/system/favicon.ico',
  hideAppName: false,
};

/**
 * アプリケーション設定を取得するServer Action
 *
 * データベースに設定がない場合はデフォルト値を返す
 * React cacheでリクエスト単位でメモ化される
 */
export const getSettings = cache(async (): Promise<AppSettings> => {
  const setting = await prisma.setting.findUnique({
    where: { id: 'singleton' },
  });

  return {
    appName: setting?.appName ?? DEFAULT_SETTINGS.appName,
    appIcon: setting?.appIcon ?? DEFAULT_SETTINGS.appIcon,
    appFavicon: setting?.appFavicon ?? DEFAULT_SETTINGS.appFavicon,
    hideAppName: setting?.hideAppName ?? DEFAULT_SETTINGS.hideAppName,
  };
});
