/**
 * CSV入出力用のユーティリティ関数
 */

/**
 * CSVパース結果
 */
export type ParsedCSV = {
  headers: string[];
  rows: string[][];
};

/**
 * 値をCSVセル用にエスケープする
 */
function escapeCsvCell(value: unknown): string {
  if (value === null || value === undefined) {
    return '';
  }

  const str = String(value);

  // カンマ、改行、ダブルクォートを含む場合はダブルクォートで囲む
  if (str.includes(',') || str.includes('\n') || str.includes('"')) {
    // ダブルクォートは2つ重ねてエスケープ
    return `"${str.replace(/"/g, '""')}"`;
  }

  return str;
}

/**
 * データをCSV形式に変換する
 * @param headers - ヘッダー行の配列
 * @param rows - データ行の配列（各行は値の配列）
 * @returns CSV形式の文字列
 */
export function convertToCSV(
  headers: string[],
  rows: (string | number | boolean | null | undefined)[][]
): string {
  const csvHeaders = headers.map(escapeCsvCell).join(',');
  const csvRows = rows.map((row) => row.map(escapeCsvCell).join(','));

  return [csvHeaders, ...csvRows].join('\n');
}

/**
 * CSVセルの値をアンエスケープする
 * @param cell - エスケープされたCSVセル値
 * @returns アンエスケープされた値
 */
function unescapeCsvCell(cell: string): string {
  let value = cell.trim();

  // ダブルクォートで囲まれている場合
  if (value.startsWith('"') && value.endsWith('"')) {
    // 前後のダブルクォートを除去
    value = value.slice(1, -1);
    // エスケープされたダブルクォート（""）を元に戻す
    value = value.replace(/""/g, '"');
  }

  return value;
}

/**
 * CSV文字列を1行ずつ分割する（改行がセル内にある場合も考慮）
 * @param csv - CSV形式の文字列
 * @returns 行の配列
 */
function splitCsvLines(csv: string): string[] {
  const lines: string[] = [];
  let currentLine = '';
  let inQuotes = false;

  for (let i = 0; i < csv.length; i++) {
    const char = csv[i];
    const nextChar = csv[i + 1];

    if (char === '"') {
      // ダブルクォートのエスケープ（""）かチェック
      if (nextChar === '"') {
        currentLine += '""';
        i++; // 次の文字をスキップ
      } else {
        // クォートの開始/終了を切り替え
        inQuotes = !inQuotes;
        currentLine += char;
      }
    } else if (char === '\n' && !inQuotes) {
      // クォート外の改行は行の区切り
      if (currentLine.trim()) {
        lines.push(currentLine);
      }
      currentLine = '';
    } else if (char === '\r' && nextChar === '\n' && !inQuotes) {
      // CRLF（Windows形式）の改行
      if (currentLine.trim()) {
        lines.push(currentLine);
      }
      currentLine = '';
      i++; // \nをスキップ
    } else {
      currentLine += char;
    }
  }

  // 最後の行を追加
  if (currentLine.trim()) {
    lines.push(currentLine);
  }

  return lines;
}

/**
 * CSV行をセルに分割する（カンマがセル内にある場合も考慮）
 * @param line - CSV行
 * @returns セルの配列
 */
function splitCsvCells(line: string): string[] {
  const cells: string[] = [];
  let currentCell = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      // ダブルクォートのエスケープ（""）かチェック
      if (inQuotes && nextChar === '"') {
        currentCell += '""';
        i++; // 次の文字をスキップ
      } else {
        // クォートの開始/終了を切り替え
        inQuotes = !inQuotes;
        currentCell += char;
      }
    } else if (char === ',' && !inQuotes) {
      // クォート外のカンマはセルの区切り
      cells.push(unescapeCsvCell(currentCell));
      currentCell = '';
    } else {
      currentCell += char;
    }
  }

  // 最後のセルを追加
  cells.push(unescapeCsvCell(currentCell));

  return cells;
}

/**
 * CSV文字列をパースする
 * @param csv - CSV形式の文字列（UTF-8、BOM付きも対応）
 * @returns パース結果（ヘッダーとデータ行）
 */
export function parseCSV(csv: string): ParsedCSV {
  // BOM（Byte Order Mark）を除去
  let content = csv;
  if (content.charCodeAt(0) === 0xfeff) {
    content = content.slice(1);
  }

  // 空のCSVの場合
  if (!content.trim()) {
    return { headers: [], rows: [] };
  }

  // 行に分割
  const lines = splitCsvLines(content);

  // ヘッダー行が存在しない場合
  if (lines.length === 0) {
    return { headers: [], rows: [] };
  }

  // ヘッダー行をパース
  const headers = splitCsvCells(lines[0]);

  // データ行をパース
  const rows = lines.slice(1).map((line) => {
    const cells = splitCsvCells(line);
    // ヘッダー数に合わせてセル数を調整（足りない場合は空文字で埋める）
    while (cells.length < headers.length) {
      cells.push('');
    }
    // 余分なセルは切り捨て
    return cells.slice(0, headers.length);
  });

  return { headers, rows };
}
