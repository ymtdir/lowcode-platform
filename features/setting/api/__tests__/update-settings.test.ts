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
      appTitle: 'My App',
      appIcon: '/uploads/system/logo.png',
      appFavicon: '/uploads/system/favicon.ico',
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
      appTitle: 'My App',
      appIcon: '/uploads/system/logo.png',
      appFavicon: '/uploads/system/favicon.ico',
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
      appTitle: 'Updated App',
      appIcon: '/new-logo.png',
      appFavicon: '/new-favicon.ico',
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
      appTitle: 'Updated App',
      appIcon: '/new-logo.png',
      appFavicon: '/new-favicon.ico',
    });
  });

  it('一部の値のみを更新できる', async () => {
    const input = {
      appTitle: 'Only Title Updated',
    };

    const mockSetting = {
      id: 'singleton',
      appTitle: 'Only Title Updated',
      appIcon: null,
      appFavicon: null,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-02'),
    };

    (prisma.setting.upsert as jest.Mock).mockResolvedValue(mockSetting);

    const result = await updateSettings(input);

    expect(result).toEqual({
      appTitle: 'Only Title Updated',
      appIcon: '/system/app-icon.png',
      appFavicon: '/system/favicon.ico',
    });
    expect(prisma.setting.upsert).toHaveBeenCalledWith({
      where: { id: 'singleton' },
      create: {
        id: 'singleton',
        appTitle: 'Only Title Updated',
      },
      update: {
        appTitle: 'Only Title Updated',
      },
    });
  });

  it('空のオブジェクトで更新できる', async () => {
    const input = {};

    const mockSetting = {
      id: 'singleton',
      appTitle: null,
      appIcon: null,
      appFavicon: null,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    };

    (prisma.setting.upsert as jest.Mock).mockResolvedValue(mockSetting);

    const result = await updateSettings(input);

    expect(result).toEqual({
      appTitle: 'Lowcode Platform',
      appIcon: '/system/app-icon.png',
      appFavicon: '/system/favicon.ico',
    });
  });

  it('データベースエラーが発生した場合は例外をスローする', async () => {
    const input = {
      appTitle: 'My App',
    };

    (prisma.setting.upsert as jest.Mock).mockRejectedValue(
      new Error('Database error')
    );

    await expect(updateSettings(input)).rejects.toThrow('Database error');
  });

  it('nullを明示的に設定できる', async () => {
    const input = {
      appTitle: undefined,
      appIcon: undefined,
      appFavicon: undefined,
    };

    const mockSetting = {
      id: 'singleton',
      appTitle: null,
      appIcon: null,
      appFavicon: null,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-02'),
    };

    (prisma.setting.upsert as jest.Mock).mockResolvedValue(mockSetting);

    const result = await updateSettings(input);

    expect(result).toEqual({
      appTitle: 'Lowcode Platform',
      appIcon: '/system/app-icon.png',
      appFavicon: '/system/favicon.ico',
    });
  });
});
