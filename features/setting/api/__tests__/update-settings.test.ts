import { updateSettings } from '../update-settings';

// Prismaクライアントをモック化
jest.mock('@/lib/prisma', () => ({
  prisma: {
    setting: {
      upsert: jest.fn(),
    },
  },
}));

import { prisma } from '@/lib/prisma';

describe('updateSettings', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('設定を新規作成できる', async () => {
    const input = {
      appName: 'My App',
      appIcon: '/uploads/system/logo.png',
      appFavicon: '/uploads/system/favicon.ico',
      hideAppName: false,
    };

    const mockSetting = {
      id: 'singleton',
      ...input,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    };

    (prisma.setting.upsert as jest.Mock).mockResolvedValue(mockSetting);

    const result = await updateSettings(input);

    expect(result).toEqual({
      appName: 'My App',
      appIcon: '/uploads/system/logo.png',
      appFavicon: '/uploads/system/favicon.ico',
      hideAppName: false,
    });
    expect(prisma.setting.upsert).toHaveBeenCalledWith({
      where: { id: 'singleton' },
      create: {
        id: 'singleton',
        ...input,
      },
      update: input,
    });
  });

  it('既存の設定を更新できる', async () => {
    const input = {
      appName: 'Updated App',
      appIcon: '/new-logo.png',
      appFavicon: '/new-favicon.ico',
      hideAppName: true,
    };

    const mockSetting = {
      id: 'singleton',
      ...input,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-02'),
    };

    (prisma.setting.upsert as jest.Mock).mockResolvedValue(mockSetting);

    const result = await updateSettings(input);

    expect(result).toEqual({
      appName: 'Updated App',
      appIcon: '/new-logo.png',
      appFavicon: '/new-favicon.ico',
      hideAppName: true,
    });
  });

  it('一部の値のみを更新できる', async () => {
    const input = {
      appName: 'Only Title Updated',
    };

    const mockSetting = {
      id: 'singleton',
      appName: 'Only Title Updated',
      appIcon: null,
      appFavicon: null,
      hideAppName: false,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-02'),
    };

    (prisma.setting.upsert as jest.Mock).mockResolvedValue(mockSetting);

    const result = await updateSettings(input);

    expect(result).toEqual({
      appName: 'Only Title Updated',
      appIcon: '/system/icon.png',
      appFavicon: '/system/favicon.ico',
      hideAppName: false,
    });
    expect(prisma.setting.upsert).toHaveBeenCalledWith({
      where: { id: 'singleton' },
      create: {
        id: 'singleton',
        appName: 'Only Title Updated',
      },
      update: {
        appName: 'Only Title Updated',
      },
    });
  });

  it('空のオブジェクトで更新できる', async () => {
    const input = {};

    const mockSetting = {
      id: 'singleton',
      appName: null,
      appIcon: null,
      appFavicon: null,
      hideAppName: false,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    };

    (prisma.setting.upsert as jest.Mock).mockResolvedValue(mockSetting);

    const result = await updateSettings(input);

    expect(result).toEqual({
      appName: 'Lowcode Platform',
      appIcon: '/system/icon.png',
      appFavicon: '/system/favicon.ico',
      hideAppName: false,
    });
  });

  it('データベースエラーが発生した場合は例外をスローする', async () => {
    const input = {
      appName: 'My App',
    };

    (prisma.setting.upsert as jest.Mock).mockRejectedValue(
      new Error('Database error')
    );

    await expect(updateSettings(input)).rejects.toThrow('Database error');
  });

  it('undefinedを渡した場合にデフォルト値が使用される', async () => {
    const input = {
      appName: undefined,
      appIcon: undefined,
      appFavicon: undefined,
      hideAppName: undefined,
    };

    const mockSetting = {
      id: 'singleton',
      appName: null,
      appIcon: null,
      appFavicon: null,
      hideAppName: false,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-02'),
    };

    (prisma.setting.upsert as jest.Mock).mockResolvedValue(mockSetting);

    const result = await updateSettings(input);

    expect(result).toEqual({
      appName: 'Lowcode Platform',
      appIcon: '/system/icon.png',
      appFavicon: '/system/favicon.ico',
      hideAppName: false,
    });
  });
});
