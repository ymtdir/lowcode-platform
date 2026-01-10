import { config } from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { createClient } from '@supabase/supabase-js';

// .env.localから環境変数を読み込む
config({ path: '.env.local' });

const prisma = new PrismaClient();

/**
 * Supabaseクライアントの作成
 */
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

/**
 * 管理者ユーザーを作成
 */
async function createAdminUser() {
  const email = process.env.SEED_ADMIN_EMAIL || 'admin@example.com';
  const password = process.env.SEED_ADMIN_PASSWORD || 'admin123';
  const name = process.env.SEED_ADMIN_NAME || 'Administrator';

  console.log(`管理者ユーザーを作成中: ${email}`);

  // 既存のSupabase Authユーザーを削除
  const { data: existingUsers } = await supabase.auth.admin.listUsers();
  const existingAuthUser = existingUsers?.users.find((u) => u.email === email);

  if (existingAuthUser) {
    console.log('既存の管理者ユーザーをSupabase Authから削除中');
    await supabase.auth.admin.deleteUser(existingAuthUser.id);
    console.log('既存の管理者ユーザー（Supabase Auth）を削除しました');
  }

  // Prisma DBの既存ユーザーを削除
  const existingPrismaUser = await prisma.user.findUnique({
    where: { email },
  });
  if (existingPrismaUser) {
    console.log('既存の管理者ユーザーをPrisma DBから削除中');
    await prisma.user.delete({
      where: { id: existingPrismaUser.id },
    });
    console.log('既存の管理者ユーザー（Prisma DB）を削除しました');
  }

  // Supabase Authにユーザーを作成
  const { data: authData, error: authError } =
    await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // メール確認をスキップ
    });

  if (authError) {
    throw authError;
  }

  console.log(
    `Supabase Authに管理者ユーザーを作成しました: ${authData.user.id}`
  );

  // Prismaにユーザー情報を保存
  const user = await prisma.user.create({
    data: {
      id: authData.user.id,
      name,
      email,
      role: 'ADMIN',
    },
  });

  console.log(`データベースに管理者ユーザーを作成しました: ${user.id}`);
  return user.id;
}

/**
 * 初期設定を作成
 */
async function createSettings() {
  console.log('初期設定を作成中');

  const settingId = 'default';

  const settings = await prisma.setting.upsert({
    where: { id: settingId },
    update: {},
    create: {
      id: settingId,
      appName: 'Lowcode Platform',
      appIcon: '/icon.svg',
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
