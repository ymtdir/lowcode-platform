'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

/**
 * TextareaConfigEditorのProps
 */
type TextareaConfigEditorProps = {
  config: {
    placeholder?: string;
    defaultValue?: string;
  };
  onChange: (config: { placeholder?: string; defaultValue?: string }) => void;
};

/**
 * TEXTAREA型カラムの設定エディタコンポーネント
 */
export function TextareaConfigEditor({
  config,
  onChange,
}: TextareaConfigEditorProps) {
  return (
    <div className="grid gap-4">
      <div className="grid gap-2">
        <Label htmlFor="textarea-placeholder">プレースホルダー</Label>
        <Input
          id="textarea-placeholder"
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
        <Label htmlFor="textarea-defaultValue">デフォルト値</Label>
        <Textarea
          id="textarea-defaultValue"
          value={config.defaultValue || ''}
          onChange={(e) =>
            onChange({
              ...config,
              defaultValue: e.target.value || undefined,
            })
          }
          placeholder="新規レコード作成時の初期値"
          rows={3}
        />
      </div>
    </div>
  );
}
