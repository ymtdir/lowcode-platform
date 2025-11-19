import type {
  Column,
  CheckboxColumn,
  DateColumn,
  NumberColumn,
  SelectColumn,
  TextColumn,
  TextareaColumn,
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
      message:
        column.validation.message || `${column.name}は必須項目です`,
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

  const maxLength = column.config?.maxLength;
  if (maxLength && value.length > maxLength) {
    return {
      columnId: column.id,
      columnName: column.name,
      message: `${column.name}は${maxLength}文字以内で入力してください`,
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

  const maxLength = column.config?.maxLength;
  if (maxLength && value.length > maxLength) {
    return {
      columnId: column.id,
      columnName: column.name,
      message: `${column.name}は${maxLength}文字以内で入力してください`,
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

  return null;
}

/**
 * SELECT型のバリデーション
 */
function validateSelectValue(
  value: unknown,
  column: SelectColumn
): ValidationError | null {
  // 単一選択の場合
  if (typeof value === 'string') {
    const validOptionIds = column.config.options.map((opt) => opt.id);

    if (!validOptionIds.includes(value)) {
      return {
        columnId: column.id,
        columnName: column.name,
        message: `${column.name}は有効な選択肢から選んでください`,
      };
    }

    return null;
  }

  // 複数選択の場合（将来実装）
  if (Array.isArray(value)) {
    const validOptionIds = column.config.options.map((opt) => opt.id);

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

  return {
    columnId: column.id,
    columnName: column.name,
    message: `${column.name}は文字列または配列である必要があります`,
  };
}

/**
 * CHECKBOX型のバリデーション
 */
function validateCheckboxValue(
  value: unknown,
  column: CheckboxColumn
): ValidationError | null {
  // 単一選択の場合
  if (typeof value === 'boolean') {
    return null;
  }

  // 複数選択の場合（将来実装）
  if (Array.isArray(value)) {
    if (!column.config?.options) {
      return {
        columnId: column.id,
        columnName: column.name,
        message: `${column.name}の選択肢が定義されていません`,
      };
    }

    const validOptionIds = column.config.options.map((opt) => opt.id);

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

  return {
    columnId: column.id,
    columnName: column.name,
    message: `${column.name}はブール値または配列である必要があります`,
  };
}
