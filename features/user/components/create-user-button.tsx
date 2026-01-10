'use client';

import { useState, useActionState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import { createUser } from '../api/create-user';

/**
 * ユーザー作成コンテンツのProps型
 */
type CreateUserContentProps = {
  onClose: () => void;
};

/**
 * ユーザー作成コンテンツコンポーネント
 */
function CreateUserContent({ onClose }: CreateUserContentProps) {
  const [state, formAction] = useActionState(createUser, {});

  // 成功・エラー時の処理
  useEffect(() => {
    if (state.error) {
      toast.error('ユーザーの作成に失敗しました', {
        description: state.error,
      });
    } else if (state.success) {
      toast.success('ユーザーを作成しました');
      onClose();
    }
  }, [state, onClose]);

  return (
    <form action={formAction}>
      <div className="grid gap-4 py-4">
        <div className="grid gap-2">
          <Label htmlFor="name">名前</Label>
          <Input id="name" name="name" placeholder="山田 太郎" required />
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
        <div className="grid gap-2">
          <Label htmlFor="role">ロール</Label>
          <Select name="role" defaultValue="MEMBER">
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
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose}>
          キャンセル
        </Button>
        <Button type="submit">作成</Button>
      </DialogFooter>
    </form>
  );
}

/**
 * ユーザー作成ボタンコンポーネント
 */
export function CreateUserButton() {
  const [open, setOpen] = useState(false);
  const [resetKey, setResetKey] = useState(0);

  // ダイアログが閉じられたときに状態をリセット
  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      setResetKey((prev) => prev + 1);
    }
  };

  const handleClose = () => {
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <Plus />
          新規作成
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>ユーザーを追加</DialogTitle>
        </DialogHeader>
        <CreateUserContent key={resetKey} onClose={handleClose} />
      </DialogContent>
    </Dialog>
  );
}
