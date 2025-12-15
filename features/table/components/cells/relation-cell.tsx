'use client';

import { useState } from 'react';
import { AlertCircle } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from '@/components/ui/select';
import {
  MultiSelect,
  MultiSelectContent,
  MultiSelectItem,
  MultiSelectTrigger,
} from '@/components/ui/multi-select';
import type { RelationRecord } from '@/features/column/types';

type RelationCellProps = {
  value: string | string[] | null;
  onChange: (value: string | string[] | null) => void;
  records: RelationRecord[]; // 参照可能なレコード一覧
  allowMultiple?: boolean;
  readOnly?: boolean;
};

/**
 * リレーションセルコンポーネント
 */
export function RelationCell({
  value,
  onChange,
  records,
  allowMultiple = false,
  readOnly = false,
}: RelationCellProps) {
  const [open, setOpen] = useState(false);
  // 複数選択用のローカルステート（常に呼び出す）
  const [localValue, setLocalValue] = useState<string[]>(
    Array.isArray(value) ? value : []
  );

  // 選択中のレコードを取得
  const selectedRecords = (() => {
    if (!value) return [];
    const ids = Array.isArray(value) ? value : [value];
    return ids
      .map((id) => {
        const record = records.find((r) => r.id === id);
        if (record) return record;
        // レコードが見つからない場合（削除済み）
        return { id, displayValue: id, exists: false };
      })
      .filter((r) => r !== null);
  })();

  if (readOnly) {
    return (
      <div className="h-8 w-full px-2 flex items-center">
        {selectedRecords.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {selectedRecords.map((record) => (
              <span
                key={record.id}
                className={`inline-flex items-center px-2 py-0.5 rounded text-sm ${
                  record.exists
                    ? 'bg-primary/20 text-primary'
                    : 'bg-destructive/20 text-destructive'
                }`}
              >
                {record.exists ? (
                  record.displayValue
                ) : (
                  <>
                    <AlertCircle className="size-3 mr-1" />
                    削除されたレコード ({record.id.slice(0, 8)})
                  </>
                )}
              </span>
            ))}
          </div>
        ) : (
          <span className="text-muted-foreground">-</span>
        )}
      </div>
    );
  }

  // 複数選択
  if (allowMultiple) {
    // メニューが開いたときに値を同期
    const handleOpenChange = (newOpen: boolean) => {
      if (newOpen) {
        setLocalValue(Array.isArray(value) ? value : []);
      } else {
        // 閉じたときに変更があれば保存
        const currentIds = Array.isArray(value) ? value : [];
        const hasChanges =
          localValue.length !== currentIds.length ||
          localValue.some((id) => !currentIds.includes(id));

        if (hasChanges) {
          onChange(localValue.length > 0 ? localValue : null);
        }
      }
      setOpen(newOpen);
    };

    const handleToggle = (recordId: string) => {
      setLocalValue((prev) => {
        if (prev.includes(recordId)) {
          return prev.filter((id) => id !== recordId);
        } else {
          return [...prev, recordId];
        }
      });
    };

    // 表示用のレコード（localValueに基づく）
    const displayRecords = localValue
      .map((id) => {
        const record = records.find((r) => r.id === id);
        if (record) return record;
        return { id, displayValue: id, exists: false };
      })
      .filter((r) => r !== null);

    return (
      <MultiSelect open={open} onOpenChange={handleOpenChange}>
        <MultiSelectTrigger className="h-8 w-full px-2 flex items-center justify-start gap-1 flex-wrap hover:bg-muted/50 bg-transparent border-0 rounded-none shadow-none focus-visible:ring-0 [&>svg]:hidden">
          {displayRecords.length > 0 ? (
            displayRecords.map((record) => (
              <span
                key={record.id}
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-sm ${
                  record.exists
                    ? 'bg-primary/20 text-primary'
                    : 'bg-destructive/20 text-destructive'
                }`}
              >
                {record.exists ? (
                  record.displayValue
                ) : (
                  <>
                    <AlertCircle className="size-3" />
                    削除されたレコード ({record.id.slice(0, 8)})
                  </>
                )}
              </span>
            ))
          ) : (
            <span className="text-muted-foreground">レコードを選択</span>
          )}
        </MultiSelectTrigger>
        <MultiSelectContent>
          {records.length === 0 ? (
            <div className="px-3 py-2 text-sm text-muted-foreground text-center">
              参照可能なレコードがありません
            </div>
          ) : (
            records.map((record) => (
              <MultiSelectItem
                key={record.id}
                selected={localValue.includes(record.id)}
                onClick={() => handleToggle(record.id)}
              >
                {record.displayValue}
              </MultiSelectItem>
            ))
          )}
        </MultiSelectContent>
      </MultiSelect>
    );
  }

  // 単一選択
  const handleSelect = (recordId: string) => {
    if (recordId === '__clear__') {
      onChange(null);
    } else {
      onChange(recordId);
    }
    setOpen(false);
  };

  return (
    <Select
      value={(value as string) || undefined}
      onValueChange={handleSelect}
      open={open}
      onOpenChange={setOpen}
    >
      <SelectTrigger className="h-8 w-full px-2 flex items-center hover:bg-muted/50 bg-transparent border-0 rounded-none shadow-none focus-visible:ring-0 [&>svg]:hidden">
        {selectedRecords.length > 0 ? (
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded text-sm ${
              selectedRecords[0].exists
                ? 'bg-primary/20 text-primary'
                : 'bg-destructive/20 text-destructive'
            }`}
          >
            {selectedRecords[0].exists ? (
              selectedRecords[0].displayValue
            ) : (
              <>
                <AlertCircle className="size-3 mr-1" />
                削除されたレコード ({selectedRecords[0].id.slice(0, 8)})
              </>
            )}
          </span>
        ) : (
          <span className="text-muted-foreground">レコードを選択</span>
        )}
      </SelectTrigger>
      <SelectContent>
        {records.length === 0 ? (
          <div className="px-3 py-2 text-sm text-muted-foreground text-center">
            参照可能なレコードがありません
          </div>
        ) : (
          <>
            <SelectItem value="__clear__">
              <span className="text-muted-foreground">選択解除</span>
            </SelectItem>
            {records.map((record) => (
              <SelectItem key={record.id} value={record.id}>
                {record.displayValue}
              </SelectItem>
            ))}
          </>
        )}
      </SelectContent>
    </Select>
  );
}
