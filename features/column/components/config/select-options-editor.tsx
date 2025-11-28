'use client';

import { useState } from 'react';
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { COLOR_PALETTE, DEFAULT_COLOR } from '../../constants';
import type { SelectOption } from '../../types';

/**
 * SelectOptionsEditorのProps型
 */
type SelectOptionsEditorProps = {
  options: SelectOption[];
  defaultValue?: string | string[];
  isMultiSelect?: boolean;
  onChange: (options: SelectOption[], defaultValue?: string | string[]) => void;
};

/**
 * 選択肢アイテムのProps型
 */
type OptionItemProps = {
  option: SelectOption;
  isDefault: boolean;
  isMultiSelect: boolean;
  onLabelChange: (id: string, label: string) => void;
  onColorChange: (id: string, color: string) => void;
  onDelete: (id: string) => void;
  onToggleDefault: (id: string) => void;
};

/**
 * 選択肢アイテムコンポーネント
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
          onCheckedChange={() => onToggleDefault(option.id)}
          title="デフォルト値に設定"
        />
      ) : (
        <button
          type="button"
          onClick={() => onToggleDefault(option.id)}
          className={`size-5 rounded-full border-2 ${
            isDefault ? 'border-primary bg-primary' : 'border-muted-foreground'
          }`}
          title="デフォルト値に設定"
        >
          {isDefault && <Check className="size-3 text-white m-auto" />}
        </button>
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
 * SELECT/MULTI_SELECT用の選択肢エディターコンポーネント
 */
export function SelectOptionsEditor({
  options,
  defaultValue,
  isMultiSelect = false,
  onChange,
}: SelectOptionsEditorProps) {
  const [localOptions, setLocalOptions] = useState<SelectOption[]>(options);
  const [localDefaultValue, setLocalDefaultValue] = useState<string | string[]>(
    defaultValue || (isMultiSelect ? [] : '')
  );

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
    onChange(newOptions, localDefaultValue);
  };

  // ラベル変更
  const handleLabelChange = (id: string, label: string) => {
    const newOptions = localOptions.map((opt) =>
      opt.id === id ? { ...opt, label } : opt
    );
    setLocalOptions(newOptions);
    onChange(newOptions, localDefaultValue);
  };

  // カラー変更
  const handleColorChange = (id: string, color: string) => {
    const newOptions = localOptions.map((opt) =>
      opt.id === id ? { ...opt, color } : opt
    );
    setLocalOptions(newOptions);
    onChange(newOptions, localDefaultValue);
  };

  // 選択肢削除
  const handleDelete = (id: string) => {
    const newOptions = localOptions.filter((opt) => opt.id !== id);
    setLocalOptions(newOptions);

    // デフォルト値から削除
    let newDefaultValue = localDefaultValue;
    if (isMultiSelect && Array.isArray(localDefaultValue)) {
      newDefaultValue = localDefaultValue.filter((val) => val !== id);
    } else if (localDefaultValue === id) {
      newDefaultValue = '';
    }
    setLocalDefaultValue(newDefaultValue);
    onChange(newOptions, newDefaultValue);
  };

  // デフォルト値のトグル
  const handleToggleDefault = (id: string) => {
    let newDefaultValue: string | string[];
    if (isMultiSelect) {
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
    onChange(localOptions, newDefaultValue);
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
      onChange(newOptions, localDefaultValue);
    }
  };

  return (
    <div>
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
            <div className="space-y-2">
              {localOptions.map((option) => (
                <OptionItem
                  key={option.id}
                  option={option}
                  isDefault={
                    isMultiSelect
                      ? (localDefaultValue as string[])?.includes(option.id) ||
                        false
                      : localDefaultValue === option.id
                  }
                  isMultiSelect={isMultiSelect}
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
          </SortableContext>
        </DndContext>
      </div>
    </div>
  );
}
