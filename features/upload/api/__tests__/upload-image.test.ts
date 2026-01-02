import { uploadImage } from '../upload-image';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';

// fs/promisesをモック化
jest.mock('fs/promises');
jest.mock('fs');

describe('uploadImage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (existsSync as jest.Mock).mockReturnValue(true);
  });

  it('画像をアップロードできる', async () => {
    const mockFile = new File(['test'], 'test.png', { type: 'image/png' });
    const formData = new FormData();
    formData.append('file', mockFile);

    (writeFile as jest.Mock).mockResolvedValue(undefined);

    const result = await uploadImage(formData, 'icon');

    expect(result.success).toBe(true);
    expect(result.path).toMatch(/^\/uploads\/icons\/[\w-]+\.png$/);
    expect(writeFile).toHaveBeenCalledTimes(1);
  });

  it('ファイルが選択されていない場合はエラーを返す', async () => {
    const formData = new FormData();

    const result = await uploadImage(formData);

    expect(result.success).toBe(false);
    expect(result.error).toBe('ファイルが選択されていません');
  });

  it('許可されていないファイルタイプの場合はエラーを返す', async () => {
    const mockFile = new File(['test'], 'test.txt', { type: 'text/plain' });
    const formData = new FormData();
    formData.append('file', mockFile);

    const result = await uploadImage(formData);

    expect(result.success).toBe(false);
    expect(result.error).toContain('画像ファイル');
  });

  it('ファイルサイズが5MBを超える場合はエラーを返す', async () => {
    const largeData = new Uint8Array(6 * 1024 * 1024); // 6MB
    const mockFile = new File([largeData], 'large.png', {
      type: 'image/png',
    });
    const formData = new FormData();
    formData.append('file', mockFile);

    const result = await uploadImage(formData);

    expect(result.success).toBe(false);
    expect(result.error).toContain('5MB');
  });

  it('ディレクトリが存在しない場合は作成する', async () => {
    const mockFile = new File(['test'], 'test.png', { type: 'image/png' });
    const formData = new FormData();
    formData.append('file', mockFile);

    (existsSync as jest.Mock).mockReturnValue(false);
    (mkdir as jest.Mock).mockResolvedValue(undefined);
    (writeFile as jest.Mock).mockResolvedValue(undefined);

    const result = await uploadImage(formData, 'icon');

    expect(result.success).toBe(true);
    expect(mkdir).toHaveBeenCalledWith(
      expect.stringContaining('public/uploads/icons'),
      { recursive: true }
    );
  });

  it('imageTypeがfaviconの場合はfaviconsディレクトリにアップロードする', async () => {
    const mockFile = new File(['test'], 'favicon.ico', {
      type: 'image/x-icon',
    });
    const formData = new FormData();
    formData.append('file', mockFile);

    (writeFile as jest.Mock).mockResolvedValue(undefined);

    const result = await uploadImage(formData, 'favicon');

    expect(result.success).toBe(true);
    expect(result.path).toMatch(/^\/uploads\/favicons\/[\w-]+\.ico$/);
  });

  it('imageTypeが指定されていない場合はuploadsディレクトリにアップロードする', async () => {
    const mockFile = new File(['test'], 'image.png', { type: 'image/png' });
    const formData = new FormData();
    formData.append('file', mockFile);

    (writeFile as jest.Mock).mockResolvedValue(undefined);

    const result = await uploadImage(formData);

    expect(result.success).toBe(true);
    expect(result.path).toMatch(/^\/uploads\/[\w-]+\.png$/);
  });

  it('拡張子が正しく保持される', async () => {
    const mockFile = new File(['test'], 'test.jpg', {
      type: 'image/jpeg',
    });
    const formData = new FormData();
    formData.append('file', mockFile);

    (writeFile as jest.Mock).mockResolvedValue(undefined);

    const result = await uploadImage(formData, 'icon');

    expect(result.success).toBe(true);
    expect(result.path).toMatch(/^\/uploads\/icons\/[\w-]+\.jpg$/);
  });

  it('拡張子がない場合はデフォルトでpngが使用される', async () => {
    const mockFile = new File(['test'], 'noextension', {
      type: 'image/png',
    });
    const formData = new FormData();
    formData.append('file', mockFile);

    (writeFile as jest.Mock).mockResolvedValue(undefined);

    const result = await uploadImage(formData, 'icon');

    expect(result.success).toBe(true);
    expect(result.path).toMatch(/^\/uploads\/icons\/[\w-]+\.png$/);
  });

  it('ファイル書き込みが失敗した場合はエラーを返す', async () => {
    const mockFile = new File(['test'], 'test.png', { type: 'image/png' });
    const formData = new FormData();
    formData.append('file', mockFile);

    (writeFile as jest.Mock).mockRejectedValue(
      new Error('Write permission denied')
    );

    const result = await uploadImage(formData, 'icon');

    expect(result.success).toBe(false);
    expect(result.error).toBe('ファイルのアップロードに失敗しました');
  });

  it('ディレクトリ作成が失敗した場合はエラーを返す', async () => {
    const mockFile = new File(['test'], 'test.png', { type: 'image/png' });
    const formData = new FormData();
    formData.append('file', mockFile);

    (existsSync as jest.Mock).mockReturnValue(false);
    (mkdir as jest.Mock).mockRejectedValue(new Error('Permission denied'));

    const result = await uploadImage(formData, 'icon');

    expect(result.success).toBe(false);
    expect(result.error).toBe('ファイルのアップロードに失敗しました');
  });
});
