'use server';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

/**
 * ゲストログイン用のServer Action
 * 環境変数で指定されたゲストアカウントでログインする
 */
export async function guestLogin(): Promise<void> {
  const email = process.env.GUEST_USER_EMAIL;
  const password = process.env.GUEST_USER_PASSWORD;

  if (!email || !password) {
    console.error('ゲストログインエラー: 環境変数が設定されていません');
    return;
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    console.error('ゲストログインエラー:', error.message);
    return;
  }

  redirect('/');
}

/**
 * ゲストログインが有効かどうかを確認する
 */
export async function isGuestLoginEnabled(): Promise<boolean> {
  return !!(process.env.GUEST_USER_EMAIL && process.env.GUEST_USER_PASSWORD);
}
