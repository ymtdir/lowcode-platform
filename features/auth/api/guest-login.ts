'use server';

import { redirect } from 'next/navigation';
import { signIn } from '@/lib/auth-config';
import { AuthError } from 'next-auth';

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

  try {
    await signIn('credentials', {
      email,
      password,
      redirect: false,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      console.error('ゲストログインエラー:', error.message);
      return;
    }
    console.error('ゲストログインエラー:', error);
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
