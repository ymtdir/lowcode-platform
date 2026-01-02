'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Field, FieldGroup, FieldLabel, FieldSet } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { updateSettings } from '@/features/setting/api';
import type { AppSettings } from '@/features/setting/types';

type SettingsFormProps = {
  initialSettings: AppSettings;
};

export function SettingsForm({ initialSettings }: SettingsFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [appName, setAppName] = useState(initialSettings.appName);
  const [appIcon, setAppIcon] = useState(initialSettings.appIcon);
  const [appFavicon, setAppFavicon] = useState(initialSettings.appFavicon);
  const [hideAppName, setHideAppName] = useState(
    initialSettings.hideAppName
  );

  // 変更があるかどうかを判定
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

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-2xl">
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
            <FieldLabel htmlFor="appIcon">アプリアイコン</FieldLabel>
            <Input
              id="appIcon"
              type="text"
              value={appIcon}
              onChange={(e) => setAppIcon(e.target.value)}
              placeholder="/system/app-icon.png"
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="appFavicon">ファビコン</FieldLabel>
            <Input
              id="appFavicon"
              type="text"
              value={appFavicon}
              onChange={(e) => setAppFavicon(e.target.value)}
              placeholder="/system/favicon.ico"
            />
          </Field>
        </FieldGroup>

        <div className="mt-6 flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setAppName(initialSettings.appName);
              setAppIcon(initialSettings.appIcon);
              setAppFavicon(initialSettings.appFavicon);
              setHideAppName(initialSettings.hideAppName);
            }}
            disabled={!hasChanges || isSubmitting}
          >
            キャンセル
          </Button>
          <Button type="submit" disabled={!hasChanges || isSubmitting}>
            {isSubmitting ? '保存中...' : '変更を保存'}
          </Button>
        </div>
      </FieldSet>
    </form>
  );
}
