'use client';

import { useMemo, createElement } from 'react';

import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getItemIcon } from '@/features/item/utils';
import { ITEM_CONFIGS } from '@/features/item/constants';
import { CreateItemButton } from '@/features/item/components';
import type { Item } from '@/features/item/types';

type WorkspaceLayoutProps = {
  items: Item[];
};

function GridItem({ item }: { item: Item }) {
  const router = useRouter();
  const icon = useMemo(() => getItemIcon(item), [item]);
  const DefaultIcon = ITEM_CONFIGS[item.type].icon;

  const handleClick = () => {
    router.push(`/${item.id}`);
  };

  return (
    <div className="cursor-pointer" onClick={handleClick}>
      <Card className="flex flex-col h-full p-4 hover:bg-accent/50 transition-colors">
        <div className="flex justify-end mb-2">
          <Badge variant="secondary" className="flex items-center">
            <DefaultIcon className="size-5!" />
          </Badge>
        </div>
        <div className="flex-1 flex items-center justify-center">
          {createElement(icon, { className: 'size-12 text-primary' })}
        </div>
        <div className="text-center mt-2">
          <h2 className="font-semibold text-lg line-clamp-2">{item.name}</h2>
        </div>
      </Card>
    </div>
  );
}

export function WorkspaceLayout({ items }: WorkspaceLayoutProps) {
  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">ワークスペース</h1>
      </div>

      <div className="mb-6 flex items-center justify-end">
        <CreateItemButton />
      </div>

      {items.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {items.map((item) => (
            <GridItem key={item.id} item={item} />
          ))}
        </div>
      ) : (
        <div className="rounded-lg border p-8 text-center">
          <p className="text-muted-foreground">ワークスペースがありません</p>
          <p className="text-sm text-muted-foreground mt-2">
            サイドバーの「ワークスペース」から新しいアイテムを作成できます
          </p>
        </div>
      )}
    </div>
  );
}
