'use server';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

/**
 * ログアウト処理を行うServer Action
 */
export async function logout() {
  try {
    const supabase = await createClient();
    await supabase.auth.signOut();
  } catch (error) {
    console.error('ログアウトエラー:', error);
    // ログアウトは失敗してもログイン画面にリダイレクト
  }

  redirect('/login');
}
