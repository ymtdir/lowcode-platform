import type {
  Column,
  CheckboxColumn,
  DateColumn,
  NumberColumn,
  SelectColumn,
  TextColumn,
  TextareaColumn,
  RelationColumn,
} from '../types/column';
import type { ValidationError } from '../types/validation';

/**
 * カラムの値をバリデーション
 */
export function validateColumnValue(
  value: unknown,
  column: Column
): ValidationError | null {
  // required チェック
  if (column.validation?.required && isEmptyValue(value)) {
    return {
      columnId: column.id,
      columnName: column.name,
      message: column.validation.message || `${column.name}は必須項目です`,
    };
  }

  // 値が空の場合はそれ以上のチェックをスキップ
  if (isEmptyValue(value)) {
    return null;
  }

  // カラムタイプごとのバリデーション
  switch (column.type) {
    case 'TEXT':
      return validateTextValue(value, column);
    case 'TEXTAREA':
      return validateTextareaValue(value, column);
    case 'NUMBER':
      return validateNumberValue(value, column);
    case 'DATE':
      return validateDateValue(value, column);
    case 'SELECT':
      return validateSelectValue(value, column);
    case 'CHECKBOX':
      return validateCheckboxValue(value, column);
    case 'RELATION':
      return validateRelationValue(value, column);
    default:
      return null;
  }
}

/**
 * 値が空かどうかを判定
 */
function isEmptyValue(value: unknown): boolean {
  return (
    value === null ||
    value === undefined ||
    value === '' ||
    (Array.isArray(value) && value.length === 0)
  );
}

/**
 * TEXT型のバリデーション
 */
function validateTextValue(
  value: unknown,
  column: TextColumn
): ValidationError | null {
  if (typeof value !== 'string') {
    return {
      columnId: column.id,
      columnName: column.name,
      message: `${column.name}は文字列である必要があります`,
    };
  }

  return null;
}

/**
 * TEXTAREA型のバリデーション
 */
function validateTextareaValue(
  value: unknown,
  column: TextareaColumn
): ValidationError | null {
  if (typeof value !== 'string') {
    return {
      columnId: column.id,
      columnName: column.name,
      message: `${column.name}は文字列である必要があります`,
    };
  }

  return null;
}

/**
 * NUMBER型のバリデーション
 */
function validateNumberValue(
  value: unknown,
  column: NumberColumn
): ValidationError | null {
  const numValue = Number(value);

  if (isNaN(numValue)) {
    return {
      columnId: column.id,
      columnName: column.name,
      message: `${column.name}は数値である必要があります`,
    };
  }

  const min = column.config?.min;
  if (min !== undefined && numValue < min) {
    return {
      columnId: column.id,
      columnName: column.name,
      message: `${column.name}は${min}以上である必要があります`,
    };
  }

  const max = column.config?.max;
  if (max !== undefined && numValue > max) {
    return {
      columnId: column.id,
      columnName: column.name,
      message: `${column.name}は${max}以下である必要があります`,
    };
  }

  return null;
}

/**
 * DATE型のバリデーション
 */
function validateDateValue(
  value: unknown,
  column: DateColumn
): ValidationError | null {
  if (typeof value !== 'string') {
    return {
      columnId: column.id,
      columnName: column.name,
      message: `${column.name}は文字列である必要があります`,
    };
  }

  // ISO 8601形式かどうかをチェック
  const date = new Date(value);
  if (isNaN(date.getTime())) {
    return {
      columnId: column.id,
      columnName: column.name,
      message: `${column.name}は有効な日付形式である必要があります`,
    };
  }

  const min = column.config?.min;
  if (min && value < min) {
    return {
      columnId: column.id,
      columnName: column.name,
      message: `${column.name}は${min}以降である必要があります`,
    };
  }

  const max = column.config?.max;
  if (max && value > max) {
    return {
      columnId: column.id,
      columnName: column.name,
      message: `${column.name}は${max}以前である必要があります`,
    };
  }

  // 過去日付の許可チェック
  const allowPast = column.config?.allowPast !== false; // デフォルトtrue
  if (!allowPast) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (date < today) {
      return {
        columnId: column.id,
        columnName: column.name,
        message: `${column.name}は今日以降の日付を入力してください`,
      };
    }
  }

  // 未来日付の許可チェック
  const allowFuture = column.config?.allowFuture !== false; // デフォルトtrue
  if (!allowFuture) {
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    if (date > today) {
      return {
        columnId: column.id,
        columnName: column.name,
        message: `${column.name}は今日以前の日付を入力してください`,
      };
    }
  }

  return null;
}

