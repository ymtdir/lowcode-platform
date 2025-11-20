import {
  pointerWithin,
  rectIntersection,
  CollisionDetection,
} from '@dnd-kit/core';

/**
 * ワークスペースルートのID
 */
const WORKSPACE_ROOT_ID = 'workspace-root';

/**
 * カスタム衝突検出：ワークスペースルート/メニューを優先
 */
export const customCollisionDetection: CollisionDetection = (args) => {
  // まずpointerWithinで検出
  const pointerCollisions = pointerWithin(args);

  // ポインターが何かの上にある場合はそれを使用
  if (pointerCollisions.length > 0) {
    return pointerCollisions;
  }

  // rectIntersectionで検出
  const intersectingCollisions = rectIntersection(args);

  // ワークスペースルートまたはメニューが含まれている場合は優先
  const workspaceCollision = intersectingCollisions.find(
    (collision) =>
      collision.id === WORKSPACE_ROOT_ID || collision.id === 'workspace-menu'
  );

  if (workspaceCollision) {
    return [workspaceCollision];
  }

  return intersectingCollisions;
};

export { WORKSPACE_ROOT_ID };
