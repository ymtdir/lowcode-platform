'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { createClient } from '@/lib/supabase/server';

type FormState = {
  error?: string;
};

export async function login(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  try {
    const supabase = await createClient();

    const data = {
      email: formData.get('email') as string,
      password: formData.get('password') as string,
    };

    const { error } = await supabase.auth.signInWithPassword(data);

    if (error) {
      console.error('ログインエラー:', error.message);
      return { error: 'メールアドレスまたはパスワードが正しくありません' };
    }

    revalidatePath('/', 'layout');
    redirect('/');
  } catch (error) {
    console.error('ログインエラー:', error);
    return { error: 'ログインに失敗しました' };
  }
}

export async function loginWithGoogle() {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/callback`,
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
