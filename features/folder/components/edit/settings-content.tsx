'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { renameItem } from '@/features/item/api/rename-item';
import { toast } from 'sonner';

/**
 * SettingsContentのProps型
 */
type SettingsContentProps = {
  folderId: string;
  folderName: string;
};

/**
 * フォルダ基本設定コンテンツコンポーネント
 */
export function SettingsContent({
  folderId,
  folderName,
}: SettingsContentProps) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  // フォーム送信時のハンドラ
  const handleSubmit = (formData: FormData) => {
    const name = formData.get('name') as string;
    startTransition(async () => {
      const result = await renameItem(folderId, name);
      if (result.success) {
        toast.success('フォルダ名を更新しました');
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

  return (
    <>
      <div className="max-w-2xl space-y-8">
        {/* 基本設定セクション */}
        <section>
          <form action={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">フォルダ名</Label>
              <div className="flex gap-2 py-2">
                <Input
                  id="name"
                  name="name"
                  defaultValue={folderName}
                  placeholder="フォルダ名を入力"
                />
                <Button type="submit" disabled={isPending}>
                  {isPending ? '保存中...' : '保存'}
                </Button>
              </div>
            </div>
          </form>
        </section>
      </div>
    </>
  );
}
