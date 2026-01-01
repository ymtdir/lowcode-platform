import type { Setting as PrismaSetting } from '@prisma/client';

/**
 * 設定型
 */
export type Setting = PrismaSetting;

/**
 * アプリケーション設定（デフォルト値込み）
 */
export type AppSettings = {
  appTitle: string;
  appIcon: string;
  appFavicon: string;
};

/**
 * 設定更新用の入力型
 */
export type UpdateSettingInput = {
  appTitle?: string;
  appIcon?: string;
  appFavicon?: string;
};
