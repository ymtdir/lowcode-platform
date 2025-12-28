'use client';

import { useState } from 'react';
import { Users, UserPlus, UserMinus } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { DropdownMenuItem } from '@/components/ui/dropdown-menu';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { addMembers, removeMembers } from '../api';

/**
 * ユーザー型
 */
type User = {
  id: string;
  email: string;
  name: string | null;
};

/**
 * メンバー型
 */
type Member = {
  id: string;
  user: User;
};

/**
 * グループ型（メンバー管理用）
 */
type Group = {
  id: string;
  name: string;
  members?: Member[];
};

/**
 * メンバー管理オプションのProps型
 */
type ManageMembersOptionProps = {
  group: Group;
  allUsers: User[];
  onOpenChange: (open: boolean) => void;
};

/**
 * メンバー管理オプションコンポーネント
 */
export function ManageMembersOption({
  group,
  allUsers,
  onOpenChange: onDropdownOpenChange,
}: ManageMembersOptionProps) {
  const [open, setOpen] = useState(false);
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(
    new Set()
  );
  const [selectedMemberIds, setSelectedMemberIds] = useState<Set<string>>(
    new Set()
  );
  const [isAdding, setIsAdding] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);

  const members = group.members || [];

  const handleToggleUser = (userId: string, checked: boolean) => {
    const newSelected = new Set(selectedUserIds);
    if (checked) {
      newSelected.add(userId);
    } else {
      newSelected.delete(userId);
    }
    setSelectedUserIds(newSelected);
  };

  const handleToggleMember = (userId: string, checked: boolean) => {
    const newSelected = new Set(selectedMemberIds);
    if (checked) {
      newSelected.add(userId);
    } else {
      newSelected.delete(userId);
    }
    setSelectedMemberIds(newSelected);
  };

  const handleAddMembers = async () => {
    if (selectedUserIds.size === 0) return;

    setIsAdding(true);
    const result = await addMembers(group.id, Array.from(selectedUserIds));

    if (result.error) {
      toast.error('メンバーの追加に失敗しました', {
        description: result.error,
      });
    } else if (result.successCount && result.errorCount) {
      toast.warning('一部のメンバーの追加に失敗しました', {
        description: `${result.successCount}人追加、${result.errorCount}人スキップ`,
      });
      setSelectedUserIds(new Set());
    } else if (result.successCount) {
      toast.success(`${result.successCount}人のメンバーを追加しました`);
      setSelectedUserIds(new Set());
    }

    setIsAdding(false);
  };

  const handleRemoveMembers = async () => {
    if (selectedMemberIds.size === 0) return;

    setIsRemoving(true);
    const result = await removeMembers(group.id, Array.from(selectedMemberIds));

    if (result.error) {
      toast.error('メンバーの削除に失敗しました', {
        description: result.error,
      });
    } else if (result.successCount) {
      toast.success(`${result.successCount}人のメンバーを削除しました`);
      setSelectedMemberIds(new Set());
    }

    setIsRemoving(false);
  };

  // すでにメンバーのユーザーを除外
  const memberUserIds = new Set(members.map((m) => m.user.id));
  const usersToAdd = allUsers.filter((u) => !memberUserIds.has(u.id));

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      onDropdownOpenChange(false);
    }
  };

  return (
    <>
      <DropdownMenuItem
        onSelect={(e) => {
          e.preventDefault();
          setOpen(true);
        }}
      >
        <Users />
        メンバー管理
      </DropdownMenuItem>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{group.name} のメンバー管理</DialogTitle>
          </DialogHeader>

          <div className="grid gap-6">
            {/* メンバー追加セクション */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">メンバーを追加</CardTitle>
                  {selectedUserIds.size > 0 && (
                    <span className="text-sm text-muted-foreground">
                      {selectedUserIds.size}人選択中
                    </span>
                  )}
                </div>
              </CardHeader>
              <CardContent className="grid gap-4">
                {usersToAdd.length === 0 ? (
                  <p className="text-muted-foreground text-center text-sm">
                    追加できるユーザーがいません
                  </p>
                ) : (
                  <>
                    <div className="max-h-[200px] space-y-2 overflow-y-auto rounded-md border p-3">
                      {usersToAdd.map((user) => (
                        <div
                          key={user.id}
                          className="flex items-center space-x-2"
                        >
                          <Checkbox
                            id={`user-${user.id}`}
                            checked={selectedUserIds.has(user.id)}
                            onCheckedChange={(checked) =>
                              handleToggleUser(user.id, !!checked)
                            }
                          />
                          <Label
                            htmlFor={`user-${user.id}`}
                            className="flex-1  text-sm font-normal"
                          >
                            <div>
                              <p>{user.name || user.email}</p>
                              {user.name && (
                                <p className="text-muted-foreground text-xs">
                                  {user.email}
                                </p>
                              )}
                            </div>
                          </Label>
                        </div>
                      ))}
                    </div>
                    <Button
                      onClick={handleAddMembers}
                      disabled={selectedUserIds.size === 0 || isAdding}
                      className="w-full "
                    >
                      <UserPlus />
                      {isAdding
                        ? '追加中...'
                        : selectedUserIds.size > 0
                          ? `${selectedUserIds.size}人を追加`
                          : 'メンバーを追加'}
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>

            {/* メンバー一覧セクション */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base">現在のメンバー</CardTitle>
                    <CardDescription>{members.length}人</CardDescription>
                  </div>
                  {selectedMemberIds.size > 0 && (
                    <span className="text-sm text-muted-foreground">
                      {selectedMemberIds.size}人選択中
                    </span>
                  )}
                </div>
              </CardHeader>
              <CardContent className="grid gap-4">
                {members.length === 0 ? (
                  <p className="text-muted-foreground text-center text-sm">
                    メンバーがいません
                  </p>
                ) : (
                  <>
                    <div className="max-h-[300px] space-y-2 overflow-y-auto rounded-md border p-3">
                      {members.map((member) => (
                        <div
                          key={member.id}
                          className="flex items-center space-x-2"
                        >
                          <Checkbox
                            id={`member-${member.user.id}`}
                            checked={selectedMemberIds.has(member.user.id)}
                            onCheckedChange={(checked) =>
                              handleToggleMember(member.user.id, !!checked)
                            }
                          />
                          <Label
                            htmlFor={`member-${member.user.id}`}
                            className="flex-1  text-sm font-normal"
                          >
                            <div>
                              <p>{member.user.name || member.user.email}</p>
                              {member.user.name && (
                                <p className="text-muted-foreground text-xs">
                                  {member.user.email}
                                </p>
                              )}
                            </div>
                          </Label>
                        </div>
                      ))}
                    </div>
                    <Button
                      onClick={handleRemoveMembers}
                      disabled={selectedMemberIds.size === 0 || isRemoving}
                      variant="destructive"
                      className="w-full "
                    >
                      <UserMinus />
                      {isRemoving
                        ? '削除中...'
                        : selectedMemberIds.size > 0
                          ? `${selectedMemberIds.size}人を削除`
                          : 'メンバーを削除'}
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
