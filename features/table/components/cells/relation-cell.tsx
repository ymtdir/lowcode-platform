'use client';

import { useState, useRef, useEffect } from 'react';
import { AlertCircle, X } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
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
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

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

  // 単一選択時の処理
  const handleSelectSingle = (recordId: string | null) => {
    onChange(recordId);
    setIsOpen(false);
  };

  // 複数選択時の処理
  const handleToggleMultiple = (recordId: string) => {
    const currentIds = Array.isArray(value) ? value : value ? [value] : [];
    if (currentIds.includes(recordId)) {
      const newIds = currentIds.filter((id) => id !== recordId);
      onChange(newIds.length > 0 ? newIds : null);
    } else {
      onChange([...currentIds, recordId]);
    }
  };

  // 個別削除（複数選択時）
  const handleRemove = (recordId: string) => {
    if (allowMultiple && Array.isArray(value)) {
      const newIds = value.filter((id) => id !== recordId);
      onChange(newIds.length > 0 ? newIds : null);
    } else {
      onChange(null);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  if (readOnly) {
    return (
      <div className="min-h-[32px] px-2 py-1 flex items-center w-full">
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

  return (
    <div
      ref={containerRef}
      className="relative w-full"
      onKeyDown={handleKeyDown}
    >
      <div
        className="min-h-[32px] px-2 py-1 cursor-pointer hover:bg-accent/50 transition-colors flex items-center gap-1 flex-wrap"
        onClick={() => setIsOpen(!isOpen)}
      >
        {selectedRecords.length > 0 ? (
          selectedRecords.map((record) => (
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
              {allowMultiple && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemove(record.id);
                  }}
                  className="hover:bg-background/50 rounded p-0.5"
                >
                  <X className="size-3" />
                </button>
              )}
            </span>
          ))
        ) : (
          <span className="text-muted-foreground">レコードを選択</span>
        )}
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-full max-w-xs bg-popover border rounded-md shadow-lg z-10 max-h-60 overflow-y-auto">
          {records.length === 0 ? (
            <div className="p-2 text-sm text-muted-foreground text-center">
              参照可能なレコードがありません
            </div>
          ) : (
            <div className="py-1">
              {!allowMultiple && (
                <button
                  type="button"
                  className="w-full text-left px-3 py-2 hover:bg-accent text-sm"
                  onClick={() => handleSelectSingle(null)}
                >
                  <span className="text-muted-foreground">選択解除</span>
                </button>
              )}
              {records.map((record) => {
                const isSelected = allowMultiple
                  ? (Array.isArray(value) ? value : []).includes(record.id)
                  : value === record.id;

                return (
                  <div
                    key={record.id}
                    className={`px-3 py-2 hover:bg-accent cursor-pointer text-sm flex items-center gap-2 ${
                      isSelected ? 'bg-accent/50' : ''
                    }`}
                    onClick={() =>
                      allowMultiple
                        ? handleToggleMultiple(record.id)
                        : handleSelectSingle(record.id)
                    }
                  >
                    {allowMultiple && (
                      <Checkbox
                        checked={isSelected}
                        className="pointer-events-none"
                      />
                    )}
                    <span>{record.displayValue}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
