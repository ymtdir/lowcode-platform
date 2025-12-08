'use client';

import { useState, useEffect } from 'react';
import { Plus, GripVertical, Trash2, Check } from 'lucide-react';
import { nanoid } from 'nanoid';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { COLOR_PALETTE, DEFAULT_COLOR } from '../../constants';
import type { SelectOption } from '../../types';

/**
 * SelectConfigEditorのProps
 */
type SelectConfigEditorProps = {
  options: SelectOption[];
  defaultValue?: string | string[];
  allowMultiple?: boolean;
  onChange: (
    options: SelectOption[],
    defaultValue?: string | string[],
    allowMultiple?: boolean
  ) => void;
};

/**
 * OptionItemのProps
 */
type OptionItemProps = {
  option: SelectOption;
  isDefault: boolean;
  isMultiSelect: boolean;
  onLabelChange: (id: string, label: string) => void;
  onColorChange: (id: string, color: string) => void;
  onDelete: (id: string) => void;
  onToggleDefault?: (id: string) => void;
};

/**
 * SELECT/MULTI_SELECT型カラムの設定エディタコンポーネント
 */
function OptionItem({
  option,
  isDefault,
  isMultiSelect,
  onLabelChange,
  onColorChange,
  onDelete,
  onToggleDefault,
}: OptionItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: option.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-2 p-2 bg-background border rounded-lg"
    >
      {/* ドラッグハンドル */}
      <button
        type="button"
        className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="size-4" />
      </button>

      {/* カラー選択 */}
      <Popover>
        <PopoverTrigger asChild>
          <button
            type="button"
            className="size-6 rounded-full border-2 border-border hover:scale-110 transition-transform"
            style={{ backgroundColor: option.color || DEFAULT_COLOR }}
          />
        </PopoverTrigger>
        <PopoverContent className="w-auto p-3">
          <div className="grid grid-cols-3 gap-2">
            {COLOR_PALETTE.map((color) => (
              <button
                key={color.value}
                type="button"
                className="size-8 rounded-full border-2 border-border hover:scale-110 transition-transform relative"
                style={{ backgroundColor: color.value }}
                onClick={() => onColorChange(option.id, color.value)}
                title={color.name}
              >
                {option.color === color.value && (
                  <Check className="size-4 text-white absolute inset-0 m-auto" />
                )}
              </button>
            ))}
          </div>
        </PopoverContent>
      </Popover>

      {/* ラベル入力 */}
      <Input
        value={option.label}
        onChange={(e) => onLabelChange(option.id, e.target.value)}
        placeholder="選択肢のラベル"
        className="flex-1"
      />

      {/* デフォルト値設定 */}
      {isMultiSelect ? (
        <Checkbox
          checked={isDefault}
          onCheckedChange={() => onToggleDefault?.(option.id)}
          title="デフォルト値に設定"
        />
      ) : (
        <RadioGroupItem
          value={option.id}
          id={`default-${option.id}`}
          title="デフォルト値に設定"
        />
      )}

      {/* 削除ボタン */}
      <button
        type="button"
        onClick={() => onDelete(option.id)}
        className="text-muted-foreground hover:text-destructive transition-colors"
      >
        <Trash2 className="size-4" />
      </button>
    </div>
  );
}

/**
 * SELECT型カラムの設定エディタコンポーネント
 */
