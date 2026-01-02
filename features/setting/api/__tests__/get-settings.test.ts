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
      appName: 'My App',
      appIcon: '/uploads/system/logo.png',
      appFavicon: '/uploads/system/favicon.ico',
      hideAppName: false,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    };

    (prisma.setting.findUnique as jest.Mock).mockResolvedValue(mockSetting);

    const result = await getSettings();

    expect(result).toEqual({
      appName: 'My App',
      appIcon: '/uploads/system/logo.png',
      appFavicon: '/uploads/system/favicon.ico',
      hideAppName: false,
    });
    expect(prisma.setting.findUnique).toHaveBeenCalledWith({
      where: { id: 'singleton' },
    });
  });

  it('設定が存在しない場合はデフォルト値を返す', async () => {
    (prisma.setting.findUnique as jest.Mock).mockResolvedValue(null);

    const result = await getSettings();

    expect(result).toEqual({
      appName: 'Lowcode Platform',
      appIcon: '/system/app-icon.png',
      appFavicon: '/system/favicon.ico',
      hideAppName: false,
    });
    expect(prisma.setting.findUnique).toHaveBeenCalledTimes(1);
  });

  it('一部の値がnullの場合はデフォルト値で補完する', async () => {
    const mockSetting = {
      id: 'singleton',
      appName: 'My App',
      appIcon: null,
      appFavicon: null,
      hideAppName: false,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    };

    (prisma.setting.findUnique as jest.Mock).mockResolvedValue(mockSetting);

    const result = await getSettings();

    expect(result).toEqual({
      appName: 'My App',
      appIcon: '/system/app-icon.png',
      appFavicon: '/system/favicon.ico',
      hideAppName: false,
    });
  });
});
