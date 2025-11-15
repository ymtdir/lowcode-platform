import { renameFolder } from '../rename-folder';

// revalidatePathをモック化
jest.mock('next/cache', () => ({
  revalidatePath: jest.fn(),
}));

// Prismaクライアントをモック化
jest.mock('@/lib/prisma', () => ({
  prisma: {
    folder: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
  },
}));

import { prisma } from '@/lib/prisma';

describe('renameFolder', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('フォルダ名を変更できる', async () => {
    const folderId = 'folder-1';
    const newName = '新しいフォルダ名';

    (prisma.folder.findUnique as jest.Mock).mockResolvedValue({
      id: folderId,
      parentId: null,
    });

    (prisma.folder.findFirst as jest.Mock).mockResolvedValue(null);

    (prisma.folder.update as jest.Mock).mockResolvedValue({
      id: folderId,
      name: newName,
    });

    const result = await renameFolder(folderId, newName);

    expect(result).toEqual({ success: true });
    expect(prisma.folder.update).toHaveBeenCalledWith({
      where: { id: folderId },
      data: { name: newName },
    });
  });

  it('フォルダ名が空の場合はエラーを返す', async () => {
    const folderId = 'folder-1';
    const newName = '';

    const result = await renameFolder(folderId, newName);

    expect(result).toEqual({
      error: 'フォルダ名を入力してください',
    });
    expect(prisma.folder.update).not.toHaveBeenCalled();
  });

  it('フォルダ名が空白のみの場合はエラーを返す', async () => {
    const folderId = 'folder-1';
    const newName = '   ';

    const result = await renameFolder(folderId, newName);

    expect(result).toEqual({
      error: 'フォルダ名を入力してください',
    });
    expect(prisma.folder.update).not.toHaveBeenCalled();
  });

  it('使用できない文字が含まれている場合はエラーを返す', async () => {
    const folderId = 'folder-1';
    const newName = 'test/folder';

    const result = await renameFolder(folderId, newName);

    expect(result).toEqual({
      error: '使用できない文字が含まれています（/ \\ : * ? " < > |）',
    });
    expect(prisma.folder.update).not.toHaveBeenCalled();
  });

  it('フォルダが見つからない場合はエラーを返す', async () => {
    const folderId = 'non-existent';
    const newName = '新しいフォルダ名';

    (prisma.folder.findUnique as jest.Mock).mockResolvedValue(null);

    const result = await renameFolder(folderId, newName);

    expect(result).toEqual({
      error: 'フォルダが見つかりません',
    });
    expect(prisma.folder.update).not.toHaveBeenCalled();
  });

  it('同じ名前のフォルダが既に存在する場合はエラーを返す', async () => {
    const folderId = 'folder-1';
    const newName = '既存フォルダ';

    (prisma.folder.findUnique as jest.Mock).mockResolvedValue({
      id: folderId,
      parentId: null,
    });

    (prisma.folder.findFirst as jest.Mock).mockResolvedValue({
      id: 'folder-2',
      name: '既存フォルダ',
    });

    const result = await renameFolder(folderId, newName);

    expect(result).toEqual({
      error: 'この名前のフォルダは既に存在します',
    });
    expect(prisma.folder.update).not.toHaveBeenCalled();
  });

  it('データベースエラーが発生した場合はエラーを返す', async () => {
    const folderId = 'folder-1';
    const newName = '新しいフォルダ名';

    (prisma.folder.findUnique as jest.Mock).mockRejectedValue(
      new Error('Database error')
    );

    const result = await renameFolder(folderId, newName);

    expect(result).toEqual({
      error: 'フォルダ名の変更に失敗しました',
    });
  });
});
