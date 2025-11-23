'use client';

import { useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { renameItem } from '@/features/item/api';
import { toast } from 'sonner';

/**
 * SettingsContentのProps型
 */
type SettingsContentProps = {
  itemId: string;
  itemName: string;
};

/**
 * 設定コンテンツコンポーネント
 */
export function SettingsContent({ itemId, itemName }: SettingsContentProps) {
  const [isPending, startTransition] = useTransition();

  // フォーム送信時のハンドラ
  const handleSubmit = (formData: FormData) => {
    const name = formData.get('name') as string;
    startTransition(async () => {
      const result = await renameItem(itemId, name);
      if (result.success) {
        toast.success('テーブル名を更新しました');
      }
      if (result.error) {
        toast.error(result.error);
      }
    });
  };

  return (
    <>
      <div className="max-w-2xl space-y-8">
        {/* 基本設定セクション */}
        <section>
          <h3 className="text-lg font-medium mb-4">基本設定</h3>
          <form action={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">テーブル名</Label>
              <Input
                id="name"
                name="name"
                defaultValue={itemName}
                placeholder="テーブル名を入力"
              />
            </div>
            <Button type="submit" disabled={isPending}>
              {isPending ? '保存中...' : '保存'}
            </Button>
          </form>
        </section>

        {/* 将来実装予定のセクション */}
        <section className="pt-4 border-t">
          <h3 className="text-lg font-medium mb-4 text-muted-foreground">
            今後追加予定
          </h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>・ 権限設定</li>
            <li>・ スクリプト</li>
            <li>・ スタイルカスタマイズ</li>
          </ul>
        </section>
      </div>
    </>
  );
}
