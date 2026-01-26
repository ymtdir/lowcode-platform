'use server';

import { redirect } from 'next/navigation';
import { signOut } from '@/lib/auth-config';

/**
 * ログアウト処理を行うServer Action
 */
export async function logout() {
  try {
    await signOut({ redirect: false });
  } catch (error) {
    console.error('ログアウトエラー:', error);
  }

  redirect('/login');
}
