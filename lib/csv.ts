/**
 * CSV出力用のユーティリティ関数
 */

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
 * CSVファイルをダウンロードする
 * @param csv - CSV形式の文字列
 * @param filename - ダウンロードするファイル名
 */
export function downloadCSV(csv: string, filename: string): void {
  // BOM付きUTF-8でエンコード（Excelで正しく開けるようにするため）
  const bom = '\uFEFF';
  const blob = new Blob([bom + csv], { type: 'text/csv;charset=utf-8;' });

  // ダウンロード用のリンクを作成
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // メモリリークを防ぐためURLを解放
  URL.revokeObjectURL(url);
}
