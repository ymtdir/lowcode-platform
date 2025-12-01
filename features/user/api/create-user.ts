'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { prisma } from '@/lib/prisma';
import { canManageUsers } from '@/lib/permissions';

type FormState = {
  error?: string;
  success?: boolean;
};

/**
 * ユーザーを作成するServer Action
 * ADMINロールのみ実行可能
 */
export async function createUser(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  // 認証チェック
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: '認証が必要です' };
  }

  // 権限チェック
  const currentUser = await prisma.user.findUnique({
    where: { email: user.email! },
    select: { role: true },
  });

  if (!currentUser || !canManageUsers(currentUser.role)) {
    return { error: 'この操作を行う権限がありません' };
  }

  const name = formData.get('name') as string;
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const confirmPassword = formData.get('confirmPassword') as string;

  if (!name || name.trim() === '') {
    return { error: '名前を入力してください' };
  }

  if (password !== confirmPassword) {
    return { error: 'パスワードが一致しません' };
  }

  try {
    const supabase = createAdminClient();

    // Supabase Admin APIでユーザー作成
    const { data: authData, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (error) {
      console.error('ユーザー作成エラー:', error.message);
      return { error: 'ユーザーの作成に失敗しました' };
    }

    // Prismaにユーザー情報を保存
    if (authData.user) {
      await prisma.user.create({
        data: {
          id: authData.user.id,
          name,
          email: authData.user.email!,
          role: 'MEMBER',
        },
      });
    }

    revalidatePath('/users');
    return { success: true };
  } catch (error) {
    console.error('ユーザー作成エラー:', error);
    return { error: 'ユーザーの作成に失敗しました' };
  }
}
