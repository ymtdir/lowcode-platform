import {
  CaseSensitive,
  AlignLeft,
  Hash,
  Calendar,
  List,
  Tags,
  CheckSquare,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { ColumnType } from '../types/column';

/**
 * カラムタイプごとの設定
 */
export type ColumnConfig = {
  icon: LucideIcon;
  label: string;
  description: string;
  hasConfig: boolean; // 設定項目があるか
  defaultConfig?: Record<string, unknown>;
};

/**
 * カラムタイプの設定（Config-Driven UI）
 */
export const COLUMN_CONFIGS: Record<ColumnType, ColumnConfig> = {
  TEXT: {
    icon: CaseSensitive,
    label: 'テキスト',
    description: '短い文字列を入力できます',
    hasConfig: true,
    defaultConfig: {
      maxLength: 64,
      placeholder: '',
    },
  },
  TEXTAREA: {
    icon: AlignLeft,
    label: 'テキストエリア',
    description: '長い文章や詳細な説明を入力できます',
    hasConfig: true,
    defaultConfig: {
      maxLength: 5000,
      placeholder: '',
      rows: 4,
    },
  },
  NUMBER: {
    icon: Hash,
    label: '数値',
    description: '数値を入力できます',
    hasConfig: true,
    defaultConfig: {
      step: 1,
      placeholder: '',
    },
  },
  DATE: {
    icon: Calendar,
    label: '日付',
    description: 'カレンダーから日付を選択できます',
    hasConfig: true,
    defaultConfig: {
      format: 'YYYY-MM-DD',
    },
  },
  SELECT: {
    icon: List,
    label: 'セレクト',
    description: 'ドロップダウンから選択できます',
    hasConfig: true,
    defaultConfig: {
      options: [],
      allowCustom: false,
    },
  },
  MULTI_SELECT: {
    icon: Tags,
    label: 'マルチセレクト',
    description: '複数の選択肢から複数選択できます',
    hasConfig: true,
    defaultConfig: {
      options: [],
      allowCustom: false,
    },
  },
  CHECKBOX: {
    icon: CheckSquare,
    label: 'チェックボックス',
    description: 'ON/OFFを切り替えられます',
    hasConfig: true,
    defaultConfig: {
      defaultValue: false,
    },
  },
} as const;

/**
 * カラムタイプの配列（UI表示順）
 */
export const COLUMN_TYPE_LIST: ColumnType[] = [
  'TEXT',
  'TEXTAREA',
  'NUMBER',
  'DATE',
  'SELECT',
  'MULTI_SELECT',
  'CHECKBOX',
] as const;

/**
 * カラムタイプの表示名を取得
 */
export function getColumnTypeLabel(type: ColumnType): string {
  return COLUMN_CONFIGS[type].label;
}

/**
 * カラムタイプの説明を取得
 */
export function getColumnTypeDescription(type: ColumnType): string {
  return COLUMN_CONFIGS[type].description;
}

/**
 * カラムタイプのアイコンを取得
 */
export function getColumnTypeIcon(type: ColumnType): LucideIcon {
  return COLUMN_CONFIGS[type].icon;
}
