'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, AlertCircle, CheckCircle2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { importItemAction } from '@/features/item/actions/import-item';
import type { ImportResult } from '@/features/table/types/import';
import type { ItemExportData, ItemExportFile } from '@/features/item/types';

/**
 * インポートダイアログのProps型
 */
type ImportItemDialogProps = {
  parentId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

/**
 * インポート状態
 */
type ImportState =
  | { type: 'idle' }
  | {
      type: 'preview';
      fileName: string;
      jsonContent: string;
      summary: ImportSummary;
    }
  | { type: 'importing' }
  | { type: 'success'; result: ImportResult }
  | { type: 'error'; message: string };

/**
 * プレビュー用サマリー
 */
type ImportSummary = {
  itemCount: number;
  tableCount: number;
  folderCount: number;
  hasRecords: boolean;
  recordCount: number;
};

/**
 * エクスポートデータからサマリーを生成する
 */
function buildSummary(items: ItemExportData[]): ImportSummary {
  let itemCount = 0;
  let tableCount = 0;
  let folderCount = 0;
  let recordCount = 0;

  function countRecursive(list: ItemExportData[]) {
    for (const item of list) {
      itemCount++;
      if (item.type === 'TABLE') {
        tableCount++;
        if (item.records) {
          recordCount += item.records.length;
        }
      } else {
        folderCount++;
      }
      if (item.children) {
        countRecursive(item.children);
      }
    }
  }

  countRecursive(items);

  return {
    itemCount,
    tableCount,
    folderCount,
    hasRecords: recordCount > 0,
    recordCount,
  };
}

/**
 * JSONバリデーション（クライアント側の簡易チェック）
 */
function parseAndValidate(
  jsonContent: string
): { exportFile: ItemExportFile } | { error: string } {
  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonContent);
  } catch {
    return { error: 'JSONの形式が不正です' };
  }

  if (!parsed || typeof parsed !== 'object') {
    return { error: 'JSONの形式が不正です' };
  }

  const file = parsed as Record<string, unknown>;
  if (typeof file.version !== 'number') {
    return { error: 'バージョン情報がありません' };
  }
  if (!Array.isArray(file.items) || file.items.length === 0) {
    return { error: 'インポートするアイテムがありません' };
  }

  return { exportFile: parsed as ItemExportFile };
}

/**
 * アイテムインポートダイアログ
 */
