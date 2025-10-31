import {
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ThemeSelector } from '@/features/theme/components/theme-selector';
import { ColorSelector } from '@/features/theme/components/color-selector';

export function AccountSettingsDialog() {
  return (
    <DialogContent className="bg-card">
      <DialogHeader>
        <DialogTitle>アカウント設定</DialogTitle>
        <DialogDescription>
          アカウント設定の内容をここに表示します。
        </DialogDescription>
      </DialogHeader>
      <div className="space-y-4 py-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium">テーマ</h3>
          <ThemeSelector />
        </div>
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium">カラー</h3>
          <ColorSelector />
        </div>
      </div>
    </DialogContent>
  );
}