export function SelectConfigEditor({
  options,
  defaultValue,
  allowMultiple = false,
  onChange,
}: SelectConfigEditorProps) {
  const [localOptions, setLocalOptions] = useState<SelectOption[]>(options);
  const [localDefaultValue, setLocalDefaultValue] = useState<string | string[]>(
    defaultValue || (allowMultiple ? [] : '')
  );
  const [localAllowMultiple, setLocalAllowMultiple] =
    useState<boolean>(allowMultiple);

  // 親から受け取ったpropsが変更されたらローカルステートを更新
  useEffect(() => {
    setLocalOptions(options);
  }, [options]);

  useEffect(() => {
    setLocalDefaultValue(defaultValue || (allowMultiple ? [] : ''));
  }, [defaultValue, allowMultiple]);

  useEffect(() => {
    setLocalAllowMultiple(allowMultiple);
  }, [allowMultiple]);

  // DnDセンサーの設定
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // 選択肢追加
  const handleAddOption = () => {
    const newOption: SelectOption = {
      id: nanoid(),
      label: '',
      color: DEFAULT_COLOR,
    };
    const newOptions = [...localOptions, newOption];
    setLocalOptions(newOptions);
    onChange(newOptions, localDefaultValue, localAllowMultiple);
  };

  // ラベル変更
  const handleLabelChange = (id: string, label: string) => {
    const newOptions = localOptions.map((opt) =>
      opt.id === id ? { ...opt, label } : opt
    );
    setLocalOptions(newOptions);
    onChange(newOptions, localDefaultValue, localAllowMultiple);
  };

  // カラー変更
  const handleColorChange = (id: string, color: string) => {
    const newOptions = localOptions.map((opt) =>
      opt.id === id ? { ...opt, color } : opt
    );
    setLocalOptions(newOptions);
    onChange(newOptions, localDefaultValue, localAllowMultiple);
  };

  // 選択肢削除
  const handleDelete = (id: string) => {
    const newOptions = localOptions.filter((opt) => opt.id !== id);
    setLocalOptions(newOptions);

    // デフォルト値から削除
    let newDefaultValue = localDefaultValue;
    if (localAllowMultiple && Array.isArray(localDefaultValue)) {
      newDefaultValue = localDefaultValue.filter((val) => val !== id);
    } else if (localDefaultValue === id) {
      newDefaultValue = '';
    }
    setLocalDefaultValue(newDefaultValue);
    onChange(newOptions, newDefaultValue, localAllowMultiple);
  };

  // デフォルト値のトグル
  const handleToggleDefault = (id: string) => {
    let newDefaultValue: string | string[];
    if (localAllowMultiple) {
      const current = (localDefaultValue as string[]) || [];
      if (current.includes(id)) {
        newDefaultValue = current.filter((val) => val !== id);
      } else {
        newDefaultValue = [...current, id];
      }
    } else {
      newDefaultValue = localDefaultValue === id ? '' : id;
    }
    setLocalDefaultValue(newDefaultValue);
    onChange(localOptions, newDefaultValue, localAllowMultiple);
  };

  // 複数選択許可フラグ変更
  const handleAllowMultipleChange = (checked: boolean) => {
    setLocalAllowMultiple(checked);
    // 単一→複数に切り替えた場合、デフォルト値を配列に変換
    // 複数→単一に切り替えた場合、デフォルト値を空文字にリセット
    const newDefaultValue = checked
      ? typeof localDefaultValue === 'string' && localDefaultValue
        ? [localDefaultValue]
        : []
      : '';
    setLocalDefaultValue(newDefaultValue);
    onChange(localOptions, newDefaultValue, checked);
  };

  // ドラッグ終了時のハンドラ
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = localOptions.findIndex((opt) => opt.id === active.id);
      const newIndex = localOptions.findIndex((opt) => opt.id === over.id);

      const newOptions = [...localOptions];
      const [movedOption] = newOptions.splice(oldIndex, 1);
      newOptions.splice(newIndex, 0, movedOption);
      setLocalOptions(newOptions);
      onChange(newOptions, localDefaultValue, localAllowMultiple);
    }
  };

  return (
    <div className="space-y-4">
      {/* 選択肢 */}
      <div>
        <Label className="mb-3">選択肢</Label>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={localOptions.map((opt) => opt.id)}
            strategy={verticalListSortingStrategy}
          >
            {localAllowMultiple ? (
              <div className="space-y-2">
                {localOptions.map((option) => (
                  <OptionItem
                    key={option.id}
                    option={option}
                    isDefault={
                      (localDefaultValue as string[])?.includes(option.id) ||
                      false
                    }
                    isMultiSelect={localAllowMultiple}
                    onLabelChange={handleLabelChange}
                    onColorChange={handleColorChange}
                    onDelete={handleDelete}
                    onToggleDefault={handleToggleDefault}
                  />
                ))}
                {/* 選択肢を追加ボタン */}
                <button
                  type="button"
                  onClick={handleAddOption}
                  className="flex items-center gap-2 w-full p-3 border border-dashed rounded-lg text-muted-foreground hover:bg-accent/50 hover:text-foreground transition-colors"
                >
                  <Plus className="size-4" />
                  <span className="text-sm">選択肢を追加</span>
                </button>
              </div>
            ) : (
              <RadioGroup
                value={localDefaultValue as string}
                onValueChange={(value) => {
                  setLocalDefaultValue(value);
                  onChange(localOptions, value, localAllowMultiple);
                }}
              >
                <div className="space-y-2">
                  {localOptions.map((option) => (
                    <OptionItem
                      key={option.id}
                      option={option}
                      isDefault={localDefaultValue === option.id}
                      isMultiSelect={localAllowMultiple}
                      onLabelChange={handleLabelChange}
                      onColorChange={handleColorChange}
                      onDelete={handleDelete}
                    />
                  ))}
                  {/* 選択肢を追加ボタン */}
                  <button
                    type="button"
                    onClick={handleAddOption}
                    className="flex items-center gap-2 w-full p-3 border border-dashed rounded-lg text-muted-foreground hover:bg-accent/50 hover:text-foreground transition-colors"
                  >
                    <Plus className="size-4" />
                    <span className="text-sm">選択肢を追加</span>
                  </button>
                </div>
              </RadioGroup>
            )}
          </SortableContext>
        </DndContext>
      </div>

      {/* 複数選択許可 */}
      <div className="flex items-center space-x-2">
        <Checkbox
          id="allow-multiple"
          checked={localAllowMultiple}
          onCheckedChange={handleAllowMultipleChange}
        />
        <Label
          htmlFor="allow-multiple"
          className="text-sm font-normal cursor-pointer"
        >
          複数選択を許可する
        </Label>
      </div>
    </div>
  );
}
