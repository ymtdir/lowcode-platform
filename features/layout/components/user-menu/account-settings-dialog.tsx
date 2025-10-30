import {
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ThemeSelector } from '@/features/theme/components/theme-selector';

export function AccountSettingsDialog() {
  return (
    <DialogContent className="bg-card">
      <DialogHeader>
        <DialogTitle>アカウント設定</DialogTitle>
        <DialogDescription>
          アカウント設定の内容をここに表示します。
        </DialogDescription>
      </DialogHeader>
      <div className="py-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium">テーマ</h3>
          <ThemeSelector />
        </div>
      </div>
    </DialogContent>
  );
}
