/**
 * APIキー情報の型
 * plainTextKey は生成直後のみ非null（ハッシュ化のため以降は取得不可）
 */
export type ApiKeyInfo = {
  prefix: string;
  plainTextKey: string | null;
  lastUsedAt: Date | null;
  expiresAt: Date | null;
  createdAt: Date;
};
