import { updateGroup } from '../update-group';

// Prismaクライアントをモック化
jest.mock('@/lib/prisma', () => ({
  prisma: {
    group: {
      update: jest.fn(),
      findUnique: jest.fn(),
    },
  },
}));

import { prisma } from '@/lib/prisma';

describe('updateGroup', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('グループを更新できる', async () => {
    const groupId = 'group-1';
    const formData = new FormData();
    formData.append('name', '更新されたグループ');
    formData.append('description', '更新された説明');
    formData.append('parentId', '');

    (prisma.group.update as jest.Mock).mockResolvedValue({
      id: groupId,
      name: '更新されたグループ',
      description: '更新された説明',
      parentId: null,
    });

    const result = await updateGroup(groupId, {}, formData);

    expect(result).toEqual({ success: true });
    expect(prisma.group.update).toHaveBeenCalledWith({
      where: { id: groupId },
      data: {
        name: '更新されたグループ',
        description: '更新された説明',
        parentId: null,
      },
    });
  });

  it('親グループを設定できる', async () => {
    const groupId = 'group-1';
    const parentId = 'parent-1';
    const formData = new FormData();
    formData.append('name', 'グループ');
    formData.append('description', '');
    formData.append('parentId', parentId);

    // 循環参照チェックのモック（親は存在しない = ルート）
    (prisma.group.findUnique as jest.Mock).mockResolvedValue(null);
    (prisma.group.update as jest.Mock).mockResolvedValue({
      id: groupId,
      name: 'グループ',
      parentId,
    });

    const result = await updateGroup(groupId, {}, formData);

    expect(result).toEqual({ success: true });
    expect(prisma.group.update).toHaveBeenCalledWith({
      where: { id: groupId },
      data: {
        name: 'グループ',
        description: null,
        parentId,
      },
    });
  });

  it('グループ名が空の場合はエラーを返す', async () => {
    const formData = new FormData();
    formData.append('name', '');
    formData.append('description', '');
    formData.append('parentId', '');

    const result = await updateGroup('group-1', {}, formData);

    expect(result).toEqual({
      error: 'グループ名を入力してください',
    });
    expect(prisma.group.update).not.toHaveBeenCalled();
  });

  it('自分自身を親として設定しようとするとエラーを返す', async () => {
    const groupId = 'group-1';
    const formData = new FormData();
    formData.append('name', 'グループ');
    formData.append('description', '');
    formData.append('parentId', groupId);

    const result = await updateGroup(groupId, {}, formData);

    expect(result).toEqual({
      error: '自分自身を親グループとして設定することはできません',
    });
    expect(prisma.group.update).not.toHaveBeenCalled();
  });

  it('子グループを親として設定しようとするとエラーを返す', async () => {
    const groupId = 'group-1';
    const childId = 'child-1';
    const formData = new FormData();
    formData.append('name', 'グループ');
    formData.append('description', '');
    formData.append('parentId', childId);

    // 循環参照チェックのモック（childIdの親がgroupId）
    (prisma.group.findUnique as jest.Mock).mockResolvedValue({
      parentId: groupId,
    });

    const result = await updateGroup(groupId, {}, formData);

    expect(result).toEqual({
      error: '子グループを親として設定することはできません',
    });
    expect(prisma.group.update).not.toHaveBeenCalled();
  });

  it('データベースエラーが発生した場合はエラーを返す', async () => {
    const groupId = 'group-1';
    const formData = new FormData();
    formData.append('name', 'グループ');
    formData.append('description', '');
    formData.append('parentId', '');

    (prisma.group.update as jest.Mock).mockRejectedValue(
      new Error('Database error')
    );

    const result = await updateGroup(groupId, {}, formData);

    expect(result).toEqual({
      error: 'グループの更新に失敗しました',
    });
  });
});
