'use client';

import { useState, useActionState } from 'react';
import { Pencil, CheckCircle, AlertCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { updateUserProfile, updateUserPassword } from '../api/update-user';
import type { User } from '../types';

type EditUserItemProps = {
  user: User;
};

type EditUserContentProps = {
  user: User;
};

function EditUserContent({ user }: EditUserContentProps) {
  const [profileState, profileAction] = useActionState(
    updateUserProfile.bind(null, user.id),
    {}
  );
  const [passwordState, passwordAction] = useActionState(
    updateUserPassword.bind(null, user.id),
    {}
  );

  return (
    <Tabs defaultValue="profile">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="profile">プロフィール</TabsTrigger>
        <TabsTrigger value="password">パスワード</TabsTrigger>
      </TabsList>
      <TabsContent value="profile">
        <form action={profileAction}>
          <Card>
            <CardHeader>
              <CardTitle>プロフィール</CardTitle>
              <CardDescription>
                ユーザーのプロフィールを編集します。
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6">
              {profileState.error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>エラー</AlertTitle>
                  <AlertDescription>{profileState.error}</AlertDescription>
                </Alert>
              )}
              {profileState.success && (
                <Alert variant="default">
                  <CheckCircle className="h-4 w-4" />
                  <AlertTitle>成功</AlertTitle>
                  <AlertDescription>
                    プロフィールを更新しました
                  </AlertDescription>
                </Alert>
              )}
              <div className="grid gap-3">
                <Label htmlFor="name">名前</Label>
                <Input
                  id="name"
                  name="name"
                  defaultValue={user.name || ''}
                  placeholder="山田 太郎"
                  required
                />
              </div>
              <div className="grid gap-3">
                <Label htmlFor="email">メールアドレス</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  defaultValue={user.email}
                  placeholder="user@example.com"
                  required
                />
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button type="submit">保存</Button>
            </CardFooter>
          </Card>
        </form>
      </TabsContent>
      <TabsContent value="password">
        <form action={passwordAction}>
          <Card>
            <CardHeader>
              <CardTitle>パスワード</CardTitle>
              <CardDescription>
                ユーザーのパスワードを編集します。
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6">
              {passwordState.error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>エラー</AlertTitle>
                  <AlertDescription>{passwordState.error}</AlertDescription>
                </Alert>
              )}
              {passwordState.success && (
                <Alert variant="default">
                  <CheckCircle className="h-4 w-4" />
                  <AlertTitle>成功</AlertTitle>
                  <AlertDescription>パスワードを更新しました</AlertDescription>
                </Alert>
              )}
              <div className="grid gap-3">
                <Label htmlFor="new-password">新しいパスワード</Label>
                <Input
                  id="new-password"
                  name="newPassword"
                  type="password"
                  placeholder="新しいパスワード"
                  required
                />
              </div>
              <div className="grid gap-3">
                <Label htmlFor="confirm-password">パスワード（確認）</Label>
                <Input
                  id="confirm-password"
                  name="confirmPassword"
                  type="password"
                  placeholder="パスワードを再入力"
                  required
                />
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button type="submit">保存</Button>
            </CardFooter>
          </Card>
        </form>
      </TabsContent>
    </Tabs>
  );
}

export function EditUserItem({ user }: EditUserItemProps) {
  const [open, setOpen] = useState(false);
  const [resetKey, setResetKey] = useState(0);

  // ダイアログが閉じられたときに状態をリセット
  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      // ダイアログが閉じられた時にkeyを変更してコンポーネントを再マウント
      setResetKey((prev) => prev + 1);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
          <Pencil />
          編集
        </DropdownMenuItem>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>ユーザー情報を編集</DialogTitle>
        </DialogHeader>
        <EditUserContent key={resetKey} user={user} />
      </DialogContent>
    </Dialog>
  );
}
