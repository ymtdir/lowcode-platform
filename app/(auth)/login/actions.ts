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
  } catch (error) {
    console.error('ログインエラー:', error);
    return { error: 'ログインに失敗しました' };
  }

  revalidatePath('/', 'layout');
  redirect('/');
}

export async function loginWithGoogle() {
  let redirectUrl: string | null = null;

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
      redirectUrl = '/error';
    } else if (data.url) {
      redirectUrl = data.url;
    }
  } catch (error) {
    console.error('Google認証エラー:', error);
    redirectUrl = '/error';
  }

  if (redirectUrl) {
    redirect(redirectUrl);
  }
}
