import { PrismaClient } from '@prisma/client';
import { createClient } from '@supabase/supabase-js';

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

  // Supabase Authにユーザーを作成
  const { data: authData, error: authError } =
    await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // メール確認をスキップ
    });

  if (authError) {
    // ユーザーが既に存在する場合はスキップ
    if (authError.message.includes('already registered')) {
      console.log('管理者ユーザーは既にSupabase Authに存在します');
      // 既存ユーザーのIDを取得
      const { data: existingUsers } = await supabase.auth.admin.listUsers();
      const existingUser = existingUsers?.users.find((u) => u.email === email);
      if (existingUser) {
        return existingUser.id;
      }
    }
    throw authError;
  }

  console.log(
    `Supabase Authに管理者ユーザーを作成しました: ${authData.user.id}`
  );

  // Prismaにユーザー情報を保存
  const user = await prisma.user.upsert({
    where: { id: authData.user.id },
    update: {
      name,
      email,
      role: 'ADMIN',
    },
    create: {
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
