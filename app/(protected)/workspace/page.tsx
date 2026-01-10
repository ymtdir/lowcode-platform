import { getItems } from '@/features/item/api';
import { WorkspaceLayout } from '@/features/workspace/components';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

/**
 * ワークスペースページ
 */
export default async function WorkspacePage() {
  const [items, currentUser] = await Promise.all([
    getItems(),
    getCurrentUser(),
  ]);

  const canEdit =
    currentUser?.role === 'ADMIN' || currentUser?.role === 'DEVELOPER';

  return <WorkspaceLayout items={items} canEdit={canEdit} />;
}
