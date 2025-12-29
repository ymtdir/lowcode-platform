import type { Column } from '@/features/column/types';
import type {
  ValidationError,
  ValidationResult,
  ParsedImportRow,
  ParsedImportData,
} from '@/features/table/types/import';
import type { ParsedCSV } from '@/lib/csv';

/**
 * CSVヘッダーとカラム定義のマッピングを作成
 * @param headers - CSVヘッダー
 * @param columns - カラム定義配列
 * @returns カラム名 → カラム定義のマップ
 */
export function createColumnMapping(
  headers: string[],
  columns: Column[]
): Map<string, Column> {
  const mapping = new Map<string, Column>();

  // カラム名でマッチング（大文字小文字を区別しない）
  for (const header of headers) {
    const normalizedHeader = header.trim().toLowerCase();
    const column = columns.find(
      (col) => col.name.toLowerCase() === normalizedHeader
    );
    if (column) {
      mapping.set(header, column);
    }
  }

  return mapping;
}

/**
 * CSVヘッダーをバリデーション
 * @param headers - CSVヘッダー
 * @param columns - カラム定義配列
 * @returns バリデーション結果
 */
export function validateHeaders(
  headers: string[],
  columns: Column[]
): ValidationResult {
  const errors: ValidationError[] = [];

  // 必須カラム（requiredなカラム）がヘッダーに含まれているかチェック
  const requiredColumns = columns.filter(
    (col) => col.validation?.required === true
  );
  const normalizedHeaders = headers.map((h) => h.trim().toLowerCase());

  for (const column of requiredColumns) {
    const found = normalizedHeaders.includes(column.name.toLowerCase());
    if (!found) {
      errors.push({
        type: 'MISSING_HEADER',
        column: column.name,
        message: `必須カラム「${column.name}」がヘッダーに存在しません`,
      });
    }
  }

  // 不明なヘッダーがないかチェック（警告として扱う）
  const columnNames = columns.map((col) => col.name.toLowerCase());
  const warnings: ValidationError[] = [];

  for (const header of headers) {
    const normalizedHeader = header.trim().toLowerCase();
    // ID列はスキップ
    if (normalizedHeader === 'id') continue;

    if (!columnNames.includes(normalizedHeader) && normalizedHeader !== '') {
      warnings.push({
        type: 'UNKNOWN_HEADER',
        column: header,
        message: `不明なカラム「${header}」が含まれています（無視されます）`,
      });
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * 日付文字列が有効かチェック
 * @param dateStr - 日付文字列（YYYY-MM-DD、YYYY/MM/DD、YYYY-MM形式）
 * @returns 有効な日付かどうか
 */
function isValidDate(dateStr: string): boolean {
  if (!dateStr) return false;

  // YYYY-MM-DD、YYYY/MM/DD、YYYY-MM形式をサポート
  const datePatterns = [
    /^\d{4}-\d{2}-\d{2}$/, // YYYY-MM-DD
    /^\d{4}\/\d{2}\/\d{2}$/, // YYYY/MM/DD
    /^\d{4}-\d{2}$/, // YYYY-MM
  ];

  const matchesPattern = datePatterns.some((pattern) => pattern.test(dateStr));
  if (!matchesPattern) return false;

  // Date オブジェクトでの検証
  const normalizedDateStr = dateStr.replace(/\//g, '-');
  const date = new Date(normalizedDateStr);
  return !isNaN(date.getTime());
}

/**
 * 数値文字列が有効かチェック
 * @param numStr - 数値文字列
 * @returns 有効な数値かどうか
 */
function isValidNumber(numStr: string): boolean {
  if (!numStr) return false;
  // 千の位区切りカンマを除去
  const normalized = numStr.replace(/,/g, '');
  const num = Number(normalized);
  return !isNaN(num) && isFinite(num);
}

/**
 * セル値をバリデーション
 * @param value - セル値
 * @param column - カラム定義
 * @param rowIndex - 行インデックス
 * @param referencedRecordIds - RELATION型の参照先レコードIDセット（バリデーション用）
 * @returns バリデーションエラー（エラーがない場合は null）
 */
export function validateCellValue(
  value: string,
  column: Column,
  rowIndex: number,
  referencedRecordIds?: Map<string, Set<string>>
): ValidationError | null {
  const trimmedValue = value.trim();

  // 必須チェック
  if (column.validation?.required && !trimmedValue) {
    return {
      type: 'REQUIRED_FIELD',
      row: rowIndex,
      column: column.name,
      value,
      message: `${rowIndex + 1}行目: 「${column.name}」は必須項目です`,
    };
  }

  // 値が空の場合、必須チェック以外はスキップ
  if (!trimmedValue) {
    return null;
  }

  // データ型別のバリデーション
  switch (column.type) {
    case 'NUMBER': {
      if (!isValidNumber(trimmedValue)) {
        return {
          type: 'INVALID_NUMBER',
          row: rowIndex,
          column: column.name,
          value,
          message: `${rowIndex + 1}行目: 「${column.name}」は数値で入力してください`,
        };
      }

      // 範囲チェック
      const num = Number(trimmedValue.replace(/,/g, ''));
      if (column.config?.min !== undefined && num < column.config.min) {
        return {
          type: 'INVALID_NUMBER',
          row: rowIndex,
          column: column.name,
          value,
          message: `${rowIndex + 1}行目: 「${column.name}」は${column.config.min}以上の値を入力してください`,
        };
      }
      if (column.config?.max !== undefined && num > column.config.max) {
        return {
          type: 'INVALID_NUMBER',
          row: rowIndex,
          column: column.name,
          value,
          message: `${rowIndex + 1}行目: 「${column.name}」は${column.config.max}以下の値を入力してください`,
        };
      }
      break;
    }

    case 'DATE': {
      if (!isValidDate(trimmedValue)) {
        return {
          type: 'INVALID_DATE',
          row: rowIndex,
          column: column.name,
          value,
          message: `${rowIndex + 1}行目: 「${column.name}」は有効な日付形式（YYYY-MM-DD、YYYY/MM/DD、YYYY-MM）で入力してください`,
        };
      }
      break;
    }

    case 'SELECT': {
      // カンマ区切りで複数選択肢を分割
      const values = trimmedValue.split(',').map((v) => v.trim());

      // 複数選択が許可されていない場合
      if (!column.config.allowMultiple && values.length > 1) {
        return {
          type: 'INVALID_SELECT',
          row: rowIndex,
          column: column.name,
          value,
          message: `${rowIndex + 1}行目: 「${column.name}」は単一選択のみ許可されています`,
        };
      }

      // 各値が選択肢に存在するかチェック
      const validLabels = column.config.options.map((opt) => opt.label);
      for (const val of values) {
        if (!validLabels.includes(val)) {
          return {
            type: 'INVALID_SELECT',
            row: rowIndex,
            column: column.name,
            value: val,
            message: `${rowIndex + 1}行目: 「${column.name}」の選択肢「${val}」は存在しません`,
          };
        }
      }
      break;
    }

    case 'RELATION': {
      if (referencedRecordIds) {
        // カンマ区切りで複数参照を分割
        const values = trimmedValue.split(',').map((v) => v.trim());

        // 複数参照が許可されていない場合
        if (!column.config.allowMultiple && values.length > 1) {
          return {
            type: 'INVALID_RELATION',
            row: rowIndex,
            column: column.name,
            value,
            message: `${rowIndex + 1}行目: 「${column.name}」は単一参照のみ許可されています`,
          };
        }

        // 参照先が存在するかチェック
        const validIds = referencedRecordIds.get(column.id);
        if (validIds) {
          for (const val of values) {
            if (!validIds.has(val)) {
              return {
                type: 'INVALID_RELATION',
                row: rowIndex,
                column: column.name,
                value: val,
                message: `${rowIndex + 1}行目: 「${column.name}」の参照先「${val}」が存在しません`,
              };
            }
          }
        }
      }
      break;
    }

    case 'CHECKBOX': {
      // チェックボックスは true/false、1/0、yes/no などを受け入れる
      const normalizedValue = trimmedValue.toLowerCase();
      const validValues = ['true', 'false', '1', '0', 'yes', 'no'];
      if (!validValues.includes(normalizedValue)) {
        return {
          type: 'INVALID_TYPE',
          row: rowIndex,
          column: column.name,
          value,
          message: `${rowIndex + 1}行目: 「${column.name}」は true/false、1/0、yes/no のいずれかで入力してください`,
        };
      }
      break;
    }

    // TEXT、TEXTAREA は特にバリデーション不要
    default:
      break;
  }

  return null;
}

/**
 * セル値をカラムの型に応じて変換
 * @param value - セル値
 * @param column - カラム定義
 * @returns 変換された値
 */
export function convertCellValue(value: string, column: Column): unknown {
  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return null;
  }

  switch (column.type) {
    case 'NUMBER': {
      // 千の位区切りカンマを除去して数値に変換
      return Number(trimmedValue.replace(/,/g, ''));
    }

    case 'DATE': {
      // YYYY-MM-DD形式に正規化
      return trimmedValue.replace(/\//g, '-');
    }

    case 'SELECT': {
      // ラベルからIDに変換（カンマ区切りで複数対応）
      const labels = trimmedValue.split(',').map((v) => v.trim());
      const ids = labels
        .map((label) => {
          const option = column.config.options.find(
            (opt) => opt.label === label
          );
          return option?.id;
        })
        .filter((id): id is string => id !== undefined);

      // 常に配列形式で返す（エクスポート形式と統一）
      return ids;
    }

    case 'CHECKBOX': {
      const normalizedValue = trimmedValue.toLowerCase();
      return (
        normalizedValue === 'true' ||
        normalizedValue === '1' ||
        normalizedValue === 'yes'
      );
    }

    case 'RELATION': {
      // 表示値からレコードIDへの変換は後で行うため、ここでは配列形式で返す
      // カンマ区切りで複数参照を分割
      const values = trimmedValue.split(',').map((v) => v.trim());
      return values;
    }

    case 'TEXT':
    case 'TEXTAREA':
    default:
      return trimmedValue;
  }
}

/**
 * CSVデータをパースしてインポート用データに変換
 * @param parsedCsv - パース済みCSVデータ
 * @param columns - カラム定義配列
 * @returns パース済みインポートデータ
 */
export function parseImportData(
  parsedCsv: ParsedCSV,
  columns: Column[]
): ParsedImportData {
  const { headers, rows } = parsedCsv;
  const columnMapping = createColumnMapping(headers, columns);

  // ID列のインデックスを取得
  const idColumnIndex = headers.findIndex(
    (h) => h.trim().toLowerCase() === 'id'
  );

  const parsedRows: ParsedImportRow[] = rows.map((row) => {
    const data: Record<string, unknown> = {};
    let recordId: string | undefined;

    // ID列が存在する場合、recordIdを取得
    if (idColumnIndex !== -1) {
      const idValue = row[idColumnIndex]?.trim();
      if (idValue) {
        recordId = idValue;
      }
    }

    // 各セルを変換
    for (let i = 0; i < headers.length; i++) {
      const header = headers[i];
      const column = columnMapping.get(header);

      // ID列はスキップ
      if (i === idColumnIndex) continue;

      if (column) {
        const cellValue = row[i] || '';
        data[column.id] = convertCellValue(cellValue, column);
      }
    }

    return { recordId, data };
  });

  return { rows: parsedRows, columnMapping };
}

/**
 * インポートデータをバリデーション
 * @param parsedCsv - パース済みCSVデータ
 * @param columns - カラム定義配列
 * @param existingRecordIds - 既存のレコードIDセット（更新時のチェック用）
 * @param referencedRecordIds - RELATION型の参照先レコードIDマップ（カラムID → 表示値セット）
 * @returns バリデーション結果
 */
export function validateImportData(
  parsedCsv: ParsedCSV,
  columns: Column[],
  existingRecordIds?: Set<string>,
  referencedRecordIds?: Map<string, Set<string>>
): ValidationResult {
  const { headers, rows } = parsedCsv;
  const errors: ValidationError[] = [];

  // ヘッダーバリデーション
  const headerValidation = validateHeaders(headers, columns);
  errors.push(...headerValidation.errors);

  // データ行が存在しない場合
  if (rows.length === 0) {
    errors.push({
      type: 'INVALID_TYPE',
      message: 'インポートするデータがありません',
    });
    return {
      valid: false,
      errors,
      warnings: headerValidation.warnings,
    };
  }

  // カラムマッピングを作成
  const columnMapping = createColumnMapping(headers, columns);

  // ID列のインデックスを取得
  const idColumnIndex = headers.findIndex(
    (h) => h.trim().toLowerCase() === 'id'
  );

  // 重複IDチェック用のセット
  const seenIds = new Set<string>();

  // 各行のバリデーション
  for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
    const row = rows[rowIndex];

    // ID列のチェック
    if (idColumnIndex !== -1) {
      const idValue = row[idColumnIndex]?.trim();
      if (idValue) {
        // 重複IDチェック
        if (seenIds.has(idValue)) {
          errors.push({
            type: 'DUPLICATE_ID',
            row: rowIndex,
            column: 'ID',
            value: idValue,
            message: `${rowIndex + 1}行目: レコードID「${idValue}」が重複しています`,
          });
        }
        seenIds.add(idValue);

        // 既存レコードチェック（UPDATEモード時のみ）
        // NOTE: INSERTモードの場合は新規作成なので、既存IDがあってもエラーにしない
      }
    }

    // 各セルのバリデーション
    for (let colIndex = 0; colIndex < headers.length; colIndex++) {
      const header = headers[colIndex];
      const column = columnMapping.get(header);

      // ID列、または対応するカラムがない場合はスキップ
      if (colIndex === idColumnIndex || !column) continue;

      const cellValue = row[colIndex] || '';
      const error = validateCellValue(
        cellValue,
        column,
        rowIndex,
        referencedRecordIds
      );

      if (error) {
        errors.push(error);
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings: headerValidation.warnings,
  };
}
