'use client';

import Link from 'next/link';
import { useActionState } from 'react';
import { signup, signupWithGoogle } from '@/features/auth/api';
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

export function SignupForm() {
  const [state, formAction] = useActionState(signup, {});

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>アカウントを作成</CardTitle>
        <CardDescription>
          メールアドレスを入力して新規登録してください
        </CardDescription>
        <CardAction>
          <Link href="/login">
            <Button variant="link">ログイン</Button>
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
              <Label htmlFor="name">名前</Label>
              <Input id="name" name="name" placeholder="username" required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">メールアドレス</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="user@example.com"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">パスワード</Label>
              <Input id="password" name="password" type="password" required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="confirmPassword">パスワード（確認）</Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
              />
            </div>
            <Button type="submit" className="w-full">
              新規登録
            </Button>
          </div>
        </form>
        <form action={signupWithGoogle} className="mt-4">
          <Button type="submit" variant="outline" className="w-full">
            Googleで登録
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex-col gap-2"></CardFooter>
    </Card>
  );
}
