'use client';

import { useState, useTransition, createElement } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { renameItem, updateItemIcon } from '@/features/item/api';
import { IconPickerDialog } from '@/features/item/components';
import { getItemIcon } from '@/features/item/utils';
import { toast } from 'sonner';
import type { Item } from '@/features/item/types';

/**
 * SettingsContentのProps型
 */
type SettingsContentProps = {
  itemId: string;
  itemName: string;
  itemIcon?: string | null;
};

/**
 * 設定コンテンツコンポーネント
 */
export function SettingsContent({
  itemId,
  itemName,
  itemIcon,
}: SettingsContentProps) {
  const [isPending, startTransition] = useTransition();
  const [iconDialogOpen, setIconDialogOpen] = useState(false);
  const [currentIcon, setCurrentIcon] = useState<string | null>(
    itemIcon ?? null
  );
  const router = useRouter();

  // アイコン取得（表示用）
  const mockItem: Pick<Item, 'icon' | 'type'> = {
    icon: currentIcon,
    type: 'TABLE',
  };
  const IconComponent = getItemIcon(mockItem as Item);

  // フォーム送信時のハンドラ
  const handleSubmit = (formData: FormData) => {
    const name = formData.get('name') as string;
    startTransition(async () => {
      const result = await renameItem(itemId, name);
      if (result.success) {
        toast.success('テーブル名を更新しました');
        // ページをリフレッシュしてパンくずリストを更新
        router.refresh();
        // パンくずリストの強制更新イベントを発火
        window.dispatchEvent(new CustomEvent('refreshBreadcrumb'));
      }
      if (result.error) {
        toast.error(result.error);
      }
    });
  };

  // アイコン選択ハンドラ
  const handleIconSelect = async (iconName: string | null) => {
    const result = await updateItemIcon(itemId, iconName);
    if (result.success) {
      // サーバーから返された正規化されたアイコン名を使用
      setCurrentIcon(result.iconName ?? null);
      toast.success('アイコンを更新しました');
      router.refresh();
    } else {
      toast.error(result.error || 'アイコンの更新に失敗しました');
    }
  };

  return (
    <>
      <div className="max-w-2xl space-y-8">
        {/* 基本設定セクション */}
        <section>
          <form action={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">テーブル名</Label>
              <div className="flex gap-2 py-2">
                <Input
                  id="name"
                  name="name"
                  defaultValue={itemName}
                  placeholder="テーブル名を入力"
                />
                <Button type="submit" disabled={isPending}>
                  {isPending ? '保存中...' : '保存'}
                </Button>
              </div>
            </div>
          </form>
        </section>

        {/* アイコン設定セクション */}
        <section>
          <div className="space-y-2">
            <Label>テーブルアイコン</Label>
            <button
              type="button"
              onClick={() => setIconDialogOpen(true)}
              className="flex items-center gap-2 py-2 hover:opacity-70 transition-opacity"
            >
              <div className="rounded-md border p-2 hover:bg-accent">
                {createElement(IconComponent, { className: 'size-8' })}
              </div>
              <span className="text-sm text-muted-foreground">
                {currentIcon ? `カスタム: ${currentIcon}` : 'デフォルト'}
              </span>
            </button>
          </div>
        </section>
      </div>

      <IconPickerDialog
        open={iconDialogOpen}
        onOpenChange={setIconDialogOpen}
        onSelect={handleIconSelect}
        currentIcon={currentIcon}
      />
    </>
  );
}
