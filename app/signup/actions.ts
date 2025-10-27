'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';

type FormState = {
  error?: string;
};

export async function signup(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const supabase = await createClient();

  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  };

  const { data: authData, error } = await supabase.auth.signUp(data);

  if (error) {
    console.error('サインアップエラー:', error.message);
    return { error: 'アカウントの作成に失敗しました' };
  }

  // Supabase Authでユーザー作成成功後、Prismaにもレコードを作成
  if (authData.user) {
    try {
      await prisma.user.create({
        data: {
          id: authData.user.id,
          email: authData.user.email!,
          role: 'MEMBER',
        },
      });
    } catch (error) {
      console.error('ユーザー情報の保存エラー:', error);
      return { error: 'ユーザー情報の保存に失敗しました' };
    }
  }

  revalidatePath('/', 'layout');
  redirect('/dashboard');
}
