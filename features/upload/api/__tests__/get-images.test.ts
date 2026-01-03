import { getImages } from '../get-images';
import { readdir, stat } from 'fs/promises';
import { existsSync } from 'fs';

// fs/promisesとfsをモック化
jest.mock('fs/promises');
jest.mock('fs');

describe('getImages', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('画像ファイル一覧を取得できる', async () => {
    (existsSync as jest.Mock).mockReturnValue(true);
    (readdir as jest.Mock).mockResolvedValue([
      'image1.png',
      'image2.jpg',
      'document.pdf',
    ]);
    (stat as jest.Mock).mockResolvedValue({
      size: 1024,
      mtime: new Date('2024-01-01'),
    });

    const result = await getImages('icon');

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({
      name: 'image1.png',
      path: '/uploads/icons/image1.png',
      size: 1024,
      modifiedAt: new Date('2024-01-01'),
    });
    expect(result[1]).toEqual({
      name: 'image2.jpg',
      path: '/uploads/icons/image2.jpg',
      size: 1024,
      modifiedAt: new Date('2024-01-01'),
    });
  });

  it('ディレクトリが存在しない場合は空配列を返す', async () => {
    (existsSync as jest.Mock).mockReturnValue(false);

    const result = await getImages('icon');

    expect(result).toEqual([]);
    expect(readdir).not.toHaveBeenCalled();
  });

  it('imageTypeがfaviconの場合はfaviconsディレクトリから取得する', async () => {
    (existsSync as jest.Mock).mockReturnValue(true);
    (readdir as jest.Mock).mockResolvedValue(['favicon.ico']);
    (stat as jest.Mock).mockResolvedValue({
      size: 2048,
      mtime: new Date('2024-01-02'),
    });

    const result = await getImages('favicon');

    expect(result).toHaveLength(1);
    expect(result[0].path).toBe('/uploads/favicons/favicon.ico');
  });

  it('imageTypeが指定されていない場合はuploadsディレクトリから取得する', async () => {
    (existsSync as jest.Mock).mockReturnValue(true);
    (readdir as jest.Mock).mockResolvedValue(['image.png']);
    (stat as jest.Mock).mockResolvedValue({
      size: 512,
      mtime: new Date('2024-01-03'),
    });

    const result = await getImages();

    expect(result).toHaveLength(1);
    expect(result[0].path).toBe('/uploads/image.png');
  });

  it('更新日時の降順でソートされる', async () => {
    (existsSync as jest.Mock).mockReturnValue(true);
    (readdir as jest.Mock).mockResolvedValue(['old.png', 'new.png']);
    (stat as jest.Mock)
      .mockResolvedValueOnce({
        size: 1024,
        mtime: new Date('2024-01-01'),
      })
      .mockResolvedValueOnce({
        size: 1024,
        mtime: new Date('2024-01-10'),
      });

    const result = await getImages('icon');

    expect(result[0].name).toBe('new.png');
    expect(result[1].name).toBe('old.png');
  });

  it('画像ファイルのみをフィルタリングする', async () => {
    (existsSync as jest.Mock).mockReturnValue(true);
    (readdir as jest.Mock).mockResolvedValue([
      'image.jpg',
      'image.jpeg',
      'image.png',
      'image.gif',
      'image.webp',
      'image.svg',
      'image.ico',
      'document.pdf',
      'data.json',
      'script.js',
    ]);
    (stat as jest.Mock).mockResolvedValue({
      size: 1024,
      mtime: new Date('2024-01-01'),
    });

    const result = await getImages('icon');

    expect(result).toHaveLength(7);
    expect(result.map((r) => r.name)).toEqual([
      'image.jpg',
      'image.jpeg',
      'image.png',
      'image.gif',
      'image.webp',
      'image.svg',
      'image.ico',
    ]);
  });

  it('拡張子の大文字小文字を区別しない', async () => {
    (existsSync as jest.Mock).mockReturnValue(true);
    (readdir as jest.Mock).mockResolvedValue([
      'image.PNG',
      'image.JPG',
      'image.GIF',
    ]);
    (stat as jest.Mock).mockResolvedValue({
      size: 1024,
      mtime: new Date('2024-01-01'),
    });

    const result = await getImages('icon');

    expect(result).toHaveLength(3);
  });

  it('エラーが発生した場合は空配列を返す', async () => {
    (existsSync as jest.Mock).mockReturnValue(true);
    (readdir as jest.Mock).mockRejectedValue(new Error('Read error'));

    const consoleErrorSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    const result = await getImages('icon');

    expect(result).toEqual([]);
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Failed to get images:',
      expect.any(Error)
    );

    consoleErrorSpy.mockRestore();
  });
});
