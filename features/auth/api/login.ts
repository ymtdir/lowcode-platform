'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { createClient } from '@/lib/supabase/server';

type FormState = {
  error?: string;
};

/**
 * ログイン処理を行うServer Action
 */
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
