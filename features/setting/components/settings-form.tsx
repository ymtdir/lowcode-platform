'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Field, FieldGroup, FieldLabel, FieldSet } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { updateSettings } from '@/features/setting/api';
import type { AppSettings } from '@/features/setting/types';

type SettingsFormProps = {
  initialSettings: AppSettings;
};

export function SettingsForm({ initialSettings }: SettingsFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [appTitle, setAppTitle] = useState(initialSettings.appTitle);
  const [logoUrl, setLogoUrl] = useState(initialSettings.logoUrl);
  const [faviconUrl, setFaviconUrl] = useState(initialSettings.faviconUrl);

  // 変更があるかどうかを判定
  const hasChanges = useMemo(() => {
    return (
      appTitle !== initialSettings.appTitle ||
      logoUrl !== initialSettings.logoUrl ||
      faviconUrl !== initialSettings.faviconUrl
    );
  }, [appTitle, logoUrl, faviconUrl, initialSettings]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await updateSettings({
        appTitle,
        logoUrl,
        faviconUrl,
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
            <FieldLabel htmlFor="appTitle">アプリケーション名</FieldLabel>
            <Input
              id="appTitle"
              type="text"
              value={appTitle}
              onChange={(e) => setAppTitle(e.target.value)}
              placeholder="Lowcode Platform"
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="logoUrl">ロゴURL</FieldLabel>
            <Input
              id="logoUrl"
              type="text"
              value={logoUrl}
              onChange={(e) => setLogoUrl(e.target.value)}
              placeholder="/system/app-icon.png"
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="faviconUrl">ファビコンURL</FieldLabel>
            <Input
              id="faviconUrl"
              type="text"
              value={faviconUrl}
              onChange={(e) => setFaviconUrl(e.target.value)}
              placeholder="/system/favicon.ico"
            />
          </Field>
        </FieldGroup>

        <div className="mt-6 flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setAppTitle(initialSettings.appTitle);
              setLogoUrl(initialSettings.logoUrl);
              setFaviconUrl(initialSettings.faviconUrl);
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
