import { getItems } from '@/features/item/api';
import { WorkspaceLayout } from '@/features/workspace/components';

export const dynamic = 'force-dynamic';

/**
 * ワークスペースページ
 */
export default async function WorkspacePage() {
  const items = await getItems();

  return <WorkspaceLayout items={items} />;
}
