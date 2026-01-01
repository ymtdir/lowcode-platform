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
      logoUrl: '/uploads/system/logo.png',
      faviconUrl: '/uploads/system/favicon.ico',
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
      logoUrl: '/uploads/system/logo.png',
      faviconUrl: '/uploads/system/favicon.ico',
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
      logoUrl: '/new-logo.png',
      faviconUrl: '/new-favicon.ico',
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
      logoUrl: '/new-logo.png',
      faviconUrl: '/new-favicon.ico',
    });
  });

  it('一部の値のみを更新できる', async () => {
    const input = {
      appTitle: 'Only Title Updated',
    };

    const mockSetting = {
      id: 'singleton',
      appTitle: 'Only Title Updated',
      logoUrl: null,
      faviconUrl: null,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-02'),
    };

    (prisma.setting.upsert as jest.Mock).mockResolvedValue(mockSetting);

    const result = await updateSettings(input);

    expect(result).toEqual({
      appTitle: 'Only Title Updated',
      logoUrl: '/system/app-icon.png',
      faviconUrl: '/system/favicon.ico',
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
      logoUrl: null,
      faviconUrl: null,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    };

    (prisma.setting.upsert as jest.Mock).mockResolvedValue(mockSetting);

    const result = await updateSettings(input);

    expect(result).toEqual({
      appTitle: 'Lowcode Platform',
      logoUrl: '/system/app-icon.png',
      faviconUrl: '/system/favicon.ico',
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
      logoUrl: undefined,
      faviconUrl: undefined,
    };

    const mockSetting = {
      id: 'singleton',
      appTitle: null,
      logoUrl: null,
      faviconUrl: null,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-02'),
    };

    (prisma.setting.upsert as jest.Mock).mockResolvedValue(mockSetting);

    const result = await updateSettings(input);

    expect(result).toEqual({
      appTitle: 'Lowcode Platform',
      logoUrl: '/system/app-icon.png',
      faviconUrl: '/system/favicon.ico',
    });
  });
});
