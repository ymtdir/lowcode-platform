import { config } from 'dotenv';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

// .env.localから環境変数を読み込む
config({ path: '.env.local' });

const prisma = new PrismaClient();

/**
 * 管理者ユーザーを作成
 */
async function createAdminUser() {
  const email = process.env.SEED_ADMIN_EMAIL || 'admin@example.com';
  const password = process.env.SEED_ADMIN_PASSWORD || 'admin123';
  const name = process.env.SEED_ADMIN_NAME || 'Administrator';

  console.log(`管理者ユーザーを作成中: ${email}`);

  // 既存ユーザーを削除
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    console.log('既存の管理者ユーザーを削除中');
    await prisma.user.delete({
      where: { id: existingUser.id },
    });
    console.log('既存の管理者ユーザーを削除しました');
  }

  // パスワードをハッシュ化
  const hashedPassword = await bcrypt.hash(password, 10);

  // ユーザーを作成
  const user = await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      role: 'ADMIN',
    },
  });

  console.log(`管理者ユーザーを作成しました: ${user.id}`);
  return user.id;
}

/**
 * 初期設定を作成
 */
async function createSettings() {
  console.log('初期設定を作成中');

  const settingId = 'singleton';

  const settings = await prisma.setting.upsert({
    where: { id: settingId },
    update: {},
    create: {
      id: settingId,
      appName: 'muku',
      appIcon: '/system/icon.png',
      appFavicon: '/system/favicon.ico',
      hideAppName: false,
    },
  });

  console.log('初期設定を作成しました');
  return settings;
}

async function main() {
  console.log('シードを開始します...\n');

  try {
    // 管理者ユーザーの作成
    await createAdminUser();
    console.log('');

    // 初期設定の作成
    await createSettings();
    console.log('');

    console.log('シードが正常に完了しました');
  } catch (error) {
    console.error('シードに失敗しました:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
