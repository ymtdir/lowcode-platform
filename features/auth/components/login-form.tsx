'use client';

import Link from 'next/link';
import { useActionState } from 'react';
import { login } from '@/features/auth/api';
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function LoginForm() {
  const [state, formAction] = useActionState(login, {});

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>アカウントにログイン</CardTitle>
        <CardDescription>
          メールアドレスを入力してログインしてください
        </CardDescription>
        <CardAction>
          <Link href="/signup">
            <Button variant="link">新規登録</Button>
          </Link>
        </CardAction>
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
                <a
                  href="#"
                  className="ml-auto inline-block text-sm underline-offset-4 hover:underline"
                >
                  パスワードをお忘れですか？
                </a>
              </div>
              <Input id="password" name="password" type="password" required />
            </div>
            <Button type="submit" className="w-full">
              ログイン
            </Button>
          </div>
        </form>
      </CardContent>
      <CardFooter className="flex-col gap-2"></CardFooter>
    </Card>
  );
}
