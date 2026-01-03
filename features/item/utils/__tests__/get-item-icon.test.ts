import { getItemIcon } from '../get-item-icon';
import { Folder, Table, Users } from 'lucide-react';
import type { FolderItem, TableItem } from '../../types';

describe('getItemIcon', () => {
  it('カスタムアイコンが設定されている場合はそれを返す', () => {
    const item: FolderItem = {
      id: '1',
      type: 'FOLDER',
      name: 'Test Folder',
      icon: 'Users',
      parentId: null,
      order: 0,
      meta: null,
      createdById: 'user-1',
      createdAt: new Date(),
      updatedAt: new Date(),
      _count: {
        children: 0,
      },
    };

    const result = getItemIcon(item);
    expect(result).toBe(Users);
  });

  it('カスタムアイコンが未設定の場合はデフォルトアイコン（FOLDER）を返す', () => {
    const item: FolderItem = {
      id: '1',
      type: 'FOLDER',
      name: 'Test Folder',
      icon: null,
      parentId: null,
      order: 0,
      meta: null,
      createdById: 'user-1',
      createdAt: new Date(),
      updatedAt: new Date(),
      _count: {
        children: 0,
      },
    };

    const result = getItemIcon(item);
    expect(result).toBe(Folder);
  });

  it('カスタムアイコンが未設定の場合はデフォルトアイコン（TABLE）を返す', () => {
    const item: TableItem = {
      id: '1',
      type: 'TABLE',
      name: 'Test Table',
      icon: null,
      parentId: null,
      order: 0,
      meta: null,
      createdById: 'user-1',
      createdAt: new Date(),
      updatedAt: new Date(),
      _count: {
        children: 0,
      },
    };

    const result = getItemIcon(item);
    expect(result).toBe(Table);
  });

  it('無効なアイコン名の場合はデフォルトアイコンを返す', () => {
    const item: TableItem = {
      id: '1',
      type: 'TABLE',
      name: 'Test Table',
      icon: 'InvalidIconName',
      parentId: null,
      order: 0,
      meta: null,
      createdById: 'user-1',
      createdAt: new Date(),
      updatedAt: new Date(),
      _count: {
        children: 0,
      },
    };

    const result = getItemIcon(item);
    expect(result).toBe(Table);
  });

  it('空文字列の場合はデフォルトアイコンを返す', () => {
    const item: FolderItem = {
      id: '1',
      type: 'FOLDER',
      name: 'Test Folder',
      icon: '',
      parentId: null,
      order: 0,
      meta: null,
      createdById: 'user-1',
      createdAt: new Date(),
      updatedAt: new Date(),
      _count: {
        children: 0,
      },
    };

    const result = getItemIcon(item);
    expect(result).toBe(Folder);
  });
});
