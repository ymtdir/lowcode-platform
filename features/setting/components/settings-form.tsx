'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import Image from 'next/image';
import { Image as ImageIcon } from 'lucide-react';
import { Field, FieldGroup, FieldLabel, FieldSet } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { updateSettings } from '@/features/setting/api';
import { ImagePickerDialog } from './image-picker-dialog';
import { StyleEditor, type Style } from '@/features/style';
import { ScriptEditor, type Script } from '@/features/script';
import type { AppSettings } from '@/features/setting/types';

type SettingsFormProps = {
  initialSettings: AppSettings;
  initialGlobalStyles: Style[];
  initialGlobalScripts: Script[];
};

export function SettingsForm({
  initialSettings,
  initialGlobalStyles,
  initialGlobalScripts,
}: SettingsFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [appName, setAppName] = useState(initialSettings.appName);
  const [appIcon, setAppIcon] = useState(initialSettings.appIcon);
  const [appFavicon, setAppFavicon] = useState(initialSettings.appFavicon);
  const [hideAppName, setHideAppName] = useState(initialSettings.hideAppName);
  const [isIconPickerOpen, setIsIconPickerOpen] = useState(false);
  const [isFaviconPickerOpen, setIsFaviconPickerOpen] = useState(false);

  // 基本設定の変更があるかどうかを判定
  const hasChanges = useMemo(() => {
    return (
      appName !== initialSettings.appName ||
      appIcon !== initialSettings.appIcon ||
      appFavicon !== initialSettings.appFavicon ||
      hideAppName !== initialSettings.hideAppName
    );
  }, [appName, appIcon, appFavicon, hideAppName, initialSettings]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await updateSettings({
        appName,
        appIcon,
        appFavicon,
        hideAppName,
      });

      toast.success('設定を更新しました');
      router.refresh();
    } catch (error) {
      console.error('Failed to update settings:', error);
      toast.error('設定の更新に失敗しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setAppName(initialSettings.appName);
    setAppIcon(initialSettings.appIcon);
    setAppFavicon(initialSettings.appFavicon);
    setHideAppName(initialSettings.hideAppName);
  };

  return (
    <div className="w-full max-w-4xl space-y-8">
      {/* 基本設定フォーム */}
      <form onSubmit={handleSubmit}>
        <FieldSet>
          <FieldGroup>
            <Field>
              <div className="flex items-center justify-between">
                <FieldLabel htmlFor="hideAppName">
                  アプリケーション名を非表示
                </FieldLabel>
                <Switch
                  id="hideAppName"
                  checked={hideAppName}
                  onCheckedChange={setHideAppName}
                />
              </div>
            </Field>
            <Field>
              <FieldLabel htmlFor="appName">アプリケーション名</FieldLabel>
              <Input
                id="appName"
                type="text"
                value={appName}
                onChange={(e) => setAppName(e.target.value)}
                placeholder="Lowcode Platform"
                disabled={hideAppName}
              />
            </Field>

            <Field>
              <FieldLabel>アプリアイコン</FieldLabel>
              <button
                type="button"
                onClick={() => setIsIconPickerOpen(true)}
                className="w-full p-4 border-2 border-dashed rounded-lg hover:bg-muted/50 transition-colors text-left"
              >
                {appIcon ? (
                  <div className="flex items-center gap-3">
                    <div className="relative w-12 h-12 rounded overflow-hidden bg-white border shrink-0">
                      {appIcon.endsWith('.ico') ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={appIcon}
                          alt="App Icon"
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <Image
                          src={appIcon}
                          alt="App Icon"
                          fill
                          className="object-contain"
                        />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {appIcon.split('/').pop()}
                      </p>
                    </div>
                    <ImageIcon className="h-5 w-5 text-muted-foreground shrink-0" />
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2 text-muted-foreground">
                    <ImageIcon className="h-5 w-5" />
                    <span className="text-sm">画像を選択</span>
                  </div>
                )}
              </button>
            </Field>

            <Field>
              <FieldLabel>ファビコン</FieldLabel>
              <button
                type="button"
                onClick={() => setIsFaviconPickerOpen(true)}
                className="w-full p-4 border-2 border-dashed rounded-lg hover:bg-muted/50 transition-colors text-left"
              >
                {appFavicon ? (
                  <div className="flex items-center gap-3">
                    <div className="relative w-12 h-12 rounded overflow-hidden bg-white border shrink-0">
                      {appFavicon.endsWith('.ico') ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={appFavicon}
                          alt="Favicon"
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <Image
                          src={appFavicon}
                          alt="Favicon"
                          fill
                          className="object-contain"
                        />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {appFavicon.split('/').pop()}
                      </p>
                    </div>
                    <ImageIcon className="h-5 w-5 text-muted-foreground shrink-0" />
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2 text-muted-foreground">
                    <ImageIcon className="h-5 w-5" />
                    <span className="text-sm">画像を選択</span>
                  </div>
                )}
              </button>
            </Field>
          </FieldGroup>
        </FieldSet>

        {/* 画像選択ダイアログ */}
        <ImagePickerDialog
          open={isIconPickerOpen}
          onOpenChange={setIsIconPickerOpen}
          onSelect={(path) => setAppIcon(path || '/system/icon.png')}
          currentPath={appIcon}
          imageType="icon"
        />
        <ImagePickerDialog
          open={isFaviconPickerOpen}
          onOpenChange={setIsFaviconPickerOpen}
          onSelect={(path) => setAppFavicon(path || '/system/favicon.ico')}
          currentPath={appFavicon}
          imageType="favicon"
        />
        {/* 保存ボタン */}
        <div className="flex justify-end gap-3 mt-6">
          <Button
            type="button"
            variant="outline"
            onClick={handleReset}
            disabled={!hasChanges || isSubmitting}
          >
            キャンセル
          </Button>
          <Button type="submit" disabled={!hasChanges || isSubmitting}>
            {isSubmitting ? '保存中...' : '変更を保存'}
          </Button>
        </div>
      </form>

      {/* グローバルスタイルセクション */}
      <div className="border-t pt-8">
        <h2 className="text-lg font-semibold mb-2">グローバルスタイル</h2>
        <p className="text-sm text-muted-foreground mb-4">
          アプリケーション全体に適用されるCSSスタイルを設定します。
        </p>
        <StyleEditor itemId={null} initialStyles={initialGlobalStyles} />
      </div>

      {/* カスタムスクリプトセクション */}
      <div className="border-t pt-8">
        <h2 className="text-lg font-semibold mb-2">カスタムスクリプト</h2>
        <p className="text-sm text-muted-foreground mb-4">
          アプリケーション全体で実行されるJavaScriptを設定します。jQueryが利用可能です。
        </p>
        <ScriptEditor itemId={null} initialScripts={initialGlobalScripts} />
      </div>
    </div>
  );
}
