'use client';

import { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import type { ColumnTypeConfig } from '../../types/column';
import type { Item } from '@/features/item/types';

/**
 * RelationConfigEditorのProps
 */
type RelationConfigEditorProps = {
  config: ColumnTypeConfig['RELATION'];
  tables: Item[]; // 参照可能なテーブル一覧
  currentTableId: string; // 現在のテーブルID（自己参照を防ぐため）
  onChange: (config: ColumnTypeConfig['RELATION']) => void;
};

/**
 * RELATION型カラムの設定エディタコンポーネント
 */
export function RelationConfigEditor({
  config,
  tables,
  currentTableId,
  onChange,
}: RelationConfigEditorProps) {
  const [localConfig, setLocalConfig] =
    useState<ColumnTypeConfig['RELATION']>(config);
  const [availableFields, setAvailableFields] = useState<
    Array<{ id: string; name: string }>
  >([]);

  // 親から受け取ったconfigが変更されたらローカルステートを更新
  useEffect(() => {
    setLocalConfig(config);
  }, [config]);

  // 参照先テーブルが選択されたら、そのテーブルのカラム一覧を取得
  useEffect(() => {
    if (localConfig.referencedTableId) {
      const selectedTable = tables.find(
        (t) => t.id === localConfig.referencedTableId
      );
      if (selectedTable && selectedTable.type === 'TABLE') {
        // メタデータからカラム一覧を取得
        const tableMeta = selectedTable.meta as {
          schema?: { columns?: Array<{ id: string; name: string }> };
        };
        const columns = tableMeta?.schema?.columns || [];
        setAvailableFields(columns);
      } else {
        setAvailableFields([]);
      }
    } else {
      setAvailableFields([]);
    }
  }, [localConfig.referencedTableId, tables]);

  // 参照先テーブル変更
  const handleTableChange = (tableId: string) => {
    const newConfig = {
      referencedTableId: tableId,
      displayField: '', // テーブル変更時は表示フィールドをリセット
      allowMultiple: localConfig.allowMultiple,
    };
    setLocalConfig(newConfig);
    onChange(newConfig);
  };

  // 表示フィールド変更
  const handleDisplayFieldChange = (fieldId: string) => {
    const newConfig = { ...localConfig, displayField: fieldId };
    setLocalConfig(newConfig);
    onChange(newConfig);
  };

  // 複数参照許可フラグ変更
  const handleAllowMultipleChange = (checked: boolean) => {
    const newConfig = { ...localConfig, allowMultiple: checked };
    setLocalConfig(newConfig);
    onChange(newConfig);
  };

  // 参照可能なテーブル一覧（自己参照を除外）
  const selectableTables = tables.filter(
    (table) => table.type === 'TABLE' && table.id !== currentTableId
  );

  return (
    <div className="space-y-4">
      {/* 参照先テーブル選択 */}
      <div>
        <Label htmlFor="referenced-table">参照先テーブル</Label>
        <Select
          value={localConfig.referencedTableId}
          onValueChange={handleTableChange}
        >
          <SelectTrigger id="referenced-table" className="mt-2">
            <SelectValue placeholder="テーブルを選択" />
          </SelectTrigger>
          <SelectContent>
            {selectableTables.length === 0 ? (
              <div className="p-2 text-sm text-muted-foreground text-center">
                参照可能なテーブルがありません
              </div>
            ) : (
              selectableTables.map((table) => (
                <SelectItem key={table.id} value={table.id}>
                  {table.name}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      </div>

      {/* 表示フィールド選択 */}
      {localConfig.referencedTableId && (
        <div>
          <Label htmlFor="display-field">表示フィールド</Label>
          <Select
            value={localConfig.displayField}
            onValueChange={handleDisplayFieldChange}
          >
            <SelectTrigger
              id="display-field"
              className="mt-2"
              disabled={availableFields.length === 0}
            >
              <SelectValue placeholder="表示するフィールドを選択" />
            </SelectTrigger>
            <SelectContent>
              {availableFields.length === 0 ? (
                <div className="p-2 text-sm text-muted-foreground text-center">
                  参照先テーブルにカラムがありません
                </div>
              ) : (
                availableFields.map((field) => (
                  <SelectItem key={field.id} value={field.id}>
                    {field.name}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* 複数参照許可 */}
      <div className="flex items-center space-x-2">
        <Checkbox
          id="allow-multiple"
          checked={localConfig.allowMultiple || false}
          onCheckedChange={handleAllowMultipleChange}
        />
        <Label
          htmlFor="allow-multiple"
          className="text-sm font-normal cursor-pointer"
        >
          複数のレコードを参照可能にする
        </Label>
      </div>
    </div>
  );
}