/**
 * SELECT型のバリデーション
 */
function validateSelectValue(
  value: unknown,
  column: SelectColumn
): ValidationError | null {
  const allowMultiple = column.config.allowMultiple || false;

  // 単一選択の場合
  if (!allowMultiple) {
    if (typeof value !== 'string') {
      return {
        columnId: column.id,
        columnName: column.name,
        message: `${column.name}は文字列である必要があります`,
      };
    }

    const validOptionIds = column.config.options.map((opt) => opt.id);

    // 選択肢のIDにマッチしない場合はエラー
    if (!validOptionIds.includes(value)) {
      return {
        columnId: column.id,
        columnName: column.name,
        message: `${column.name}は有効な選択肢から選んでください`,
      };
    }

    return null;
  }

  // 複数選択の場合
  if (!Array.isArray(value)) {
    return {
      columnId: column.id,
      columnName: column.name,
      message: `${column.name}は配列である必要があります`,
    };
  }

  // 空配列の場合はOK
  if (value.length === 0) {
    return null;
  }

  const validOptionIds = column.config.options.map((opt) => opt.id);

  // すべての値が選択肢のIDにマッチするかチェック
  const invalidValues = value.filter(
    (v) => typeof v !== 'string' || !validOptionIds.includes(v)
  );

  if (invalidValues.length > 0) {
    return {
      columnId: column.id,
      columnName: column.name,
      message: `${column.name}は有効な選択肢から選んでください`,
    };
  }

  return null;
}

/**
 * CHECKBOX型のバリデーション
 */
function validateCheckboxValue(
  value: unknown,
  column: CheckboxColumn
): ValidationError | null {
  // CHECKBOXはboolean値のみ
  if (typeof value === 'boolean') {
    return null;
  }

  return {
    columnId: column.id,
    columnName: column.name,
    message: `${column.name}はブール値である必要があります`,
  };
}

/**
 * RELATION型のバリデーション
 */
function validateRelationValue(
  value: unknown,
  column: RelationColumn
): ValidationError | null {
  const allowMultiple = column.config.allowMultiple || false;

  // 単一参照の場合（文字列または配列を許容 - 互換性のため）
  if (!allowMultiple) {
    // 文字列の場合
    if (typeof value === 'string') {
      return null;
    }
    // 配列の場合（allowMultiple切り替え時の互換性）
    if (Array.isArray(value)) {
      // 空配列はOK
      if (value.length === 0) return null;
      // すべて文字列ならOK
      const invalidValues = value.filter((v) => typeof v !== 'string');
      if (invalidValues.length === 0) return null;
    }
    return {
      columnId: column.id,
      columnName: column.name,
      message: `${column.name}は文字列またはレコードIDの配列である必要があります`,
    };
  }

  // 複数参照の場合（配列または文字列を許容 - 互換性のため）
  // 文字列の場合（allowMultiple切り替え時の互換性）
  if (typeof value === 'string') {
    return null;
  }

  // 配列の場合
  if (!Array.isArray(value)) {
    return {
      columnId: column.id,
      columnName: column.name,
      message: `${column.name}は配列またはレコードIDである必要があります`,
    };
  }

  // 空配列の場合はOK
  if (value.length === 0) {
    return null;
  }

  // すべての値が文字列かチェック
  const invalidValues = value.filter((v) => typeof v !== 'string');
  if (invalidValues.length > 0) {
    return {
      columnId: column.id,
      columnName: column.name,
      message: `${column.name}の値はすべて文字列である必要があります`,
    };
  }

  return null;
}