export function ImportItemDialog({
  parentId,
  open,
  onOpenChange,
}: ImportItemDialogProps) {
  const [state, setState] = useState<ImportState>({ type: 'idle' });
  const [progress, setProgress] = useState(0);
  const autoCloseTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  // 自動クローズタイマーのクリーンアップ
  useEffect(() => {
    return () => {
      if (autoCloseTimerRef.current) {
        clearTimeout(autoCloseTimerRef.current);
      }
    };
  }, []);

  // インポート中のプログレスバーアニメーション
  useEffect(() => {
    if (state.type !== 'importing') {
      return;
    }

    const timer0 = setTimeout(() => setProgress(0), 0);
    const timer1 = setTimeout(() => setProgress(10), 100);
    const timer2 = setTimeout(() => setProgress(30), 400);
    const timer3 = setTimeout(() => setProgress(50), 700);
    const timer4 = setTimeout(() => setProgress(70), 1100);
    const timer5 = setTimeout(() => setProgress(90), 1600);

    return () => {
      clearTimeout(timer0);
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
      clearTimeout(timer5);
    };
  }, [state.type]);

  // ファイルドロップハンドラー
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    try {
      const text = await file.text();
      const result = parseAndValidate(text);

      if ('error' in result) {
        setState({ type: 'error', message: result.error });
        return;
      }

      const summary = buildSummary(result.exportFile.items);

      setState({
        type: 'preview',
        fileName: file.name,
        jsonContent: text,
        summary,
      });
    } catch {
      setState({
        type: 'error',
        message: 'ファイルの読み込みに失敗しました',
      });
    }
  }, []);

  // ファイル拒否ハンドラー
  const onDropRejected = useCallback(() => {
    setState({
      type: 'error',
      message: 'JSONファイルを選択してください',
    });
  }, []);

  // react-dropzone設定
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    onDropRejected,
    accept: { 'application/json': ['.json'] },
    maxSize: 10 * 1024 * 1024, // 10MB制限
    multiple: false,
  });

  // インポート実行ハンドラー
  const handleImport = useCallback(async () => {
    if (state.type !== 'preview') return;

    setState({ type: 'importing' });

    try {
      const result = await importItemAction(state.jsonContent, parentId);

      if (result.success) {
        setState({ type: 'success', result });
        autoCloseTimerRef.current = setTimeout(() => {
          onOpenChange(false);
          setState({ type: 'idle' });
          window.location.reload();
        }, 3000);
      } else {
        setState({
          type: 'error',
          message: result.message,
        });
      }
    } catch (error) {
      setState({
        type: 'error',
        message:
          error instanceof Error
            ? error.message
            : 'インポート中にエラーが発生しました',
      });
    }
  }, [state, parentId, onOpenChange]);

  // ダイアログを閉じる際のリセット
  const handleOpenChange = useCallback(
    (newOpen: boolean) => {
      if (!newOpen && state.type === 'importing') {
        return;
      }
      onOpenChange(newOpen);
      if (!newOpen) {
        if (autoCloseTimerRef.current) {
          clearTimeout(autoCloseTimerRef.current);
          autoCloseTimerRef.current = undefined;
        }
        setState({ type: 'idle' });
      }
    },
    [onOpenChange, state.type]
  );

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>アイテムのインポート</DialogTitle>
          <DialogDescription>
            エクスポートしたJSONファイルからアイテムをインポートします
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* ファイル選択 */}
          {(state.type === 'idle' || state.type === 'error') && (
            <div className="space-y-4">
              <div
                {...getRootProps()}
                className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
                  isDragActive
                    ? 'bg-primary/10 border-primary'
                    : 'hover:bg-muted/50'
                }`}
              >
                <input {...getInputProps()} />
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  {isDragActive ? (
                    <Upload className="w-8 h-8 mb-2 text-primary animate-bounce" />
                  ) : (
                    <FileText className="w-8 h-8 mb-2 text-muted-foreground" />
                  )}
                  <p className="mb-2 text-sm text-muted-foreground">
                    <span className="font-semibold">
                      {isDragActive
                        ? 'ここにドロップ'
                        : 'クリックまたはドラッグ&ドロップ'}
                    </span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    JSON形式のファイル（最大10MB）
                  </p>
                </div>
              </div>

              {state.type === 'error' && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{state.message}</AlertDescription>
                </Alert>
              )}
            </div>
          )}

          {/* プレビュー */}
          {state.type === 'preview' && (
            <div className="space-y-4">
              <div className="bg-muted p-4 rounded-lg space-y-2">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  <span className="font-semibold">{state.fileName}</span>
                </div>
                <div className="grid grid-cols-2 gap-1 text-sm text-muted-foreground">
                  <div>アイテム数:</div>
                  <div className="font-semibold">
                    {state.summary.itemCount}件
                  </div>
                  {state.summary.folderCount > 0 && (
                    <>
                      <div>フォルダ:</div>
                      <div className="font-semibold">
                        {state.summary.folderCount}件
                      </div>
                    </>
                  )}
                  {state.summary.tableCount > 0 && (
                    <>
                      <div>テーブル:</div>
                      <div className="font-semibold">
                        {state.summary.tableCount}件
                      </div>
                    </>
                  )}
                  {state.summary.hasRecords && (
                    <>
                      <div>レコード:</div>
                      <div className="font-semibold">
                        {state.summary.recordCount}件
                      </div>
                    </>
                  )}
                </div>
              </div>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  すべてのアイテムは新規作成されます。既存のアイテムとは別に追加されます。
                </AlertDescription>
              </Alert>

              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => setState({ type: 'idle' })}
                >
                  キャンセル
                </Button>
                <Button onClick={handleImport}>インポート実行</Button>
              </div>
            </div>
          )}

          {/* インポート中 */}
          {state.type === 'importing' && (
            <div className="flex flex-col items-center justify-center py-8 space-y-4">
              <div className="w-full max-w-md space-y-2">
                <p className="text-sm text-center text-muted-foreground">
                  インポート中です...
                </p>
                <Progress value={progress} className="w-full" />
              </div>
            </div>
          )}

          {/* 成功 */}
          {state.type === 'success' && (
            <div className="space-y-4">
              <Alert>
                <CheckCircle2 />
                <AlertDescription>{state.result.message}</AlertDescription>
              </Alert>

              <div className="bg-muted p-4 rounded-lg space-y-2">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>作成されたアイテム:</div>
                  <div className="font-semibold">
                    {state.result.insertedCount}件
                  </div>
                </div>
              </div>

              <p className="text-xs text-center text-muted-foreground">
                このダイアログは自動的に閉じます
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
