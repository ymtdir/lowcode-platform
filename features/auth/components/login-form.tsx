'use client';

import Image from 'next/image';
import { useActionState } from 'react';
import { login, guestLogin } from '@/features/auth/api';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

/**
 * ログインフォームコンポーネントのProps型
 */
type LoginFormProps = {
  appIcon: string;
  appName: string;
  isGuestLoginEnabled: boolean;
};

/**
 * ログインフォームコンポーネント
 */
export function LoginForm({
  appIcon,
  appName,
  isGuestLoginEnabled,
}: LoginFormProps) {
  const [state, formAction] = useActionState(login, {});

  return (
    <div className="flex w-full max-w-sm flex-col items-center gap-6">
      <div className="flex items-center gap-2">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg overflow-hidden shrink-0">
          <Image
            src={appIcon}
            alt="App Icon"
            width={40}
            height={40}
            className="object-cover"
          />
        </div>
        <span className="text-2xl font-semibold">{appName}</span>
      </div>
      <Card className="w-full">
        <CardHeader>
          <CardTitle>アカウントにログイン</CardTitle>
          <CardDescription>
            メールアドレスを入力してログインしてください
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={formAction}>
            <div className="flex flex-col gap-6">
              {state.error && (
                <div className="rounded-md bg-red-50 p-3 text-sm text-red-800">
                  {state.error}
                </div>
              )}
              <div className="grid gap-2">
                <Label htmlFor="email">メールアドレス</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="example@mail.com"
                  required
                />
              </div>
              <div className="grid gap-2">
                <div className="flex items-center">
                  <Label htmlFor="password">パスワード</Label>
                </div>
                <Input id="password" name="password" type="password" required />
              </div>
              <Button type="submit" className="w-full cursor-pointer">
                ログイン
              </Button>
            </div>
          </form>
        </CardContent>
        <CardFooter className="flex-col gap-2"></CardFooter>
      </Card>
      {isGuestLoginEnabled && (
        <form action={guestLogin}>
          <Button
            type="submit"
            variant="link"
            className="text-sm cursor-pointer"
          >
            ゲストとしてログイン
          </Button>
        </form>
      )}
    </div>
  );
}
