import { deleteImage } from '../delete-image';
import { unlink } from 'fs/promises';
import { existsSync } from 'fs';

// fs/promisesとfsをモック化
jest.mock('fs/promises');
jest.mock('fs');

describe('deleteImage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('画像を削除できる', async () => {
    (existsSync as jest.Mock).mockReturnValue(true);
    (unlink as jest.Mock).mockResolvedValue(undefined);

    const result = await deleteImage('/uploads/icons/test.png');

    expect(result.success).toBe(true);
    expect(unlink).toHaveBeenCalledWith(
      expect.stringContaining('public/uploads/icons/test.png')
    );
  });

  it('パスが/uploads/で始まらない場合はエラーを返す', async () => {
    const result = await deleteImage('/invalid/path/image.png');

    expect(result.success).toBe(false);
    expect(result.error).toBe('無効なパスです');
    expect(unlink).not.toHaveBeenCalled();
  });

  it('ファイルが存在しない場合はエラーを返す', async () => {
    (existsSync as jest.Mock).mockReturnValue(false);

    const result = await deleteImage('/uploads/icons/nonexistent.png');

    expect(result.success).toBe(false);
    expect(result.error).toBe('ファイルが見つかりません');
    expect(unlink).not.toHaveBeenCalled();
  });

  it('削除に失敗した場合はエラーを返す', async () => {
    (existsSync as jest.Mock).mockReturnValue(true);
    (unlink as jest.Mock).mockRejectedValue(new Error('Delete failed'));

    const consoleErrorSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    const result = await deleteImage('/uploads/icons/test.png');

    expect(result.success).toBe(false);
    expect(result.error).toBe('ファイルの削除に失敗しました');
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Failed to delete image:',
      expect.any(Error)
    );

    consoleErrorSpy.mockRestore();
  });

  it('faviconsディレクトリの画像を削除できる', async () => {
    (existsSync as jest.Mock).mockReturnValue(true);
    (unlink as jest.Mock).mockResolvedValue(undefined);

    const result = await deleteImage('/uploads/favicons/favicon.ico');

    expect(result.success).toBe(true);
    expect(unlink).toHaveBeenCalledWith(
      expect.stringContaining('public/uploads/favicons/favicon.ico')
    );
  });

  it('サブディレクトリのない画像を削除できる', async () => {
    (existsSync as jest.Mock).mockReturnValue(true);
    (unlink as jest.Mock).mockResolvedValue(undefined);

    const result = await deleteImage('/uploads/image.png');

    expect(result.success).toBe(true);
    expect(unlink).toHaveBeenCalledWith(
      expect.stringContaining('public/uploads/image.png')
    );
  });
});
