'use client';

import { Table } from 'lucide-react';
import { DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';

type CreateTableItemProps = {
  workspaceId: string;
};

export function CreateTableItem({ workspaceId }: CreateTableItemProps) {
  const handleClick = () => {
    toast.info('テーブル作成機能は未実装です', {
      description: `workspaceId: ${workspaceId}`,
    });
  };

  return (
    <DropdownMenuItem onSelect={handleClick}>
      <Table />
      テーブルを追加
    </DropdownMenuItem>
  );
}
