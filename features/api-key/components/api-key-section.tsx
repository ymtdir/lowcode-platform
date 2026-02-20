'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { Copy, RefreshCw, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  getApiKey,
  generateApiKey,
  deleteApiKey,
} from '@/features/api-key/api';
import type { ApiKeyInfo } from '@/features/api-key/types';

/**
 * APIキー管理セクション
 */
export function ApiKeySection() {
  const [apiKeyInfo, setApiKeyInfo] = useState<ApiKeyInfo | null>(null);
  const [newlyGeneratedKey, setNewlyGeneratedKey] = useState<string | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  const fetchApiKey = useCallback(async () => {
    try {
      const key = await getApiKey();
      setApiKeyInfo(key);
    } catch {
      toast.error('APIキーの取得に失敗しました');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchApiKey();
  }, [fetchApiKey]);

  const handleGenerate = async () => {
    setIsProcessing(true);
    try {
      const result = await generateApiKey();
      setApiKeyInfo(result);
      setNewlyGeneratedKey(result.plainTextKey);
    } catch {
      toast.error('APIキーの生成に失敗しました');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDelete = async () => {
    setIsProcessing(true);
    try {
      await deleteApiKey();
      setApiKeyInfo(null);
      setNewlyGeneratedKey(null);
      toast.success('APIキーを削除しました');
    } catch {
      toast.error('APIキーの削除に失敗しました');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCopyNewKey = async () => {
    if (!newlyGeneratedKey) return;
    try {
      await navigator.clipboard.writeText(newlyGeneratedKey);
      toast.success('APIキーをコピーしました');
    } catch {
      toast.error('クリップボードへのコピーに失敗しました');
    }
  };

  if (isLoading) {
    return (
      <div className="text-center py-4 text-sm text-muted-foreground">
        読み込み中...
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium">APIキー</h3>

      {newlyGeneratedKey && (
        <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded p-3 space-y-2">
          <p className="text-xs font-medium text-amber-800 dark:text-amber-200">
            このキーは一度だけ表示されます。今すぐコピーしてください。
          </p>
          <div className="flex items-center gap-2">
            <code className="flex-1 text-xs bg-white dark:bg-black px-3 py-2 rounded break-all border">
              {newlyGeneratedKey}
            </code>
            <Button
              variant="outline"
              size="icon"
              onClick={handleCopyNewKey}
              aria-label="APIキーをコピー"
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setNewlyGeneratedKey(null)}
          >
            確認しました
          </Button>
        </div>
      )}

      {apiKeyInfo ? (
        <div className="space-y-2">
          {!newlyGeneratedKey && (
            <code className="block text-xs bg-muted px-3 py-2 rounded break-all">
              {apiKeyInfo.prefix}
              {'••••••••••••••••'}
            </code>
          )}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <p className="text-xs text-muted-foreground">
                作成日:{' '}
                {new Date(apiKeyInfo.createdAt).toLocaleDateString('ja-JP')}
              </p>
              <p className="text-xs text-muted-foreground">
                最終使用:{' '}
                {apiKeyInfo.lastUsedAt
                  ? new Date(apiKeyInfo.lastUsedAt).toLocaleDateString('ja-JP')
                  : '未使用'}
              </p>
              {apiKeyInfo.expiresAt && (
                <p className="text-xs text-muted-foreground">
                  有効期限:{' '}
                  {new Date(apiKeyInfo.expiresAt).toLocaleDateString('ja-JP')}
                </p>
              )}
            </div>
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={handleGenerate}
                disabled={isProcessing}
                aria-label="APIキーを再生成"
              >
                <RefreshCw className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={handleDelete}
                disabled={isProcessing}
                aria-label="APIキーを削除"
              >
                <Trash2 className="h-3.5 w-3.5 text-destructive" />
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">APIキーは未作成です</p>
          <Button
            variant="outline"
            size="sm"
            onClick={handleGenerate}
            disabled={isProcessing}
          >
            生成
          </Button>
        </div>
      )}
    </div>
  );
}
