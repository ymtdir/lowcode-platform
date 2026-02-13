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
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { parseCSV } from '@/lib/csv';
import type {
  ImportResult,
  ValidationError,
} from '@/features/table/types/import';

/**
 * インポートダイアログのProps型
 */
type ImportDialogProps = {
  title: string;
  description: string;
  previewMessage: (count: number) => string;
  noticeMessage: string;
  onImport: (csvContent: string) => Promise<ImportResult>;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onImportSuccess?: () => void;
};

/**
 * インポート状態
 */
type ImportState =
  | { type: 'idle' }
  | { type: 'preview'; fileName: string; rowCount: number; csvContent: string }
  | { type: 'importing' }
  | { type: 'success'; result: ImportResult }
  | { type: 'error'; errors: ValidationError[]; message: string };

/**
 * 汎用インポートダイアログコンポーネント
 */
export function ImportDialog({
  title,
  description,
  previewMessage,
  noticeMessage,
  onImport,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
  onImportSuccess,
}: ImportDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
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

  // 制御モード（親から open/onOpenChange が渡された場合）と非制御モード
  const open = controlledOpen ?? internalOpen;

  // インポート中のプログレスバーアニメーション
  useEffect(() => {
    if (state.type !== 'importing') {
      return;
    }

    // 0%から90%まで徐々に進める（実際の処理完了は100%にしない）
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
      // ファイルを読み込み
      const text = await file.text();

      // CSVをパースしてプレビュー
      const parsed = parseCSV(text);

      if (parsed.rows.length === 0) {
        setState({
          type: 'error',
          errors: [],
          message: 'インポートするデータがありません',
        });
        return;
      }

      setState({
        type: 'preview',
        fileName: file.name,
        rowCount: parsed.rows.length,
        csvContent: text,
      });
    } catch {
      setState({
        type: 'error',
        errors: [],
        message: 'ファイルの読み込みに失敗しました',
      });
    }
  }, []);

  // ファイル拒否ハンドラー
  const onDropRejected = useCallback(() => {
    setState({
      type: 'error',
      errors: [],
      message: 'CSVファイルを選択してください',
    });
  }, []);

  // react-dropzone設定
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    onDropRejected,
    accept: { 'text/csv': ['.csv'] },
    maxSize: 10 * 1024 * 1024, // 10MB制限
    multiple: false,
  });

  // インポート実行ハンドラー
  const handleImport = useCallback(async () => {
    if (state.type !== 'preview') return;

    setState({ type: 'importing' });

    try {
      const result = await onImport(state.csvContent);

      if (result.success) {
        setState({ type: 'success', result });
        // 成功後、3秒後にダイアログを閉じてコールバックを実行
        autoCloseTimerRef.current = setTimeout(() => {
          if (controlledOnOpenChange) {
            controlledOnOpenChange(false);
          } else {
            setInternalOpen(false);
          }
          setState({ type: 'idle' });
          onImportSuccess?.();
        }, 3000);
      } else {
        setState({
          type: 'error',
          errors: result.errors || [],
          message: result.message,
        });
      }
    } catch (error) {
      setState({
        type: 'error',
        errors: [],
        message:
          error instanceof Error
            ? error.message
            : 'インポート中にエラーが発生しました',
      });
    }
  }, [state, onImport, onImportSuccess, controlledOnOpenChange]);

  // ダイアログを閉じる際のリセット
  const handleOpenChange = useCallback(
    (newOpen: boolean) => {
      if (controlledOnOpenChange) {
        controlledOnOpenChange(newOpen);
      } else {
        setInternalOpen(newOpen);
      }
      if (!newOpen) {
        if (autoCloseTimerRef.current) {
          clearTimeout(autoCloseTimerRef.current);
          autoCloseTimerRef.current = undefined;
        }
        setState({ type: 'idle' });
      }
    },
    [controlledOnOpenChange]
  );

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
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
                    CSV形式のファイル（最大10MB）
                  </p>
                </div>
              </div>

              {state.type === 'error' && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{state.message}</AlertDescription>
                </Alert>
              )}

              {state.type === 'error' && state.errors.length > 0 && (
                <ScrollArea className="h-64 w-full rounded-md border p-4">
                  <div className="space-y-2">
                    <p className="text-sm font-semibold">
                      エラー詳細 ({state.errors.length}件)
                    </p>
                    {state.errors.map((error, index) => (
                      <div
                        key={index}
                        className="text-sm text-destructive bg-destructive/10 p-2 rounded"
                      >
                        {error.message}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
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
                <p className="text-sm text-muted-foreground">
                  {previewMessage(state.rowCount)}
                </p>
              </div>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{noticeMessage}</AlertDescription>
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
                  <div>新規作成:</div>
                  <div className="font-semibold">
                    {state.result.insertedCount}件
                  </div>
                  <div>更新:</div>
                  <div className="font-semibold">
                    {state.result.updatedCount}件
                  </div>
                  {state.result.skippedCount > 0 && (
                    <>
                      <div>スキップ:</div>
                      <div className="font-semibold">
                        {state.result.skippedCount}件
                      </div>
                    </>
                  )}
                  <div>合計:</div>
                  <div className="font-semibold">
                    {state.result.totalCount}件
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
