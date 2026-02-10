/**
 * ファイルダウンロード用のユーティリティ関数
 */

/**
 * CSVファイルをダウンロードする
 * @param csv - CSV形式の文字列
 * @param filename - ダウンロードするファイル名
 */
export function downloadCSV(csv: string, filename: string): void {
  // BOM付きUTF-8でエンコード（Excelで正しく開けるようにするため）
  const bom = '\uFEFF';
  const blob = new Blob([bom + csv], { type: 'text/csv;charset=utf-8;' });

  downloadBlob(blob, filename);
}

/**
 * JSONファイルをダウンロードする
 * @param json - JSON形式の文字列
 * @param filename - ダウンロードするファイル名
 */
export function downloadJSON(json: string, filename: string): void {
  const blob = new Blob([json], { type: 'application/json;charset=utf-8;' });

  downloadBlob(blob, filename);
}

/**
 * Blobをファイルとしてダウンロードする
 */
function downloadBlob(blob: Blob, filename: string): void {
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
