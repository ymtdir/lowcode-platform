'use client';

import { useState, useActionState, useEffect } from 'react';
import { Pencil } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { DropdownMenuItem } from '@/components/ui/dropdown-menu';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { updateUserProfile, updateUserPassword } from '../api/update-user';
import type { User } from '../types';

/**
 * ユーザー編集オプションのProps型
 */
type EditUserOptionProps = {
  user: User;
  onOpenChange: (open: boolean) => void;
};

/**
 * ユーザー編集コンテンツのProps型
 */
type EditUserContentProps = {
  user: User;
  onClose: () => void;
};

/**
 * ユーザー編集コンテンツコンポーネント
 */
function EditUserContent({ user, onClose }: EditUserContentProps) {
  const [profileState, profileAction] = useActionState(
    updateUserProfile.bind(null, user.id),
    {}
  );
  const [passwordState, passwordAction] = useActionState(
    updateUserPassword.bind(null, user.id),
    {}
  );

  // プロフィール更新の結果を監視
  useEffect(() => {
    if (profileState.error) {
      toast.error('プロフィールの更新に失敗しました', {
        description: profileState.error,
      });
    } else if (profileState.success) {
      toast.success('プロフィールを更新しました', {
        description: `${user.name}のプロフィールを更新しました`,
      });
      onClose();
    }
  }, [profileState, user.name, onClose]);

  // パスワード更新の結果を監視
  useEffect(() => {
    if (passwordState.error) {
      toast.error('パスワードの更新に失敗しました', {
        description: passwordState.error,
      });
    } else if (passwordState.success) {
      toast.success('パスワードを更新しました', {
        description: `${user.name}のパスワードを更新しました`,
      });
      onClose();
    }
  }, [passwordState, user.name, onClose]);

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
              <div className="grid gap-3">
                <Label htmlFor="role">ロール</Label>
                <Select name="role" defaultValue={user.role}>
                  <SelectTrigger id="role">
                    <SelectValue placeholder="ロールを選択" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ADMIN">管理者</SelectItem>
                    <SelectItem value="DEVELOPER">開発者</SelectItem>
                    <SelectItem value="MEMBER">メンバー</SelectItem>
                  </SelectContent>
                </Select>
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

/**
 * ユーザー編集オプションコンポーネント
 */
export function EditUserOption({
  user,
  onOpenChange: onDropdownOpenChange,
}: EditUserOptionProps) {
  const [open, setOpen] = useState(false);
  const [resetKey, setResetKey] = useState(0);

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      setResetKey((prev) => prev + 1);
      onDropdownOpenChange(false);
    }
  };

  const handleClose = () => {
    handleOpenChange(false);
  };

  return (
    <>
      <DropdownMenuItem
        onSelect={(e) => {
          e.preventDefault();
          setOpen(true);
        }}
      >
        <Pencil />
        編集
      </DropdownMenuItem>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>ユーザー情報を編集</DialogTitle>
          </DialogHeader>
          <EditUserContent key={resetKey} user={user} onClose={handleClose} />
        </DialogContent>
      </Dialog>
    </>
  );
}
