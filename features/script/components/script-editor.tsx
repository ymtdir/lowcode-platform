'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { CodeEditor } from '@/components/shared/code-editor';
import { Button } from '@/components/ui/button';
import { updateScript, type Script } from '@/features/script';

type ScriptEditorProps = {
  initialScript: Script;
};

/**
 * カスタムスクリプト編集コンポーネント
 */
export function ScriptEditor({ initialScript }: ScriptEditorProps) {
  const [content, setContent] = useState(initialScript.content);
  const [isSaving, setIsSaving] = useState(false);

  const hasChanges = content !== initialScript.content;

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const result = await updateScript(content);
      if (result.error) {
        toast.error('スクリプトの保存に失敗しました', {
          description: result.error,
        });
      } else {
        toast.success('スクリプトを保存しました');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setContent(initialScript.content);
  };

  return (
    <div className="space-y-4">
      <div className="border rounded-lg overflow-hidden">
        <CodeEditor
          value={content}
          onChange={setContent}
          language="javascript"
          height="400px"
        />
      </div>
      <div className="flex justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={handleReset}
          disabled={!hasChanges || isSaving}
        >
          キャンセル
        </Button>
        <Button onClick={handleSave} disabled={!hasChanges || isSaving}>
          {isSaving ? '保存中...' : '保存'}
        </Button>
      </div>
    </div>
  );
}
