import {
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ThemeToggle } from '@/features/theme/components/theme-toggle';

export function AccountSettingsDialog() {
  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>アカウント設定</DialogTitle>
        <DialogDescription>
          アカウント設定の内容をここに表示します。
        </DialogDescription>
      </DialogHeader>
      <div className="space-y-4 py-4">
        <div className="space-y-2">
          <h3 className="text-sm font-medium">テーマ</h3>
          <ThemeToggle />
        </div>
      </div>
    </DialogContent>
  );
}
