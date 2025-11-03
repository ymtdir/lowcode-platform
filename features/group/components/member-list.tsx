'use client';

import { useState } from 'react';
import { UserPlus, X } from 'lucide-react';
import { toast } from 'sonner';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { addMembers, removeMembers } from '../api';

type User = {
  id: string;
  email: string;
  name: string | null;
};

type Member = {
  id: string;
  user: User;
};

type MemberListProps = {
  groupId: string;
  members: Member[];
  availableUsers: User[];
};

export function MemberList({
  groupId,
  members,
  availableUsers,
}: MemberListProps) {
  const [open, setOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [isAdding, setIsAdding] = useState(false);

  const handleAddMember = async () => {
    if (!selectedUserId) return;

    setIsAdding(true);
    const result = await addMembers(groupId, [selectedUserId]);

    if (result.error) {
      toast.error('メンバーの追加に失敗しました', {
        description: result.error,
      });
    } else if (result.successCount) {
      toast.success('メンバーを追加しました');
      setOpen(false);
      setSelectedUserId('');
    }

    setIsAdding(false);
  };

  const handleRemoveMember = async (userId: string, userName: string) => {
    const result = await removeMembers(groupId, [userId]);

    if (result.error) {
      toast.error('メンバーの削除に失敗しました', {
        description: result.error,
      });
    } else if (result.successCount) {
      toast.success(`${userName}を削除しました`);
    }
  };

  // すでにメンバーのユーザーを除外
  const memberUserIds = new Set(members.map((m) => m.user.id));
  const usersToAdd = availableUsers.filter((u) => !memberUserIds.has(u.id));

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>メンバー</CardTitle>
            <CardDescription>{members.length}人</CardDescription>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <UserPlus />
                メンバーを追加
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>メンバーを追加</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <Select
                  value={selectedUserId}
                  onValueChange={setSelectedUserId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="ユーザーを選択" />
                  </SelectTrigger>
                  <SelectContent>
                    {usersToAdd.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.name || user.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  onClick={handleAddMember}
                  disabled={!selectedUserId || isAdding}
                >
                  {isAdding ? '追加中...' : '追加'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {members.length === 0 ? (
          <p className="text-muted-foreground text-sm">メンバーがいません</p>
        ) : (
          <div className="space-y-2">
            {members.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between rounded-lg border p-3"
              >
                <div>
                  <p className="font-medium">
                    {member.user.name || member.user.email}
                  </p>
                  {member.user.name && (
                    <p className="text-muted-foreground text-sm">
                      {member.user.email}
                    </p>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    handleRemoveMember(
                      member.user.id,
                      member.user.name || member.user.email
                    )
                  }
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
