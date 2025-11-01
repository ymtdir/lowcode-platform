'use server';

import { revalidatePath } from 'next/cache';
import { createAdminClient } from '@/lib/supabase/admin';
import { prisma } from '@/lib/prisma';

type FormState = {
  error?: string;
  success?: boolean;
};

export async function createUser(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const supabase = createAdminClient();

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

  const data = {
    email,
    password,
  };

  const { data: authData, error } = await supabase.auth.admin.createUser({
    email: data.email,
    password: data.password,
    email_confirm: true,
  });

  if (error) {
    console.error('ユーザー作成エラー:', error.message);
    return { error: 'ユーザーの作成に失敗しました' };
  }

  // Supabase Authでユーザー作成成功後、Prismaにもレコードを作成
  if (authData.user) {
    try {
      await prisma.user.create({
        data: {
          id: authData.user.id,
          name: name,
          email: authData.user.email!,
          role: 'MEMBER',
        },
      });
    } catch (error) {
      console.error('ユーザー情報の保存エラー:', error);
      return { error: 'ユーザー情報の保存に失敗しました' };
    }
  }

  revalidatePath('/users');

  return { success: true };
}
