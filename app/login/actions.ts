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
  const supabase = await createClient();

  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  };

  const { error } = await supabase.auth.signInWithPassword(data);

  if (error) {
    return { error: 'メールアドレスまたはパスワードが正しくありません' };
  }

  revalidatePath('/', 'layout');
  redirect('/dashboard');
}
