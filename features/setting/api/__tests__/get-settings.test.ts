import { getSettings } from '../get-settings';

// Prismaクライアントをモック化
jest.mock('@/lib/prisma', () => ({
  prisma: {
    setting: {
      findUnique: jest.fn(),
    },
  },
}));

import { prisma } from '@/lib/prisma';

describe('getSettings', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('設定を取得できる', async () => {
    const mockSetting = {
      id: 'singleton',
      appTitle: 'My App',
      logoUrl: '/uploads/system/logo.png',
      faviconUrl: '/uploads/system/favicon.ico',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    };

    (prisma.setting.findUnique as jest.Mock).mockResolvedValue(mockSetting);

    const result = await getSettings();

    expect(result).toEqual({
      appTitle: 'My App',
      logoUrl: '/uploads/system/logo.png',
      faviconUrl: '/uploads/system/favicon.ico',
    });
    expect(prisma.setting.findUnique).toHaveBeenCalledWith({
      where: { id: 'singleton' },
    });
  });

  it('設定が存在しない場合はデフォルト値を返す', async () => {
    (prisma.setting.findUnique as jest.Mock).mockResolvedValue(null);

    const result = await getSettings();

    expect(result).toEqual({
      appTitle: 'Lowcode Platform',
      logoUrl: '/system/app-icon.png',
      faviconUrl: '/system/favicon.ico',
    });
    expect(prisma.setting.findUnique).toHaveBeenCalledTimes(1);
  });

  it('一部の値がnullの場合はデフォルト値で補完する', async () => {
    const mockSetting = {
      id: 'singleton',
      appTitle: 'My App',
      logoUrl: null,
      faviconUrl: null,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    };

    (prisma.setting.findUnique as jest.Mock).mockResolvedValue(mockSetting);

    const result = await getSettings();

    expect(result).toEqual({
      appTitle: 'My App',
      logoUrl: '/system/app-icon.png',
      faviconUrl: '/system/favicon.ico',
    });
  });
});
