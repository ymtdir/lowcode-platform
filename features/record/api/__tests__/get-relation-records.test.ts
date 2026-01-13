import { getRelationRecords } from '../get-relation-records';
import type { Column } from '@/features/column/types';

// Prismaクライアントをモック化
jest.mock('@/lib/prisma', () => ({
  prisma: {
    record: {
      findMany: jest.fn(),
    },
  },
}));

// システムテーブルAPIをモック化
jest.mock('@/features/user/api/get-users', () => ({
  getUsers: jest.fn(),
}));

jest.mock('@/features/group/api/get-groups', () => ({
  getGroups: jest.fn(),
}));

import { prisma } from '@/lib/prisma';
import { getUsers } from '@/features/user/api/get-users';
import { getGroups } from '@/features/group/api/get-groups';

describe('getRelationRecords', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('リレーションカラムがない場合は空のMapを返す', async () => {
    const columns: Column[] = [
      {
        id: 'col-1',
        name: 'テキスト',
        type: 'TEXT',
        order: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    const result = await getRelationRecords(columns);

    expect(result).toEqual(new Map());
    expect(prisma.record.findMany).not.toHaveBeenCalled();
  });

  it('単一のリレーションカラムのレコードを取得できる', async () => {
    const columns: Column[] = [
      {
        id: 'col-1',
        name: '顧客',
        type: 'RELATION',
        order: 0,
        config: {
          referencedTableId: 'table-1',
          displayField: 'name',
          allowMultiple: false,
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    const mockRecords = [
      {
        id: 'record-1',
        tableId: 'table-1',
        data: { name: '顧客A' },
        createdById: 'user-1',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      },
      {
        id: 'record-2',
        tableId: 'table-1',
        data: { name: '顧客B' },
        createdById: 'user-1',
        createdAt: new Date('2024-01-02'),
        updatedAt: new Date('2024-01-02'),
      },
    ];

    (prisma.record.findMany as jest.Mock).mockResolvedValue(mockRecords);

    const result = await getRelationRecords(columns);

    expect(result.size).toBe(1);
    expect(result.get('col-1')).toEqual([
      { id: 'record-1', displayValue: '顧客A', exists: true },
      { id: 'record-2', displayValue: '顧客B', exists: true },
    ]);
    expect(prisma.record.findMany).toHaveBeenCalledWith({
      where: { tableId: 'table-1' },
      orderBy: { createdAt: 'desc' },
    });
  });

  it('複数のリレーションカラムのレコードを取得できる', async () => {
    const columns: Column[] = [
      {
        id: 'col-1',
        name: '顧客',
        type: 'RELATION',
        order: 0,
        config: {
          referencedTableId: 'table-1',
          displayField: 'name',
          allowMultiple: false,
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'col-2',
        name: '担当者',
        type: 'RELATION',
        order: 1,
        config: {
          referencedTableId: 'table-2',
          displayField: 'userName',
          allowMultiple: false,
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    const mockRecords1 = [
      {
        id: 'record-1',
        tableId: 'table-1',
        data: { name: '顧客A' },
        createdById: 'user-1',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      },
    ];

    const mockRecords2 = [
      {
        id: 'record-2',
        tableId: 'table-2',
        data: { userName: '山田太郎' },
        createdById: 'user-1',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      },
    ];

    (prisma.record.findMany as jest.Mock)
      .mockResolvedValueOnce(mockRecords1)
      .mockResolvedValueOnce(mockRecords2);

    const result = await getRelationRecords(columns);

    expect(result.size).toBe(2);
    expect(result.get('col-1')).toEqual([
      { id: 'record-1', displayValue: '顧客A', exists: true },
    ]);
    expect(result.get('col-2')).toEqual([
      { id: 'record-2', displayValue: '山田太郎', exists: true },
    ]);
    expect(prisma.record.findMany).toHaveBeenCalledTimes(2);
  });

  it('同じテーブルを参照する複数カラムで異なる表示フィールドを使える', async () => {
    const columns: Column[] = [
      {
        id: 'col-1',
        name: '会社名',
        type: 'RELATION',
        order: 0,
        config: {
          referencedTableId: 'customer-table',
          displayField: 'companyName',
          allowMultiple: false,
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'col-2',
        name: '担当者名',
        type: 'RELATION',
        order: 1,
        config: {
          referencedTableId: 'customer-table',
          displayField: 'contactName',
          allowMultiple: false,
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    const mockRecords = [
      {
        id: 'customer-1',
        tableId: 'customer-table',
        data: { companyName: 'A社', contactName: '山田太郎' },
        createdById: 'user-1',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      },
      {
        id: 'customer-2',
        tableId: 'customer-table',
        data: { companyName: 'B社', contactName: '佐藤花子' },
        createdById: 'user-1',
        createdAt: new Date('2024-01-02'),
        updatedAt: new Date('2024-01-02'),
      },
    ];

    (prisma.record.findMany as jest.Mock).mockResolvedValue(mockRecords);

    const result = await getRelationRecords(columns);

    expect(result.size).toBe(2);
    expect(result.get('col-1')).toEqual([
      { id: 'customer-1', displayValue: 'A社', exists: true },
      { id: 'customer-2', displayValue: 'B社', exists: true },
    ]);
    expect(result.get('col-2')).toEqual([
      { id: 'customer-1', displayValue: '山田太郎', exists: true },
      { id: 'customer-2', displayValue: '佐藤花子', exists: true },
    ]);
    expect(prisma.record.findMany).toHaveBeenCalledTimes(2);
  });

  it('表示フィールドの値が存在しない場合はIDをフォールバックする', async () => {
    const columns: Column[] = [
      {
        id: 'col-1',
        name: '顧客',
        type: 'RELATION',
        order: 0,
        config: {
          referencedTableId: 'table-1',
          displayField: 'name',
          allowMultiple: false,
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    const mockRecords = [
      {
        id: 'record-1',
        tableId: 'table-1',
        data: { otherField: '値' }, // nameフィールドが存在しない
        createdById: 'user-1',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      },
    ];

    (prisma.record.findMany as jest.Mock).mockResolvedValue(mockRecords);

    const result = await getRelationRecords(columns);

    expect(result.get('col-1')).toEqual([
      { id: 'record-1', displayValue: 'record-1', exists: true },
    ]);
  });

  it('表示フィールドの値が空文字の場合はIDをフォールバックする', async () => {
    const columns: Column[] = [
      {
        id: 'col-1',
        name: '顧客',
        type: 'RELATION',
        order: 0,
        config: {
          referencedTableId: 'table-1',
          displayField: 'name',
          allowMultiple: false,
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    const mockRecords = [
      {
        id: 'record-1',
        tableId: 'table-1',
        data: { name: '' }, // 空文字
        createdById: 'user-1',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      },
    ];

    (prisma.record.findMany as jest.Mock).mockResolvedValue(mockRecords);

    const result = await getRelationRecords(columns);

    expect(result.get('col-1')).toEqual([
      { id: 'record-1', displayValue: 'record-1', exists: true },
    ]);
  });

  it('displayFieldが未指定の場合はIDを使用する', async () => {
    const columns: Column[] = [
      {
        id: 'col-1',
        name: '顧客',
        type: 'RELATION',
        order: 0,
        config: {
          referencedTableId: 'table-1',
          displayField: '',
          allowMultiple: false,
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    const mockRecords = [
      {
        id: 'record-1',
        tableId: 'table-1',
        data: { name: '顧客A' },
        createdById: 'user-1',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      },
    ];

    (prisma.record.findMany as jest.Mock).mockResolvedValue(mockRecords);

    const result = await getRelationRecords(columns);

    expect(result.get('col-1')).toEqual([
      { id: 'record-1', displayValue: 'record-1', exists: true },
    ]);
  });

  it('参照先テーブルにレコードが存在しない場合は空配列を返す', async () => {
    const columns: Column[] = [
      {
        id: 'col-1',
        name: '顧客',
        type: 'RELATION',
        order: 0,
        config: {
          referencedTableId: 'table-1',
          displayField: 'name',
          allowMultiple: false,
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    (prisma.record.findMany as jest.Mock).mockResolvedValue([]);

    const result = await getRelationRecords(columns);

    expect(result.size).toBe(1);
    expect(result.get('col-1')).toEqual([]);
    expect(prisma.record.findMany).toHaveBeenCalledWith({
      where: { tableId: 'table-1' },
      orderBy: { createdAt: 'desc' },
    });
  });

  it('作成日時の降順でソートされる', async () => {
    const columns: Column[] = [
      {
        id: 'col-1',
        name: '顧客',
        type: 'RELATION',
        order: 0,
        config: {
          referencedTableId: 'table-1',
          displayField: 'name',
          allowMultiple: false,
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    (prisma.record.findMany as jest.Mock).mockResolvedValue([]);

    await getRelationRecords(columns);

    expect(prisma.record.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: { createdAt: 'desc' },
      })
    );
  });

  describe('システムテーブル: users', () => {
    it('usersテーブルを参照できる', async () => {
      const columns: Column[] = [
        {
          id: 'col-1',
          name: '担当者',
          type: 'RELATION',
          order: 0,
          config: {
            referencedTableId: 'users',
            displayField: 'name',
            allowMultiple: false,
          },
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const mockUsers = [
        {
          id: 'user-1',
          email: 'user1@example.com',
          name: '山田太郎',
          role: 'ADMIN',
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01'),
        },
        {
          id: 'user-2',
          email: 'user2@example.com',
          name: '佐藤花子',
          role: 'USER',
          createdAt: new Date('2024-01-02'),
          updatedAt: new Date('2024-01-02'),
        },
      ];

      (getUsers as jest.Mock).mockResolvedValue(mockUsers);

      const result = await getRelationRecords(columns);

      expect(result.size).toBe(1);
      expect(result.get('col-1')).toEqual([
        { id: 'user-1', displayValue: '山田太郎', exists: true },
        { id: 'user-2', displayValue: '佐藤花子', exists: true },
      ]);
      expect(getUsers).toHaveBeenCalledTimes(1);
      expect(prisma.record.findMany).not.toHaveBeenCalled();
    });

    it('users: displayFieldにemailを指定できる', async () => {
      const columns: Column[] = [
        {
          id: 'col-1',
          name: '担当者',
          type: 'RELATION',
          order: 0,
          config: {
            referencedTableId: 'users',
            displayField: 'email',
            allowMultiple: false,
          },
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const mockUsers = [
        {
          id: 'user-1',
          email: 'user1@example.com',
          name: '山田太郎',
          role: 'ADMIN',
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01'),
        },
      ];

      (getUsers as jest.Mock).mockResolvedValue(mockUsers);

      const result = await getRelationRecords(columns);

      expect(result.get('col-1')).toEqual([
        { id: 'user-1', displayValue: 'user1@example.com', exists: true },
      ]);
    });

    it('users: displayFieldが空の場合はnameまたはemailを使用する', async () => {
      const columns: Column[] = [
        {
          id: 'col-1',
          name: '担当者',
          type: 'RELATION',
          order: 0,
          config: {
            referencedTableId: 'users',
            displayField: '',
            allowMultiple: false,
          },
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const mockUsers = [
        {
          id: 'user-1',
          email: 'user1@example.com',
          name: '山田太郎',
          role: 'ADMIN',
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01'),
        },
      ];

      (getUsers as jest.Mock).mockResolvedValue(mockUsers);

      const result = await getRelationRecords(columns);

      expect(result.get('col-1')).toEqual([
        { id: 'user-1', displayValue: '山田太郎', exists: true },
      ]);
    });

    it('users: nameが空の場合はemailをフォールバックする', async () => {
      const columns: Column[] = [
        {
          id: 'col-1',
          name: '担当者',
          type: 'RELATION',
          order: 0,
          config: {
            referencedTableId: 'users',
            displayField: 'name',
            allowMultiple: false,
          },
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const mockUsers = [
        {
          id: 'user-1',
          email: 'user1@example.com',
          name: '',
          role: 'ADMIN',
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01'),
        },
      ];

      (getUsers as jest.Mock).mockResolvedValue(mockUsers);

      const result = await getRelationRecords(columns);

      expect(result.get('col-1')).toEqual([
        { id: 'user-1', displayValue: 'user1@example.com', exists: true },
      ]);
    });
  });

  describe('システムテーブル: groups', () => {
    it('groupsテーブルを参照できる', async () => {
      const columns: Column[] = [
        {
          id: 'col-1',
          name: '所属グループ',
          type: 'RELATION',
          order: 0,
          config: {
            referencedTableId: 'groups',
            displayField: 'name',
            allowMultiple: false,
          },
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const mockGroups = [
        {
          id: 'group-1',
          name: '営業部',
          description: '営業活動を行う部門',
          parentId: null,
          parent: null,
          members: [],
          _count: { members: 0 },
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01'),
        },
        {
          id: 'group-2',
          name: '開発部',
          description: '開発を行う部門',
          parentId: null,
          parent: null,
          members: [],
          _count: { members: 0 },
          createdAt: new Date('2024-01-02'),
          updatedAt: new Date('2024-01-02'),
        },
      ];

      (getGroups as jest.Mock).mockResolvedValue(mockGroups);

      const result = await getRelationRecords(columns);

      expect(result.size).toBe(1);
      expect(result.get('col-1')).toEqual([
        { id: 'group-1', displayValue: '営業部', exists: true },
        { id: 'group-2', displayValue: '開発部', exists: true },
      ]);
      expect(getGroups).toHaveBeenCalledTimes(1);
      expect(prisma.record.findMany).not.toHaveBeenCalled();
    });

    it('groups: displayFieldが空の場合はnameを使用する', async () => {
      const columns: Column[] = [
        {
          id: 'col-1',
          name: '所属グループ',
          type: 'RELATION',
          order: 0,
          config: {
            referencedTableId: 'groups',
            displayField: '',
            allowMultiple: false,
          },
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const mockGroups = [
        {
          id: 'group-1',
          name: '営業部',
          description: '営業活動を行う部門',
          parentId: null,
          parent: null,
          members: [],
          _count: { members: 0 },
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01'),
        },
      ];

      (getGroups as jest.Mock).mockResolvedValue(mockGroups);

      const result = await getRelationRecords(columns);

      expect(result.get('col-1')).toEqual([
        { id: 'group-1', displayValue: '営業部', exists: true },
      ]);
    });
  });

  describe('システムテーブルと通常テーブルの混在', () => {
    it('usersとgroupsと通常テーブルを同時に参照できる', async () => {
      const columns: Column[] = [
        {
          id: 'col-1',
          name: '担当者',
          type: 'RELATION',
          order: 0,
          config: {
            referencedTableId: 'users',
            displayField: 'name',
            allowMultiple: false,
          },
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'col-2',
          name: 'グループ',
          type: 'RELATION',
          order: 1,
          config: {
            referencedTableId: 'groups',
            displayField: 'name',
            allowMultiple: false,
          },
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'col-3',
          name: '顧客',
          type: 'RELATION',
          order: 2,
          config: {
            referencedTableId: 'table-1',
            displayField: 'companyName',
            allowMultiple: false,
          },
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const mockUsers = [
        {
          id: 'user-1',
          email: 'user1@example.com',
          name: '山田太郎',
          role: 'ADMIN',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const mockGroups = [
        {
          id: 'group-1',
          name: '営業部',
          description: null,
          parentId: null,
          parent: null,
          members: [],
          _count: { members: 0 },
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const mockRecords = [
        {
          id: 'record-1',
          tableId: 'table-1',
          data: { companyName: 'A社' },
          createdById: 'user-1',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      (getUsers as jest.Mock).mockResolvedValue(mockUsers);
      (getGroups as jest.Mock).mockResolvedValue(mockGroups);
      (prisma.record.findMany as jest.Mock).mockResolvedValue(mockRecords);

      const result = await getRelationRecords(columns);

      expect(result.size).toBe(3);
      expect(result.get('col-1')).toEqual([
        { id: 'user-1', displayValue: '山田太郎', exists: true },
      ]);
      expect(result.get('col-2')).toEqual([
        { id: 'group-1', displayValue: '営業部', exists: true },
      ]);
      expect(result.get('col-3')).toEqual([
        { id: 'record-1', displayValue: 'A社', exists: true },
      ]);
      expect(getUsers).toHaveBeenCalledTimes(1);
      expect(getGroups).toHaveBeenCalledTimes(1);
      expect(prisma.record.findMany).toHaveBeenCalledTimes(1);
    });
  });
});
