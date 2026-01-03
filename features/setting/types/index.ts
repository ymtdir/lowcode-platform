import type { Setting as PrismaSetting } from '@prisma/client';

/**
 * 設定型
 */
export type Setting = PrismaSetting;

/**
 * アプリケーション設定（デフォルト値込み）
 */
export type AppSettings = {
  appName: string;
  appIcon: string;
  appFavicon: string;
  hideAppName: boolean;
};

/**
 * 設定更新用の入力型
 */
export type UpdateSettingInput = {
  appName?: string;
  appIcon?: string;
  appFavicon?: string;
  hideAppName?: boolean;
};
