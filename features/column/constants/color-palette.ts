/**
 * 選択肢に使用できるカラーパレット
 */
export const COLOR_PALETTE = [
  { name: 'グレー', value: '#6b7280' },
  { name: 'レッド', value: '#ef4444' },
  { name: 'オレンジ', value: '#f97316' },
  { name: 'イエロー', value: '#eab308' },
  { name: 'グリーン', value: '#22c55e' },
  { name: 'ブルー', value: '#3b82f6' },
  { name: 'インディゴ', value: '#6366f1' },
  { name: 'パープル', value: '#a855f7' },
  { name: 'ピンク', value: '#ec4899' },
] as const;

/**
 * デフォルトのカラー（グレー）
 */
export const DEFAULT_COLOR = COLOR_PALETTE[0].value;
