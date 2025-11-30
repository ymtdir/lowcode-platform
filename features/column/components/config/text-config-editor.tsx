'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

/**
 * TextConfigEditorのProps
 */
type TextConfigEditorProps = {
  config: {
    placeholder?: string;
    defaultValue?: string;
  };
  onChange: (config: { placeholder?: string; defaultValue?: string }) => void;
};

/**
 * TEXT型カラムの設定エディタコンポーネント
 */
export function TextConfigEditor({ config, onChange }: TextConfigEditorProps) {
  return (
    <div className="grid gap-4">
      <div className="grid gap-2">
        <Label htmlFor="placeholder">プレースホルダー</Label>
        <Input
          id="placeholder"
          value={config.placeholder || ''}
          onChange={(e) =>
            onChange({
              ...config,
              placeholder: e.target.value || undefined,
            })
          }
          placeholder="入力欄に表示するヒントテキスト"
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="defaultValue">デフォルト値</Label>
        <Input
          id="defaultValue"
          value={config.defaultValue || ''}
          onChange={(e) =>
            onChange({
              ...config,
              defaultValue: e.target.value || undefined,
            })
          }
          placeholder="新規レコード作成時の初期値"
        />
      </div>
    </div>
  );
}
