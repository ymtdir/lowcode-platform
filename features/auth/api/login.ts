'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { signIn } from '@/lib/auth-config';
import { AuthError } from 'next-auth';

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
    await signIn('credentials', {
      email: formData.get('email') as string,
      password: formData.get('password') as string,
      redirect: false,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      console.error('ログインエラー:', error.type);
      return { error: 'メールアドレスまたはパスワードが正しくありません' };
    }
    console.error('ログインエラー:', error);
    return { error: 'ログインに失敗しました' };
  }

  revalidatePath('/', 'layout');
  redirect('/');
}
