'use client';

/**
 * 設定コンテンツコンポーネント（プレースホルダー）
 */
export function SettingsContent() {
  return (
    <>
      <div className="flex items-center p-4 border-b">
        <h2 className="text-lg font-semibold">設定</h2>
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        <div className="text-center py-8 text-muted-foreground">
          設定項目は今後追加予定です
        </div>
      </div>
    </>
  );
}
