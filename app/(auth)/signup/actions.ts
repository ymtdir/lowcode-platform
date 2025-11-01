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
  const name = formData.get('name') as string;
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const confirmPassword = formData.get('confirmPassword') as string;

  // バリデーション
  if (!name || name.trim() === '') {
    return { error: '名前を入力してください' };
  }

  if (password !== confirmPassword) {
    return { error: 'パスワードが一致しません' };
  }

  try {
    const supabase = await createClient();

    const data = {
      email,
      password,
    };

    const { data: authData, error } = await supabase.auth.signUp(data);

    if (error) {
      console.error('サインアップエラー:', error.message);
      return { error: 'アカウントの作成に失敗しました' };
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

    revalidatePath('/', 'layout');
    redirect('/');
  } catch (error) {
    console.error('サインアップエラー:', error);
    return { error: 'アカウントの作成に失敗しました' };
  }
}

export async function signupWithGoogle() {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
      },
    });

    if (error) {
      console.error('Google認証エラー:', error.message);
      redirect('/error');
    }

    if (data.url) {
      redirect(data.url);
    }
  } catch (error) {
    console.error('Google認証エラー:', error);
    redirect('/error');
  }
}
